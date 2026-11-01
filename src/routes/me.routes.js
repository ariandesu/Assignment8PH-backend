import { Router } from 'express';
import eventController from '../controllers/event.controller.js';
import participantController from '../controllers/participant.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

// Routes scoped to the logged-in user
export const myEventsRouter = Router();
myEventsRouter.get('/', verifyToken, eventController.getMyEvents);

export const myJoinedEventsRouter = Router();
myJoinedEventsRouter.get('/', verifyToken, participantController.getJoinedEvents);
