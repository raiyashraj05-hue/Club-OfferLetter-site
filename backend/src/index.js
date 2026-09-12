import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

import { generateAppointmentPDF } from './pdfGenerator.js';
import { parseAndValidateXLSX, deriveStudentBatch } from './xlsxParser.js';
import { authenticateAdmin } from './authMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

let libsql;
if (tursoUrl && tursoToken) {
  libsql = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });
} else {
  const localDbPath = path.resolve(__dirname, '../prisma/dev.db');
  libsql = createClient({
    url: `file:${localDbPath}`,
  });
}

const adapter = new PrismaLibSQL(libsql);

const prisma = new PrismaClient({
  adapter,
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'stats_o_locked_jwt_super_secret_key_2026';

// FIX FOR VERCEL: Use ephemeral /tmp directory in production, local folder otherwise
const UPLOADS_DIR = process.env.NODE_ENV === 'production'
  ? '/tmp/uploads'
  : path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Engine for PDF Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF files are allowed.'));
    }
  }
});

const uploadXLSX = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    const isXlsxExt = ext === '.xlsx';
    const isXlsxMime = mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                       mime === 'application/octet-stream' ||
                       mime === 'application/vnd.ms-excel' ||
                       mime === 'application/x-xlsx';
    if (isXlsxExt || (isXlsxExt && isXlsxMime)) {
      cb(null, true);
    } else {
      cb(new Error('Please upload an XLSX file. Only .xlsx files are allowed.'));
    }
  }
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend build static files if built
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// Helper: Record Audit Log
async function recordAuditLog(adminId, adminEmail, action, entityType, entityId, metadata = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: adminId || 'SYSTEM',
        adminEmail: adminEmail || 'system@statsolocked.in',
        action,
        entityType,
        entityId: String(entityId || ''),
        metadata: JSON.stringify(metadata)
      }
    });
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
}

// ==========================================================================
// 1. PUBLIC STUDENT PORTAL APIS
// ==========================================================================

// Student Email Verification & Lookup
app.post('/api/appointments/verify', async (req, res) => {
  try {
    const rawEmail = String(req.body.email || '').trim().toLowerCase();

    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
    }

    const appointment = await prisma.appointment.findFirst({
      where: { email: { equals: rawEmail } }
    });

    if (!appointment) {
      return res.status(404).json({
        ok: false,
        error: 'No appointment record found for this email. Please verify your email or contact the Stats-O-Locked team.'
      });
    }

    return res.json({
      ok: true,
      appointment: {
        id: appointment.id,
        appointmentId: appointment.appointmentId,
        fullName: appointment.fullName,
        email: appointment.email,
        position: appointment.position,
        department: appointment.department,
        team: appointment.team,
        appointmentDate: appointment.appointmentDate,
        joiningDate: appointment.joiningDate,
        duration: appointment.duration,
        batch: appointment.batch || deriveStudentBatch(appointment.batch, appointment.registrationNumber, appointment.email),
        status: appointment.status,
        hasDocument: !!appointment.documentUrl
      }
    });
  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ ok: false, error: 'Server error during appointment verification.' });
  }
});

// Student & Public Document Viewer / Download
app.get('/api/appointments/:id/document', async (req, res) => {
  try {
    const { id } = req.params;
    const download = req.query.download === 'true';

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return res.status(404).send('Appointment record not found.');
    }

    // Check if custom uploaded document exists
    if (appointment.documentUrl) {
      const diskPath = path.resolve(UPLOADS_DIR, path.basename(appointment.documentUrl));
      if (fs.existsSync(diskPath)) {
        if (download) {
          return res.download(diskPath, `${appointment.fullName.replace(/\s+/g, '_')}_Appointment_Letter.pdf`);
        }
        res.setHeader('Content-Type', 'application/pdf');
        return res.sendFile(diskPath);
      }
    }

    // Dynamic On-the-fly PDF Generation fallback
    const pdfBytes = await generateAppointmentPDF(appointment);
    const fileName = `${appointment.fullName.replace(/\s+/g, '_')}_Appointment_Letter.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    if (download) {
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    }
    return res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error('Document error:', err);
    return res.status(500).send('Error retrieving appointment document.');
  }
});

// ==========================================================================
// 2. ADMIN AUTHENTICATION APIS
// ==========================================================================

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({ ok: false, error: 'Email and Password are required.' });
    }

    const admin = await prisma.admin.findUnique({ where: { email: cleanEmail } });
    if (!admin) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: admin.role, name: admin.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await recordAuditLog(admin.id, admin.email, 'ADMIN_LOGIN', 'Admin', admin.id, { ip: req.ip });

    return res.json({
      ok: true,
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ ok: false, error: 'Server authentication error.' });
  }
});

// Current Admin Info
app.get('/api/admin/me', authenticateAdmin, async (req, res) => {
  return res.json({ ok: true, admin: req.admin });
});

// ==========================================================================
// 3. ADMIN DASHBOARD CONTROL CENTER APIS
// ==========================================================================

// Dashboard Statistics & Status Indicators
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const total = await prisma.appointment.count();
    const verified = await prisma.appointment.count({ where: { status: 'Verified' } });
    const pending = await prisma.appointment.count({ where: { status: 'Pending' } });
    const documents = await prisma.appointment.count({ where: { documentUrl: { not: null } } });

    return res.json({
      ok: true,
      stats: {
        total,
        verified,
        pending,
        documentsAvailable: documents
      },
      systemStatus: {
        database: 'ONLINE',
        storage: 'ONLINE',
        api: 'ONLINE',
        auth: 'ACTIVE'
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to fetch dashboard stats.' });
  }
});

// Get Paginated, Searchable, Filterable Appointments Table
app.get('/api/admin/appointments', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '25', 10);
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || 'All').trim();
    const department = String(req.query.department || 'All').trim();
    const sortBy = String(req.query.sortBy || 'createdAt').trim();
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const where = {};

    if (status !== 'All') {
      where.status = status;
    }

    if (department !== 'All') {
      where.department = department;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { appointmentId: { contains: search } },
        { position: { contains: search } }
      ];
    }

    const totalRecords = await prisma.appointment.count({ where });
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    const appointments = await prisma.appointment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    });

    const appointmentsWithBatch = appointments.map(appt => ({
      ...appt,
      batch: appt.batch || deriveStudentBatch(appt.batch, appt.registrationNumber, appt.email)
    }));

    return res.json({
      ok: true,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages
      },
      appointments: appointmentsWithBatch
    });
  } catch (err) {
    console.error('Fetch appointments error:', err);
    return res.status(500).json({ ok: false, error: 'Error loading appointments.' });
  }
});

// Single Appointment Details
app.get('/api/admin/appointments/:id', authenticateAdmin, async (req, res) => {
  try {
    const appointment = await prisma.appointment.findUnique({ where: { id: req.params.id } });
    if (!appointment) {
      return res.status(404).json({ ok: false, error: 'Appointment record not found.' });
    }
    return res.json({
      ok: true,
      appointment: {
        ...appointment,
        batch: appointment.batch || deriveStudentBatch(appointment.batch, appointment.registrationNumber, appointment.email)
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Error fetching record.' });
  }
});

// Add Single Appointment Record
app.post('/api/admin/appointments', authenticateAdmin, upload.single('document'), async (req, res) => {
  try {
    const body = req.body;
    const fullName = String(body.fullName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const position = String(body.position || '').trim();
    const department = String(body.department || 'Technical').trim();
    const team = String(body.team || department).trim();
    const appointmentDate = String(body.appointmentDate || '20/08/2026').trim();

    if (!fullName || !email || !position) {
      return res.status(400).json({ ok: false, error: 'Full Name, Email, and Position are required.' });
    }

    let appointmentId = String(body.appointmentId || '').trim();
    if (!appointmentId) {
      const count = await prisma.appointment.count();
      appointmentId = `SOL-2026-${String(count + 1).padStart(3, '0')}`;
    }

    const existingId = await prisma.appointment.findUnique({ where: { appointmentId } });
    if (existingId) {
      appointmentId = `SOL-2026-${Date.now().toString().substring(7)}`;
    }

    let documentUrl = null;
    let documentFilename = null;

    if (req.file) {
      documentUrl = `/uploads/${req.file.filename}`;
      documentFilename = req.file.originalname;
    }

    const regNo = String(body.registrationNumber || '').trim();
    const batch = body.batch ? String(body.batch).trim() : deriveStudentBatch(null, regNo, email);

    const newAppt = await prisma.appointment.create({
      data: {
        appointmentId,
        fullName,
        email,
        position,
        department,
        team,
        batch,
        appointmentDate,
        joiningDate: body.joiningDate || null,
        duration: body.duration || null,
        status: body.status || 'Verified',
        phone: body.phone || null,
        college: body.college || null,
        registrationNumber: regNo || null,
        documentUrl,
        documentFilename
      }
    });

    await recordAuditLog(req.admin.adminId, req.admin.email, 'CREATE_APPOINTMENT', 'Appointment', newAppt.id, { appointmentId });

    return res.json({ ok: true, appointment: newAppt });
  } catch (err) {
    console.error('Create appointment error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to create appointment record.' });
  }
});

// Edit Appointment Record
app.put('/api/admin/appointments/:id', authenticateAdmin, upload.single('document'), async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ ok: false, error: 'Appointment record not found.' });
    }

    const updateData = {
      fullName: body.fullName !== undefined ? String(body.fullName).trim() : existing.fullName,
      email: body.email !== undefined ? String(body.email).trim().toLowerCase() : existing.email,
      position: body.position !== undefined ? String(body.position).trim() : existing.position,
      department: body.department !== undefined ? String(body.department).trim() : existing.department,
      team: body.team !== undefined ? String(body.team).trim() : existing.team,
      batch: body.batch !== undefined ? String(body.batch).trim() : existing.batch,
      appointmentDate: body.appointmentDate !== undefined ? String(body.appointmentDate).trim() : existing.appointmentDate,
      joiningDate: body.joiningDate !== undefined ? String(body.joiningDate).trim() : existing.joiningDate,
      duration: body.duration !== undefined ? String(body.duration).trim() : existing.duration,
      status: body.status !== undefined ? String(body.status).trim() : existing.status,
      phone: body.phone !== undefined ? String(body.phone).trim() : existing.phone,
      college: body.college !== undefined ? String(body.college).trim() : existing.college,
      registrationNumber: body.registrationNumber !== undefined ? String(body.registrationNumber).trim() : existing.registrationNumber
    };

    if (req.file) {
      updateData.documentUrl = `/uploads/${req.file.filename}`;
      updateData.documentFilename = req.file.originalname;
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData
    });

    await recordAuditLog(req.admin.adminId, req.admin.email, 'EDIT_APPOINTMENT', 'Appointment', id, { updateData });

    return res.json({ ok: true, appointment: updated });
  } catch (err) {
    console.error('Update error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to update record.' });
  }
});

// Delete Appointment Record
app.delete('/api/admin/appointments/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.appointment.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ ok: false, error: 'Appointment record not found.' });
    }

    await prisma.appointment.delete({ where: { id } });

    await recordAuditLog(req.admin.adminId, req.admin.email, 'DELETE_APPOINTMENT', 'Appointment', id, {
      appointmentId: existing.appointmentId,
      fullName: existing.fullName
    });

    return res.json({ ok: true, message: 'Appointment record permanently deleted.' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to delete record.' });
  }
});

// Upload / Replace Document
app.post('/api/admin/appointments/:id/document', authenticateAdmin, upload.single('document'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Please select a PDF document to upload.' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        documentUrl: `/uploads/${req.file.filename}`,
        documentFilename: req.file.originalname
      }
    });

    await recordAuditLog(req.admin.adminId, req.admin.email, 'UPLOAD_DOCUMENT', 'Document', id, { filename: req.file.originalname });

    return res.json({ ok: true, appointment: updated });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Document upload failed.' });
  }
});

// ==========================================================================
// 4. XLSX BULK IMPORT SUITE APIS
// ==========================================================================

// Parse XLSX & Auto-Map Columns
app.post('/api/admin/import/xlsx-parse', authenticateAdmin, uploadXLSX.single('xlsxFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Please upload an XLSX file.' });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const parsedData = parseAndValidateXLSX(fileBuffer);

    // Clean temp file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.json({
      ok: true,
      rawHeaders: parsedData.rawHeaders,
      detectedMapping: parsedData.detectedMapping,
      summary: parsedData.summary,
      rows: parsedData.rows
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('XLSX Parse Error:', err);
    return res.status(400).json({ ok: false, error: err.message || 'Failed to parse XLSX file.' });
  }
});

// Confirm & Execute Bulk XLSX Import
app.post('/api/admin/import/confirm', authenticateAdmin, async (req, res) => {
  try {
    const { rows, duplicateStrategy = 'update' } = req.body;

    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ ok: false, error: 'No valid rows provided for import.' });
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const row of rows) {
      if (row.statusCategory === 'INVALID') {
        skippedCount++;
        errors.push({ rowNum: row.rowNum, name: row.fullName, email: row.email, reason: row.issues.join(', ') });
        continue;
      }

      try {
        const existing = await prisma.appointment.findFirst({
          where: {
            OR: [
              { appointmentId: row.appointmentId },
              { email: row.email }
            ]
          }
        });

        if (existing) {
          if (duplicateStrategy === 'skip') {
            skippedCount++;
            continue;
          } else if (duplicateStrategy === 'update') {
            await prisma.appointment.update({
              where: { id: existing.id },
              data: {
                fullName: row.fullName,
                email: row.email,
                position: row.position,
                department: row.department,
                team: row.department,
                appointmentDate: row.appointmentDate,
                joiningDate: row.joiningDate || existing.joiningDate,
                duration: row.duration || existing.duration,
                status: row.status || existing.status,
                phone: row.phone || existing.phone,
                college: row.college || existing.college,
                registrationNumber: row.registrationNumber || existing.registrationNumber,
                batch: row.batch || deriveStudentBatch(row.batch, row.registrationNumber, row.email)
              }
            });
            updatedCount++;
            continue;
          }
        }

        // Create new
        await prisma.appointment.create({
          data: {
            appointmentId: row.appointmentId || `SOL-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
            fullName: row.fullName,
            email: row.email,
            position: row.position,
            department: row.department,
            team: row.department,
            batch: row.batch || deriveStudentBatch(row.batch, row.registrationNumber, row.email),
            appointmentDate: row.appointmentDate || '20/08/2026',
            joiningDate: row.joiningDate || null,
            duration: row.duration || null,
            status: row.status || 'Verified',
            phone: row.phone || null,
            college: row.college || null,
            registrationNumber: row.registrationNumber || null,
            documentFilename: row.documentFilename || null
          }
        });
        insertedCount++;

      } catch (rowErr) {
        skippedCount++;
        errors.push({ rowNum: row.rowNum, name: row.fullName, email: row.email, reason: rowErr.message });
      }
    }

    await recordAuditLog(req.admin.adminId, req.admin.email, 'BULK_XLSX_IMPORT', 'Appointment', null, {
      insertedCount,
      updatedCount,
      skippedCount,
      totalProcessed: rows.length
    });

    return res.json({
      ok: true,
      summary: {
        total: rows.length,
        inserted: insertedCount,
        updated: updatedCount,
        skipped: skippedCount,
        errors
      }
    });

  } catch (err) {
    console.error('Import confirm error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to process bulk import.' });
  }
});

// Audit Logs API
app.get('/api/admin/audit-logs', authenticateAdmin, async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ ok: true, logs });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to load audit logs.' });
  }
});

// Express Error Handling Middleware for Multer / Upload Errors
app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ ok: false, error: err.message || 'File upload error.' });
  }
  next();
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  } else {
    res.send('Stats-O-Locked Backend REST API Server is running.');
  }
});

// Keep listen block for local testing only
if (process.env.NODE_ENV !== 'production' && process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// CRITICAL FOR VERCEL: Export the Express app instance
export default app;
