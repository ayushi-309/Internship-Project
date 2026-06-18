import express from 'express';
import { 
  getVolunteers, 
  toggleVolunteerStatus, 
  getPendingHours, 
  approveHours, 
  getReportsSummary,
  exportVolunteersCSV,
  exportEventsCSV
} from '../controllers/adminController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/volunteers', verifyToken, isAdmin, getVolunteers);
router.put('/volunteers/:id/status', verifyToken, isAdmin, toggleVolunteerStatus);
router.get('/pending-hours', verifyToken, isAdmin, getPendingHours);
router.put('/approve-hours/:registrationId', verifyToken, isAdmin, approveHours);
router.get('/reports/summary', verifyToken, isAdmin, getReportsSummary);
router.get('/reports/export/volunteers', verifyToken, isAdmin, exportVolunteersCSV);
router.get('/reports/export/events', verifyToken, isAdmin, exportEventsCSV);

export default router;
