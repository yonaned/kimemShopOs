import { Router } from 'express';
import { register, sendOtp, verifyOtp, login, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.get('/me', authenticate, getMe);

export default router;