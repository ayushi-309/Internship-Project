import express from 'express';
import { registerForEvent, cancelRegistration, logHours, getMyHistory } from '../controllers/registrationController.js';
import { verifyToken, isVolunteer } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyToken, isVolunteer, registerForEvent);
router.delete('/:eventId', verifyToken, isVolunteer, cancelRegistration);
router.post('/log-hours', verifyToken, isVolunteer, logHours);
router.get('/my-history', verifyToken, isVolunteer, getMyHistory);

export default router;
