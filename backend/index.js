import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { getDatabase } from './database/db.js';
import { seedDatabase } from './database/seed.js';

import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'NayePankh Foundation Volunteer API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);

async function startServer() {
  try {
    const db = await getDatabase();
    console.log('Database connected successfully.');

    await seedDatabase();

    const frontendDistPath = path.resolve(__dirname, '../frontend/dist');

    if (fs.existsSync(frontendDistPath)) {
      console.log(`Serving static files from ${frontendDistPath}`);

      app.use(express.static(frontendDistPath));

      app.get('*', (req, res, next) => {
        if (req.url.startsWith('/api')) {
          return next();
        }

        res.sendFile(path.join(frontendDistPath, 'index.html'));
      });
    } else {
      console.log('Frontend build folder not found. Running in API-only mode (development).');

      app.get('/', (req, res) => {
        res.json({
          message:
            'NayePankh Foundation Volunteer API is running. Start the frontend dev server to access the UI.'
        });
      });
    }

    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(`  Server is running on: http://localhost:${PORT}`);
      console.log(`===================================================`);
    });
  } catch (error) {
    console.error('Failed to initialize database or start server:', error);
    process.exit(1);
  }
}

startServer();