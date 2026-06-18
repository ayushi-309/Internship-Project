import { getDatabase } from '../database/db.js';

export async function updateProfile(req, res) {
  const { name, skills, availability } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Name is required.' });
  }

  if (!['weekdays', 'weekends', 'both'].includes(availability || 'both')) {
    return res.status(400).json({ message: 'Invalid availability value.' });
  }

  try {
    const db = await getDatabase();
    
    await db.run(
      'UPDATE users SET name = ?, skills = ?, availability = ? WHERE id = ?',
      [String(name).trim(), skills || '', availability || 'both', userId]
    );

    const updatedUser = await db.get(
      'SELECT id, name, email, role, skills, availability, status FROM users WHERE id = ?',
      [userId]
    );

    return res.json({
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function getDashboardStats(req, res) {
  const userId = req.user.id;

  try {
    const db = await getDatabase();

    // 1. Total Approved Hours
    const hoursApprovedRow = await db.get(
      'SELECT SUM(hours_logged) as total FROM registrations WHERE user_id = ? AND hours_approved = 1',
      [userId]
    );
    const approvedHours = hoursApprovedRow.total || 0;

    // 2. Total Pending Hours
    const hoursPendingRow = await db.get(
      'SELECT SUM(hours_logged) as total FROM registrations WHERE user_id = ? AND hours_approved = 0 AND hours_logged > 0',
      [userId]
    );
    const pendingHours = hoursPendingRow.total || 0;

    // 3. Registered Events count
    const registeredCountRow = await db.get(
      "SELECT COUNT(*) as count FROM registrations WHERE user_id = ? AND status = 'registered'",
      [userId]
    );
    const registeredCount = registeredCountRow.count || 0;

    // 4. Upcoming registered events list
    const todayStr = new Date().toISOString().split('T')[0];
    const registeredEvents = await db.all(
      `SELECT r.id as registration_id, e.id as event_id, e.title, e.description, e.date, e.time, e.location 
       FROM registrations r 
       JOIN events e ON r.event_id = e.id 
       WHERE r.user_id = ? AND r.status = 'registered' AND e.date >= ? 
       ORDER BY e.date ASC`,
      [userId, todayStr]
    );

    // 5. Total hours history (approved or pending)
    const hoursHistory = await db.all(
      `SELECT r.id as registration_id, r.hours_logged, r.hours_approved, r.status, e.title, e.date
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.user_id = ? AND (r.hours_logged > 0 OR r.status = 'attended')
       ORDER BY e.date DESC`,
      [userId]
    );

    return res.json({
      stats: {
        approvedHours,
        pendingHours,
        registeredCount
      },
      registeredEvents,
      hoursHistory
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
