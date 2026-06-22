import { getDatabase } from './db.js';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  const db = await getDatabase();

  const userCount = await db.get('SELECT COUNT(*) as count FROM users');

  if (userCount.count >= 16) {
    console.log('Professional demo data already seeded. Skipping.');
    return;
  }

  console.log('Resetting old demo data...');
  await db.exec(`
    DELETE FROM registrations;
    DELETE FROM events;
    DELETE FROM users;
  `);

  console.log('Seeding professional demo data...');

  const adminHash = await bcrypt.hash('Sunday123', 10);
  const userHash = await bcrypt.hash('Password123', 10);

  const users = [
    ['NayePankh Foundation Admin','nayepankh@gmail.com', adminHash, 'admin', 'Leadership, Management, Event Planning', 'both'],

    ['Ayushi Tiwari', 'ayushi@example.com', userHash, 'volunteer', 'Web Development, Teaching, Event Help', 'both'],
    ['Akshay Kumar', 'akshay@example.com', userHash, 'volunteer', 'Teaching, Public Speaking', 'weekends'],
    ['Sneha Verma', 'sneha@example.com', userHash, 'volunteer', 'Content Writing, Social Media', 'weekdays'],
    ['Aman Kumar', 'aman@example.com', userHash, 'volunteer', 'Event Help, Photography', 'both'],
    ['Riya Singh', 'riya@example.com', userHash, 'volunteer', 'Teaching, Counseling', 'weekends'],
    ['Rohan Gupta', 'rohan@example.com', userHash, 'volunteer', 'IT Support, Data Entry', 'weekdays'],
    ['Priya Mehta', 'priya@example.com', userHash, 'volunteer', 'Healthcare Support, Awareness', 'both'],
    ['Kunal Raj', 'kunal@example.com', userHash, 'volunteer', 'Logistics, Event Management', 'weekends'],
    ['Neha Yadav', 'neha@example.com', userHash, 'volunteer', 'Women Empowerment, Communication', 'both'],
    ['Arjun Patel', 'arjun@example.com', userHash, 'volunteer', 'Sports, Youth Mentoring', 'weekdays'],
    ['Meera Joshi', 'meera@example.com', userHash, 'volunteer', 'Fundraising, Outreach', 'both'],
    ['Dev Mishra', 'dev@example.com', userHash, 'volunteer', 'Graphic Design, Media', 'weekends'],
    ['Anjali Sinha', 'anjali@example.com', userHash, 'volunteer', 'Education, Library Support', 'weekdays'],
    ['Harsh Jain', 'harsh@example.com', userHash, 'volunteer', 'Digital Literacy, IT Support', 'both'],
    ['Simran Kaur', 'simran@example.com', userHash, 'volunteer', 'Food Distribution, Community Service', 'weekends']
  ];

  const userStmt = await db.prepare(
    'INSERT INTO users (name, email, password_hash, role, skills, availability) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const seededUsers = [];

  for (const u of users) {
    const res = await userStmt.run(...u);
    seededUsers.push({ id: res.lastID, email: u[1] });
  }

  await userStmt.finalize();

  const today = new Date();

  const formatDate = (offsetDays) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const events = [
    ['Blood Donation Camp', 'Organize and support a blood donation drive for nearby hospitals and emergency needs.', formatDate(2), '09:00', 'City Health Center', 'Healthcare Support, Event Help', 25],
    ['Tree Plantation Drive', 'Plant saplings and spread awareness about environmental protection.', formatDate(4), '08:30', 'Green Park', 'Gardening, Event Help', 30],
    ['Food Distribution Drive', 'Help pack and distribute meals to underserved families.', formatDate(6), '10:00', 'Community Kitchen', 'Food Distribution, Logistics', 20],
    ['Digital Literacy Workshop', 'Teach basic computer and internet skills to students and senior citizens.', formatDate(8), '11:00', 'NayePankh Learning Hub', 'IT Support, Teaching', 15],
    ['Women Empowerment Seminar', 'Support awareness sessions focused on education, self-confidence, and career guidance.', formatDate(10), '12:00', 'Town Hall', 'Communication, Counseling', 18],
    ['Clean India Campaign', 'Join a cleanliness drive and help create awareness about hygiene and waste management.', formatDate(12), '07:30', 'Main Market Area', 'Event Help, Awareness', 35],
    ['Education for All', 'Teach school children English, Math, and basic computer skills.', formatDate(14), '15:00', 'Public School Campus', 'Teaching, Education', 12],
    ['Old Age Home Visit', 'Spend time with senior citizens and support activity-based engagement.', formatDate(16), '16:00', 'Shanti Old Age Home', 'Communication, Community Service', 15],
    ['Orphanage Support Program', 'Help organize learning games, food support, and donation distribution.', formatDate(18), '10:30', 'Hope Orphanage', 'Teaching, Event Help', 20],
    ['Clothes Donation Drive', 'Collect, sort, and distribute clothes to needy people.', formatDate(20), '09:30', 'NayePankh Collection Center', 'Logistics, Community Service', 22],
    ['Career Guidance Session', 'Assist mentors in conducting career awareness sessions for students.', formatDate(22), '13:00', 'Youth Center Auditorium', 'Public Speaking, Counseling', 10],
    ['Animal Care Drive', 'Support stray animal feeding and awareness campaign.', formatDate(24), '08:00', 'Animal Shelter Road', 'Animal Care, Event Help', 16],
    ['Health Checkup Camp', 'Assist doctors and staff in a free health checkup camp.', formatDate(26), '09:00', 'Community Medical Hall', 'Healthcare Support, Admin Support', 25],
    ['Book Donation Campaign', 'Collect and organize books for students from low-income families.', formatDate(28), '11:00', 'Central Library', 'Library Support, Education', 18],
    ['Skill Development Workshop', 'Support a workshop on communication, resume building, and interview preparation.', formatDate(30), '14:00', 'Training Room 2', 'Communication, Mentoring', 15],

    ['Past Literacy Program', 'Completed literacy support program for young learners.', formatDate(-5), '15:30', 'Public Library', 'Teaching', 12],
    ['Past Charity Gala', 'Completed annual charity fundraising event.', formatDate(-10), '18:00', 'Grand Plaza Hall', 'Event Management', 20],
    ['Past Park Cleanup', 'Completed park cleanup and awareness campaign.', formatDate(-15), '08:00', 'Green Park', 'Gardening, Event Help', 25]
  ];

  const eventStmt = await db.prepare(
    'INSERT INTO events (title, description, date, time, location, skills_needed, max_volunteers) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const seededEvents = [];

  for (const e of events) {
    const res = await eventStmt.run(...e);
    seededEvents.push({ id: res.lastID, title: e[0] });
  }

  await eventStmt.finalize();

  const volunteers = seededUsers.filter(u => u.email !== 'admin@volunteer.org');

  const regStmt = await db.prepare(
    'INSERT INTO registrations (user_id, event_id, status, hours_logged, hours_approved) VALUES (?, ?, ?, ?, ?)'
  );

  let regCount = 0;

  for (let i = 0; i < volunteers.length; i++) {
    const volunteer = volunteers[i];

    const upcomingEvent = seededEvents[i % 15];
    await regStmt.run(volunteer.id, upcomingEvent.id, 'registered', 0, 0);
    regCount++;

    const pastEvent1 = seededEvents[15 + (i % 3)];
    await regStmt.run(volunteer.id, pastEvent1.id, 'attended', 2 + (i % 4), i % 3 === 0 ? 0 : 1);
    regCount++;

    if (i % 2 === 0) {
      const anotherEvent = seededEvents[(i + 3) % 15];
      await regStmt.run(volunteer.id, anotherEvent.id, 'registered', 0, 0);
      regCount++;
    }
  }

  await regStmt.finalize();

  console.log(`Seeded ${seededUsers.length} users.`);
  console.log(`Seeded ${seededEvents.length} events.`);
  console.log(`Seeded ${regCount} registrations.`);
  console.log('Professional database seeding complete!');
  console.log('Admin Login: admin@volunteer.org / AdminPassword123');
  console.log('Volunteer Login: ayushi@example.com / Password123');
}