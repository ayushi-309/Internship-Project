import { getDatabase } from '../database/db.js';

export async function registerForEvent(req, res) {
  const { eventId } = req.body;
  const userId = req.user.id;

  if (!eventId) {
    return res.status(400).json({ message: 'Event ID is required.' });
  }

  try {
    const db = await getDatabase();

    // 1. Check if event exists
    const event = await db.get('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // 2. Check if event date is in the past
    const todayStr = new Date().toISOString().split('T')[0];
    if (event.date < todayStr) {
      return res.status(400).json({ message: 'Cannot register for past events.' });
    }

    // 3. Check capacity if restricted
    if (event.max_volunteers !== null) {
      const activeCount = await db.get(
        "SELECT COUNT(*) as count FROM registrations WHERE event_id = ? AND status = 'registered'",
        [eventId]
      );
      if (activeCount.count >= event.max_volunteers) {
        return res.status(400).json({ message: 'This event has reached maximum capacity.' });
      }
    }

    // 4. Check if already registered (even if cancelled, we can reactive it)
    const existing = await db.get(
      'SELECT id, status FROM registrations WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );

    if (existing) {
      if (existing.status === 'registered') {
        return res.status(400).json({ message: 'You are already registered for this event.' });
      } else {
        // Reactivate registration
        await db.run(
          "UPDATE registrations SET status = 'registered', hours_logged = 0.0, hours_approved = 0 WHERE id = ?",
          [existing.id]
        );
        return res.json({ message: 'Successfully re-registered for event!' });
      }
    }

    // 5. Insert new registration
    await db.run(
      "INSERT INTO registrations (user_id, event_id, status) VALUES (?, ?, 'registered')",
      [userId, eventId]
    );

    return res.status(201).json({ message: 'Successfully registered for event!' });
  } catch (error) {
    console.error('Register for event error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function cancelRegistration(req, res) {
  const { eventId } = req.params;
  const userId = req.user.id;

  try {
    const db = await getDatabase();

    const registration = await db.get(
      'SELECT id, status, hours_approved FROM registrations WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    if (registration.status === 'attended') {
      return res.status(400).json({ message: 'Cannot cancel registration for events you already attended.' });
    }

    // Update registration status to cancelled (or delete, but updating allows us to track history)
    await db.run(
      "UPDATE registrations SET status = 'cancelled' WHERE id = ?",
      [registration.id]
    );

    return res.json({ message: 'Registration cancelled successfully.' });
  } catch (error) {
    console.error('Cancel registration error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function logHours(req, res) {
  const { eventId, hours } = req.body;
  const userId = req.user.id;

  if (!eventId || hours === undefined) {
    return res.status(400).json({ message: 'Event ID and hours are required.' });
  }

  const parsedHours = parseFloat(hours);
  if (isNaN(parsedHours) || parsedHours <= 0) {
    return res.status(400).json({ message: 'Hours must be a positive number.' });
  }

  try {
    const db = await getDatabase();

    // Check if event exists
    const event = await db.get('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (event.date > todayStr) {
      return res.status(400).json({ message: 'Hours can only be logged on or after the event date.' });
    }

    // Check if user has a registration
    const registration = await db.get(
      'SELECT id, status FROM registrations WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );

    if (!registration) {
      // Create a registration with status 'attended' and hours if they forgot to register but attended
      await db.run(
        "INSERT INTO registrations (user_id, event_id, status, hours_logged, hours_approved) VALUES (?, ?, 'attended', ?, 0)",
        [userId, eventId, parsedHours]
      );
      return res.status(201).json({ message: 'Hours logged successfully and pending admin approval.' });
    }

    if (registration.hours_approved === 1) {
      return res.status(400).json({ message: 'Hours for this event have already been approved and cannot be updated.' });
    }

    // Update registration
    await db.run(
      "UPDATE registrations SET status = 'attended', hours_logged = ?, hours_approved = 0 WHERE id = ?",
      [parsedHours, registration.id]
    );

    return res.json({ message: 'Hours logged successfully and pending admin approval.' });
  } catch (error) {
    console.error('Log hours error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function getMyHistory(req, res) {
  const userId = req.user.id;

  try {
    const db = await getDatabase();
    const history = await db.all(
      `SELECT r.id as registration_id, r.status, r.hours_logged, r.hours_approved, r.created_at as registration_date,
              e.id as event_id, e.title, e.description, e.date as event_date, e.time, e.location
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.user_id = ?
       ORDER BY e.date DESC`,
      [userId]
    );

    return res.json({ history });
  } catch (error) {
    console.error('Get my history error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
