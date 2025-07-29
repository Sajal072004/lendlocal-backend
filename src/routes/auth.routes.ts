import { Router } from 'express';
import passport from 'passport';
import {
  registerUser,
  loginUser,
  googleAuthCallback,
  verifyOtp,
} from '../controllers/auth.controller';

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

export default router;