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
  saveKyc,
  checkUsernameAvailability,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();


router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleAuthCallback
);

router.get('/check-username', checkUsernameAvailability);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/session', protect, getSession);
router.post('/kyc', protect, saveKyc);

export default router;