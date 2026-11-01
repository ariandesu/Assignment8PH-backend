import express from 'express';
import { Router } from 'express';
import eventController from '../controllers/event.controller.js';
import participantController from '../controllers/participant.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { verifyOwner } from '../middlewares/verifyOwner.js';
import { eventValidator } from '../validators/event.validator.js';

// Validation middleware wrapper
const validate = (validatorFn) => (req, res, next) => {
  const result = validatorFn(req.body);
  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.errors,
    });
  }
  next();
};

const router = Router();

// Public routes
router.get('/', eventController.getUpcomingEvents);
router.get('/recent', eventController.getRecentEvents);
router.get('/:id', eventController.getEventById);

// Protected routes
router.post('/', verifyToken, validate(eventValidator.create), eventController.createEvent);
router.get('/my-events', verifyToken, eventController.getMyEvents);
router.patch('/:id', verifyToken, verifyOwner, validate(eventValidator.update), eventController.updateEvent);
router.delete('/:id', verifyToken, verifyOwner, eventController.deleteEvent);

// Participant routes
router.post('/:id/join', verifyToken, participantController.joinEvent);

export default router;
