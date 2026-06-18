import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/db.js';

function getJwtSecret() {
  return process.env.JWT_SECRET || 'development-only-change-me';
}

export async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const [scheme, token] = authHeader ? authHeader.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const db = await getDatabase();
    const user = await db.get(
      'SELECT id, email, role, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({ message: 'User account no longer exists.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
    }

    // Always trust the current database role/status instead of stale token claims.
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
}

export function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized. Authentication required.' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  
  next();
}

export function isVolunteer(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized. Authentication required.' });
  }

  if (req.user.role !== 'volunteer') {
    return res.status(403).json({ message: 'Access denied. Volunteer account required.' });
  }

  next();
}
