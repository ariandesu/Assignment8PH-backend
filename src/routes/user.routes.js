import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

// Name and photo updates go through Better Auth on the client (authClient.updateUser);
// this endpoint returns the identity the API sees in the verified JWT.
router.get('/me', verifyToken, userController.getProfile);

export default router;
