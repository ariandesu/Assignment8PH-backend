import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

router.get('/me', verifyToken, userController.getProfile);
router.patch('/me', verifyToken, userController.updateProfile);

export default router;
