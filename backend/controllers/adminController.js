import { getDatabase } from '../database/db.js';

// Helper to escape values for CSV
function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function getVolunteers(req, res) {
  try {
    const db = await getDatabase();
    // Fetch volunteers and sum up their approved hours
    const query = `
      SELECT u.id, u.name, u.email, u.skills, u.availability, u.status, u.created_at,
             COALESCE(SUM(CASE WHEN r.hours_approved = 1 THEN r.hours_logged ELSE 0 END), 0) as total_hours
      FROM users u
      LEFT JOIN registrations r ON u.id = r.user_id
      WHERE u.role = 'volunteer'
      GROUP BY u.id
      ORDER BY u.name ASC
    `;
    const volunteers = await db.all(query);
    return res.json({ volunteers });
  } catch (error) {
    console.error('Get volunteers error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function toggleVolunteerStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body; // 'active' or 'inactive'

  if (!status || (status !== 'active' && status !== 'inactive')) {
    return res.status(400).json({ message: "Status must be 'active' or 'inactive'." });
  }

  try {
    const db = await getDatabase();
    
    // Check if user exists and is a volunteer
    const user = await db.get('SELECT role FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ message: 'Volunteer not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot change administrator status.' });
    }

    await db.run('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    return res.json({ message: `Volunteer status updated to ${status}.` });
  } catch (error) {
    console.error('Toggle status error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function getPendingHours(req, res) {
  try {
    const db = await getDatabase();
    const query = `
      SELECT r.id as registration_id, r.hours_logged, r.created_at as request_date,
             u.id as user_id, u.name as volunteer_name, u.email as volunteer_email,
             e.id as event_id, e.title as event_title, e.date as event_date
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      WHERE r.hours_logged > 0 AND r.hours_approved = 0
      ORDER BY r.created_at ASC
    `;
    const pending = await db.all(query);
    return res.json({ pending });
  } catch (error) {
    console.error('Get pending hours error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function approveHours(req, res) {
  const { registrationId } = req.params;
  const { approved, adjustedHours } = req.body; // approved is boolean, adjustedHours is optional number

  try {
    const db = await getDatabase();

    // Check if registration exists
    const reg = await db.get('SELECT * FROM registrations WHERE id = ?', [registrationId]);
    if (!reg) {
      return res.status(404).json({ message: 'Hours request not found.' });
    }

    if (approved) {
      const finalHours = adjustedHours !== undefined ? parseFloat(adjustedHours) : reg.hours_logged;
      if (isNaN(finalHours) || finalHours < 0) {
        return res.status(400).json({ message: 'Hours must be a non-negative number.' });
      }

      await db.run(
        "UPDATE registrations SET hours_approved = 1, hours_logged = ?, status = 'attended' WHERE id = ?",
        [finalHours, registrationId]
      );
      return res.json({ message: 'Hours approved successfully!' });
    } else {
      // Rejected
      await db.run(
        "UPDATE registrations SET hours_approved = -1, hours_logged = 0.0 WHERE id = ?",
        [registrationId]
      );
      return res.json({ message: 'Hours request rejected.' });
    }
  } catch (error) {
    console.error('Approve hours error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function getReportsSummary(req, res) {
  try {
    const db = await getDatabase();

    // 1. Core counters
    const volunteersCount = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'volunteer' AND status = 'active'");
    const eventsCount = await db.get("SELECT COUNT(*) as count FROM events WHERE date >= date('now')");
    const totalHoursResult = await db.get("SELECT SUM(hours_logged) as total FROM registrations WHERE hours_approved = 1");
    const pendingRequestsCount = await db.get("SELECT COUNT(*) as count FROM registrations WHERE hours_logged > 0 AND hours_approved = 0");

    const stats = {
      activeVolunteers: volunteersCount.count,
      totalEvents: eventsCount.count,
      totalHours: totalHoursResult.total || 0,
      pendingRequests: pendingRequestsCount.count
    };

    // 2. Hours by Event (for Bar Chart)
    const hoursByEvent = await db.all(`
      SELECT e.id, e.title, COALESCE(SUM(r.hours_logged), 0) as approved_hours
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id AND r.hours_approved = 1
      GROUP BY e.id
      ORDER BY approved_hours DESC
      LIMIT 6
    `);

    // 3. Skills Distribution (for Chart)
    const volunteers = await db.all("SELECT skills FROM users WHERE role = 'volunteer' AND status = 'active'");
    const skillCounts = {};
    volunteers.forEach(v => {
      if (v.skills) {
        v.skills.split(',').forEach(skill => {
          const s = skill.trim();
          if (s) {
            skillCounts[s] = (skillCounts[s] || 0) + 1;
          }
        });
      }
    });

    const skillsData = Object.entries(skillCounts).map(([name, count]) => ({
      name,
      value: count
    })).sort((a, b) => b.value - a.value);

    // 4. Monthly volunteer registration numbers (last 6 months)
    // In SQLite, strftime('%Y-%m', created_at) extracts year and month.
    const monthlyRegistrations = await db.all(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM users
      WHERE role = 'volunteer' AND created_at >= date('now', '-6 month')
      GROUP BY month
      ORDER BY month ASC
    `);

    return res.json({
      stats,
      hoursByEvent,
      skillsData,
      monthlyRegistrations
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function exportVolunteersCSV(req, res) {
  try {
    const db = await getDatabase();
    const query = `
      SELECT u.id, u.name, u.email, u.skills, u.availability, u.status, u.created_at,
             COALESCE(SUM(CASE WHEN r.hours_approved = 1 THEN r.hours_logged ELSE 0 END), 0) as total_hours
      FROM users u
      LEFT JOIN registrations r ON u.id = r.user_id
      WHERE u.role = 'volunteer'
      GROUP BY u.id
      ORDER BY total_hours DESC
    `;
    const volunteers = await db.all(query);

    let csvContent = 'ID,Name,Email,Skills,Availability,Status,Total Approved Hours,Joined Date\r\n';
    
    volunteers.forEach(v => {
      csvContent += `${v.id},${escapeCSV(v.name)},${escapeCSV(v.email)},${escapeCSV(v.skills)},${escapeCSV(v.availability)},${v.status},${v.total_hours},${v.created_at}\r\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=volunteers_report.csv');
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export volunteers CSV error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function exportEventsCSV(req, res) {
  try {
    const db = await getDatabase();
    const query = `
      SELECT e.id, e.title, e.date, e.time, e.location,
             (SELECT COUNT(*) FROM registrations WHERE event_id = e.id AND status = 'registered') as current_registrations,
             COALESCE(SUM(CASE WHEN r.hours_approved = 1 THEN r.hours_logged ELSE 0 END), 0) as approved_hours
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      GROUP BY e.id
      ORDER BY e.date DESC
    `;
    const events = await db.all(query);

    let csvContent = 'ID,Event Title,Date,Time,Location,Registered Volunteers,Approved Hours\r\n';

    events.forEach(e => {
      csvContent += `${e.id},${escapeCSV(e.title)},${e.date},${e.time},${escapeCSV(e.location)},${e.current_registrations},${e.approved_hours}\r\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=events_report.csv');
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export events CSV error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
