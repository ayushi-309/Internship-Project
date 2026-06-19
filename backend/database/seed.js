import { getDatabase } from './db.js';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  const db = await getDatabase();

  // Check if users already exist
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  console.log('Seeding database with mock data...');

  // Create password hashes
  const adminHash = await bcrypt.hash('AdminPassword123', 10);
  const userHash = await bcrypt.hash('Password123', 10);

  // 1. Seed Users (Admin & Volunteers)
  const users = [
    {
      name: 'NayePankh Admin',
      email: 'admin@volunteer.org',
      password_hash: adminHash,
      role: 'admin',
      skills: 'Admin Support, Management',
      availability: 'both'
    },
    {
      name: 'John Doe',
      email: 'john@example.com',
      password_hash: userHash,
      role: 'volunteer',
      skills: 'Teaching, IT Support, Gardening',
      availability: 'both'
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password_hash: userHash,
      role: 'volunteer',
      skills: 'Cooking, Event Help, Marketing',
      availability: 'weekends'
    },
    {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      password_hash: userHash,
      role: 'volunteer',
      skills: 'Admin Support, Advocacy',
      availability: 'weekdays'
    }
  ];

  const userStmt = await db.prepare(
    'INSERT INTO users (name, email, password_hash, role, skills, availability) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const seededUsers = [];
  for (const u of users) {
    const res = await userStmt.run(u.name, u.email, u.password_hash, u.role, u.skills, u.availability);
    seededUsers.push({ id: res.lastID, ...u });
  }
  await userStmt.finalize();
  console.log(`Seeded ${seededUsers.length} users.`);

  // 2. Seed Events (Past & Future)
  const today = new Date();
  
  const formatDate = (offsetDays) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const events = [
    {
      title: 'Community Food Drive',
      description: 'NayePankh Foundation organizes a food distribution drive to provide meals and groceries to underserved families. Volunteers help pack, sort, and hand out food packages.',
      date: formatDate(5),
      time: '09:00',
      location: 'Downtown Community Center',
      skills_needed: 'Cooking, Event Help',
      max_volunteers: 15
    },
    {
      title: 'Youth Education Workshop',
      description: 'NayePankh Foundation\'s education initiative — teach basics of programming, math, or English to school kids. Mentors guide groups of 3-4 students through hands-on activities.',
      date: formatDate(10),
      time: '10:00',
      location: 'NayePankh Learning Hub — Room 402',
      skills_needed: 'IT Support, Teaching',
      max_volunteers: 8
    },
    {
      title: 'Green Park Cleanup Campaign',
      description: 'Join NayePankh Foundation\'s environment drive! Help clean up Green Park — collect litter, paint benches, and plant saplings. Wear comfortable clothes and bring gloves.',
      date: formatDate(2),
      time: '08:00',
      location: 'Green Park (Central Gates)',
      skills_needed: 'Gardening, Event Help',
      max_volunteers: null
    },
    {
      title: 'After-School Literacy Program',
      description: 'NayePankh Foundation\'s literacy mission — help kids with reading comprehension and homework. This recurring program empowers young learners with essential skills.',
      date: formatDate(-3),
      time: '15:30',
      location: 'Public Library (Kids Wing)',
      skills_needed: 'Teaching, Admin Support',
      max_volunteers: 10
    },
    {
      title: 'Charity Gala Organizing',
      description: 'NayePankh Foundation\'s annual fundraiser event. Volunteers helped set up registration counters, welcome guests, and clean up afterwards.',
      date: formatDate(-7),
      time: '18:00',
      location: 'Grand Plaza Ballroom',
      skills_needed: 'Event Help, Admin Support',
      max_volunteers: 20
    }
  ];

  const eventStmt = await db.prepare(
    'INSERT INTO events (title, description, date, time, location, skills_needed, max_volunteers) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const seededEvents = [];
  for (const e of events) {
    const res = await eventStmt.run(e.title, e.description, e.date, e.time, e.location, e.skills_needed, e.max_volunteers);
    seededEvents.push({ id: res.lastID, ...e });
  }
  await eventStmt.finalize();
  console.log(`Seeded ${seededEvents.length} events.`);

  // Find User IDs
  const john = seededUsers.find(u => u.email === 'john@example.com');
  const jane = seededUsers.find(u => u.email === 'jane@example.com');
  const bob = seededUsers.find(u => u.email === 'bob@example.com');

  // Find Event IDs
  const foodDrive = seededEvents.find(e => e.title === 'Community Food Drive');
  const codeWorkshop = seededEvents.find(e => e.title === 'Youth Education Workshop');
  const parkCleanup = seededEvents.find(e => e.title === 'Green Park Cleanup Campaign');
  const literacyProg = seededEvents.find(e => e.title === 'After-School Literacy Program');
  const galaOrg = seededEvents.find(e => e.title === 'Charity Gala Organizing');

  // 3. Seed Registrations
  const registrations = [
    // John
    { user_id: john.id, event_id: codeWorkshop.id, status: 'registered', hours_logged: 0, hours_approved: 0 },
    { user_id: john.id, event_id: literacyProg.id, status: 'attended', hours_logged: 3.5, hours_approved: 1 },
    { user_id: john.id, event_id: galaOrg.id, status: 'attended', hours_logged: 4.0, hours_approved: 1 },

    // Jane
    { user_id: jane.id, event_id: foodDrive.id, status: 'registered', hours_logged: 0, hours_approved: 0 },
    { user_id: jane.id, event_id: parkCleanup.id, status: 'registered', hours_logged: 0, hours_approved: 0 },
    { user_id: jane.id, event_id: galaOrg.id, status: 'attended', hours_logged: 5.0, hours_approved: 0 },

    // Bob
    { user_id: bob.id, event_id: literacyProg.id, status: 'attended', hours_logged: 2.0, hours_approved: 0 }
  ];

  const regStmt = await db.prepare(
    'INSERT INTO registrations (user_id, event_id, status, hours_logged, hours_approved) VALUES (?, ?, ?, ?, ?)'
  );

  for (const r of registrations) {
    await regStmt.run(r.user_id, r.event_id, r.status, r.hours_logged, r.hours_approved);
  }
  await regStmt.finalize();
  console.log(`Seeded ${registrations.length} registrations.`);
  console.log('Database seeding complete!');
}
