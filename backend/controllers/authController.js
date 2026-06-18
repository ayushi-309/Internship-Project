import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/db.js';

function getJwtSecret() {
  return process.env.JWT_SECRET || 'development-only-change-me';
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export async function register(req, res) {
  const { name, email, password, skills, availability } = req.body;
  const cleanName = String(name || '').trim();
  const cleanEmail = normalizeEmail(email);

  if (!cleanName || !cleanEmail || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  if (!['weekdays', 'weekends', 'both'].includes(availability || 'both')) {
    return res.status(400).json({ message: 'Invalid availability value.' });
  }

  try {
    const db = await getDatabase();

    // Check if email already exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.run(
      'INSERT INTO users (name, email, password_hash, role, skills, availability) VALUES (?, ?, ?, ?, ?, ?)',
      [
        cleanName,
        cleanEmail,
        hashedPassword,
        'volunteer', // default role
        skills || '',
        availability || 'both'
      ]
    );

    const userId = result.lastID;

    // Create token
    const newUser = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      role: 'volunteer',
      skills: skills || '',
      availability: availability || 'both',
      status: 'active'
    };

    return res.status(201).json({
      message: 'User registered successfully!',
      token: createToken(newUser),
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  const cleanEmail = normalizeEmail(email);

  if (!cleanEmail || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const db = await getDatabase();

    // Find user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Create token
    return res.json({
      message: 'Login successful!',
      token: createToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        availability: user.availability,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function getMe(req, res) {
  try {
    const db = await getDatabase();
    const user = await db.get('SELECT id, name, email, role, skills, availability, status, created_at FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
