import express from 'express';
import { updateProfile, getDashboardStats } from '../controllers/volunteerController.js';
import { verifyToken, isVolunteer } from '../middleware/auth.js';

const router = express.Router();

router.put('/profile', verifyToken, isVolunteer, updateProfile);
router.get('/dashboard', verifyToken, isVolunteer, getDashboardStats);

export default router;
