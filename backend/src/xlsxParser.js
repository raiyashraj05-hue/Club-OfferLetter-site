import XLSX from 'xlsx';

const COLUMN_MAPPINGS = {
  fullName: ['full_name', 'name', 'full name', 'student name', 'candidate name'],
  email: ['email', 'email_id', 'email id', 'mail', 'mail id', 'student email'],
  position: ['position', 'role', 'designation', 'post'],
  department: ['department', 'dept', 'team', 'team_name', 'department_name'],
  appointmentId: ['appointment_id', 'appointment id', 'appt id', 'id', 'record id'],
  appointmentDate: ['appointment_date', 'appointment date', 'date', 'issue date', 'issue_date'],
  joiningDate: ['joining_date', 'joining date', 'join date'],
  duration: ['duration', 'tenure'],
  status: ['status', 'state'],
  phone: ['phone', 'mobile', 'contact', 'phone_number'],
  college: ['college', 'institution', 'university'],
  registrationNumber: ['registration_number', 'registration number', 'reg no', 'reg_number'],
  batch: ['batch', 'student_batch', 'passing_year', 'grad_year', 'graduation_year'],
  documentFilename: ['document_filename', 'document filename', 'filename', 'file']
};

export function deriveStudentBatch(explicitBatch, regNo, email) {
  if (explicitBatch && String(explicitBatch).trim()) {
    const cleaned = String(explicitBatch).trim().replace(/^['"]|['"]$/g, '');
    if (cleaned) return cleaned;
  }
  if (regNo && typeof regNo === 'string') {
    const match = regNo.trim().match(/^(\d{2})[a-zA-Z]/);
    if (match) {
      const year = parseInt(match[1], 10);
      if (!isNaN(year)) {
        const batchYear = (year + 4) % 100;
        return String(batchYear).padStart(2, '0');
      }
    }
  }
  if (email && typeof email === 'string') {
    const match = email.match(/(?:20)?(\d{2})@/);
    if (match) {
      return match[1];
    }
  }
  return '25';
}

export function autoMapHeaders(rawHeaders) {
  const mapping = {};
  const normalizedRaw = rawHeaders.map(h => ({
    original: h,
    clean: strClean(h)
  }));

  for (const [targetKey, synonyms] of Object.entries(COLUMN_MAPPINGS)) {
    for (const syn of synonyms) {
      const synClean = strClean(syn);
      const match = normalizedRaw.find(item => item.clean === synClean || item.clean.includes(synClean));
      if (match) {
        mapping[targetKey] = match.original;
        break;
      }
    }
  }

  return mapping;
}

// Counts how many cells in a raw row match a known column-name synonym.
// Used to find the *real* header row in sheets that have banner/title rows above it.
function scoreHeaderRow(cells) {
  const cleanCells = cells.map(strClean).filter(Boolean);
  if (!cleanCells.length) return 0;

  let score = 0;
  for (const synonyms of Object.values(COLUMN_MAPPINGS)) {
    const matchesAny = synonyms.some(syn => {
      const synClean = strClean(syn);
      return cleanCells.some(c => c === synClean || c.includes(synClean));
    });
    if (matchesAny) score++;
  }
  return score;
}

// Scans the first N rows of a worksheet and returns the 0-based row index
// most likely to be the real header row (e.g. skips merged "TEAM NAME"
// banner rows that sit above the actual "S.NO / NAME / EMAIL / ..." header).
function detectHeaderRowIndex(worksheet, maxRowsToScan = 10) {
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: false, raw: false });

  let bestIndex = 0;
  let bestScore = -1;
  for (let i = 0; i < Math.min(maxRowsToScan, rows.length); i++) {
    const score = scoreHeaderRow(rows[i]);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}

// Returns true for rows that are section separators / banners rather than
// real data rows (e.g. a row where only one cell has text, like "CORE MEMBERS"
// or "Technical TEAM", and every mapped data field is empty).
function isSeparatorRow(row, detectedMapping) {
  const mappedValues = Object.keys(detectedMapping).map(key => row[detectedMapping[key]]);
  const nonEmptyMapped = mappedValues.filter(v => v !== undefined && v !== null && String(v).trim() !== '');
  if (nonEmptyMapped.length > 0) return false;

  const allValues = Object.values(row);
  const nonEmptyAll = allValues.filter(v => v !== undefined && v !== null && String(v).trim() !== '');
  // A true separator/banner row has at most one non-empty cell in the whole row
  // (e.g. just "CORE MEMBERS") and nothing landed in any mapped column.
  return nonEmptyAll.length <= 1;
}

export function parseAndValidateXLSX(fileBuffer) {
  let workbook;
  try {
    workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
  } catch (err) {
    throw new Error('Failed to parse XLSX file. Please ensure it is a valid .xlsx file.');
  }

  if (!workbook || !workbook.SheetNames || !workbook.SheetNames.length) {
    throw new Error('XLSX file is empty or missing data rows.');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Some sheets have a banner/title row (e.g. a merged "PHOTOGRAPHY TEAM" cell)
  // sitting above the real header row. Detect the real header row instead of
  // always assuming row 1, otherwise every column shifts and mapping breaks.
  const headerRowIndex = detectHeaderRowIndex(worksheet);

  const records = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    range: headerRowIndex
  });

  if (!records || !records.length) {
    throw new Error('XLSX file is empty or missing data rows.');
  }

  const rawHeaders = Object.keys(records[0]);
  const detectedMapping = autoMapHeaders(rawHeaders);

  const parsedRows = [];
  let validCount = 0;
  let attentionCount = 0;
  let invalidCount = 0;

  records.forEach((row, index) => {
    // +1 to move from 0-based index to 1-based, +1 more because headerRowIndex
    // is 0-based and the data starts the row *after* the header.
    const rowNum = headerRowIndex + index + 2;

    // Skip section-separator/banner rows (e.g. "CORE MEMBERS", "Technical TEAM")
    // that carry no real record data — they aren't parsing errors, just headings.
    if (isSeparatorRow(row, detectedMapping)) {
      return;
    }

    const getValue = (key) => {
      const colName = detectedMapping[key];
      if (colName && row[colName] !== undefined && row[colName] !== null) {
        const val = row[colName];
        if (val instanceof Date) {
          const day = String(val.getDate()).padStart(2, '0');
          const month = String(val.getMonth() + 1).padStart(2, '0');
          const year = val.getFullYear();
          return `${day}/${month}/${year}`;
        }
        return String(val).trim();
      }
      return '';
    };

    const fullName = getValue('fullName');
    const email = getValue('email').toLowerCase();
    const position = getValue('position');
    const department = getValue('department') || 'Technical';
    const apptId = getValue('appointmentId') || `SOL-2026-${String(rowNum).padStart(3, '0')}`;
    const date = getValue('appointmentDate') || '20/08/2026';
    const joiningDate = getValue('joiningDate');
    const duration = getValue('duration');
    const status = getValue('status') || 'Verified';
    const phone = getValue('phone');
    const college = getValue('college');
    const regNo = getValue('registrationNumber');
    const explicitBatch = getValue('batch');
    const batch = deriveStudentBatch(explicitBatch, regNo, email);
    const docFilename = getValue('documentFilename');

    const issues = [];

    if (!fullName) issues.push('Missing Full Name');
    if (!email) issues.push('Missing Email Address');
    else if (!isValidEmail(email)) issues.push('Invalid Email Format');

    let rowStatus = 'VALID';
    if (issues.length > 0) {
      if (!fullName || !email) {
        rowStatus = 'INVALID';
        invalidCount++;
      } else {
        rowStatus = 'ATTENTION';
        attentionCount++;
      }
    } else {
      validCount++;
    }

    parsedRows.push({
      rowNum,
      appointmentId: apptId,
      fullName,
      email,
      position: position || 'Core Member',
      department,
      team: department,
      appointmentDate: date,
      joiningDate,
      duration,
      status,
      phone,
      college,
      registrationNumber: regNo,
      batch,
      documentFilename: docFilename,
      statusCategory: rowStatus,
      issues
    });
  });

  return {
    rawHeaders,
    detectedMapping,
    headerRowIndex,
    summary: {
      total: parsedRows.length,
      valid: validCount,
      attention: attentionCount,
      invalid: invalidCount
    },
    rows: parsedRows
  };
}

function strClean(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
