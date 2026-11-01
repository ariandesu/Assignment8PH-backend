import { Router } from 'express';
import participantController from '../controllers/participant.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

router.get('/my-joined-events', verifyToken, participantController.getJoinedEvents);

export default router;
