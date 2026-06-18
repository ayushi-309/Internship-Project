import { getDatabase } from '../database/db.js';

export async function getEvents(req, res) {
  const userId = req.user ? req.user.id : null;

  try {
    const db = await getDatabase();

    // Query all events, alongside current volunteer counts and individual user registrations.
    const query = `
      SELECT e.*, 
             (SELECT COUNT(*) FROM registrations WHERE event_id = e.id AND status = 'registered') as current_volunteers,
             (SELECT status FROM registrations WHERE event_id = e.id AND user_id = ?) as user_registration_status,
             (SELECT hours_logged FROM registrations WHERE event_id = e.id AND user_id = ?) as user_hours_logged,
             (SELECT hours_approved FROM registrations WHERE event_id = e.id AND user_id = ?) as user_hours_approved
      FROM events e
      ORDER BY e.date ASC
    `;

    const events = await db.all(query, [userId, userId, userId]);
    return res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function createEvent(req, res) {
  const { title, description, date, time, location, skills_needed, max_volunteers } = req.body;

  if (!title || !description || !date || !time || !location) {
    return res.status(400).json({ message: 'Title, description, date, time, and location are required.' });
  }

  try {
    const db = await getDatabase();
    
    const maxVol = max_volunteers === null || max_volunteers === '' || max_volunteers === undefined
      ? null
      : Number.parseInt(max_volunteers, 10);

    if (maxVol !== null && (!Number.isInteger(maxVol) || maxVol < 1)) {
      return res.status(400).json({ message: 'Maximum volunteers must be a positive whole number.' });
    }

    const result = await db.run(
      `INSERT INTO events (title, description, date, time, location, skills_needed, max_volunteers) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, date, time, location, skills_needed || '', maxVol]
    );

    const newEvent = {
      id: result.lastID,
      title,
      description,
      date,
      time,
      location,
      skills_needed: skills_needed || '',
      max_volunteers: maxVol
    };

    return res.status(201).json({
      message: 'Event created successfully!',
      event: newEvent
    });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function updateEvent(req, res) {
  const { id } = req.params;
  const { title, description, date, time, location, skills_needed, max_volunteers } = req.body;

  if (!title || !description || !date || !time || !location) {
    return res.status(400).json({ message: 'Title, description, date, time, and location are required.' });
  }

  try {
    const db = await getDatabase();
    
    // Check if event exists
    const event = await db.get('SELECT id FROM events WHERE id = ?', [id]);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const maxVol = max_volunteers === null || max_volunteers === '' || max_volunteers === undefined
      ? null
      : Number.parseInt(max_volunteers, 10);

    if (maxVol !== null && (!Number.isInteger(maxVol) || maxVol < 1)) {
      return res.status(400).json({ message: 'Maximum volunteers must be a positive whole number.' });
    }

    const registrationCount = await db.get(
      "SELECT COUNT(*) AS count FROM registrations WHERE event_id = ? AND status = 'registered'",
      [id]
    );
    if (maxVol !== null && maxVol < registrationCount.count) {
      return res.status(400).json({
        message: `Capacity cannot be lower than the ${registrationCount.count} current registrations.`
      });
    }

    await db.run(
      `UPDATE events 
       SET title = ?, description = ?, date = ?, time = ?, location = ?, skills_needed = ?, max_volunteers = ?
       WHERE id = ?`,
      [title, description, date, time, location, skills_needed || '', maxVol, id]
    );

    const updatedEvent = {
      id: parseInt(id, 10),
      title,
      description,
      date,
      time,
      location,
      skills_needed: skills_needed || '',
      max_volunteers: maxVol
    };

    return res.json({
      message: 'Event updated successfully!',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function deleteEvent(req, res) {
  const { id } = req.params;

  try {
    const db = await getDatabase();
    
    // Check if event exists
    const event = await db.get('SELECT id FROM events WHERE id = ?', [id]);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Delete event (foreign keys CASCADE will delete associated registrations)
    await db.run('DELETE FROM events WHERE id = ?', [id]);

    return res.json({ message: 'Event deleted successfully!' });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
