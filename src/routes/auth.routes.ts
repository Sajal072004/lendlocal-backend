import { Router } from 'express';
import passport from 'passport';
import {
  registerUser,
  loginUser,
  googleAuthCallback,
  verifyOtp,
  getSession,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// ==> Password-based Routes <==
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
// ==> Google OAuth Routes <==
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleAuthCallback
);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/session', protect, getSession);

export default router;