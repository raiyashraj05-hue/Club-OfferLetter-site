import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding initial database records...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@statsolocked.in';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // Seed Admin Account
  const existingAdmin = await prisma.admin.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.admin.create({
      data: {
        name: 'Stats-O-Locked Administrator',
        email: adminEmail,
        passwordHash,
        role: 'SUPER_ADMIN'
      }
    });
    console.log(`✓ Admin created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`✓ Admin already exists: ${adminEmail}`);
  }

  // Seed Mock Appointments if database is empty
  const count = await prisma.appointment.count();
  if (count === 0) {
    const mockAppointments = [
      {
        appointmentId: 'SOL-2026-001',
        fullName: 'Sankil Sudrik',
        email: 'sankil@statsolocked.in',
        position: 'Data Science Core Member',
        department: 'Technical',
        team: 'Technical Team',
        batch: '25',
        appointmentDate: '20 August 2026',
        joiningDate: '25 August 2026',
        duration: '1 Year',
        status: 'Verified',
        phone: '+91 9876543210',
        college: 'VIT Bhopal University',
        registrationNumber: '21BCE1001'
      },
      {
        appointmentId: 'SOL-2026-002',
        fullName: 'Shivam Waghule',
        email: 'shivam.waghule2025@vitbhopal.ac.in',
        position: 'Technical Team Lead',
        department: 'Technical',
        team: 'Technical Team',
        batch: '25',
        appointmentDate: '24 August 2026',
        joiningDate: '01 September 2026',
        duration: '1 Year',
        status: 'Verified',
        phone: '+91 9876543211',
        college: 'VIT Bhopal University',
        registrationNumber: '21BCE1002'
      },
      {
        appointmentId: 'SOL-2026-003',
        fullName: 'Aarav Sharma',
        email: 'aarav.sharma2026@vitbhopal.ac.in',
        position: 'Event Management Lead',
        department: 'Events',
        team: 'Event Management Team',
        batch: '26',
        appointmentDate: '24 August 2026',
        joiningDate: '01 September 2026',
        duration: '1 Year',
        status: 'Verified',
        phone: '+91 9876543212',
        college: 'VIT Bhopal University',
        registrationNumber: '22BCE1003'
      },
      {
        appointmentId: 'SOL-2026-004',
        fullName: 'Ananya Verma',
        email: 'ananya.verma2027@vitbhopal.ac.in',
        position: 'President',
        department: 'Panel',
        team: 'Panel',
        batch: '27',
        appointmentDate: '24 August 2026',
        joiningDate: '01 September 2026',
        duration: '1 Year',
        status: 'Verified',
        phone: '+91 9876543213',
        college: 'VIT Bhopal University',
        registrationNumber: '23BCE1004'
      },
      {
        appointmentId: 'SOL-2026-005',
        fullName: 'Priya Singh',
        email: 'priya.singh2025@vitbhopal.ac.in',
        position: 'Social Media Lead',
        department: 'Social Media',
        team: 'Social Media Team',
        batch: '25',
        appointmentDate: '24 August 2026',
        joiningDate: '01 September 2026',
        duration: '1 Year',
        status: 'Verified',
        phone: '+91 9876543214',
        college: 'VIT Bhopal University',
        registrationNumber: '21BCE1005'
      }
    ];

    for (const appt of mockAppointments) {
      await prisma.appointment.create({ data: appt });
    }
    console.log(`✓ Seeded ${mockAppointments.length} initial mock appointments.`);
  }

  console.log('Seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
