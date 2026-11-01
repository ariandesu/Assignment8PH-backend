import { Router } from 'express';
import eventController from '../controllers/event.controller.js';
import participantController from '../controllers/participant.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { validate } from '../middlewares/validate.js';
import { eventValidator } from '../validators/event.validator.js';

const router = Router();

// Public routes
router.get('/', eventController.getUpcomingEvents);
router.get('/recent', eventController.getRecentEvents);
router.get('/:id', eventController.getEventById);

// Protected routes (ownership is checked inside the controllers)
router.post('/', verifyToken, validate(eventValidator.create), eventController.createEvent);
router.patch('/:id', verifyToken, validate(eventValidator.update), eventController.updateEvent);
router.delete('/:id', verifyToken, eventController.deleteEvent);

// Participation
router.post('/:id/join', verifyToken, participantController.joinEvent);
router.get('/:id/join-status', verifyToken, participantController.getJoinStatus);

export default router;
