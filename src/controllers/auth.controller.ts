import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { generateToken } from '../utils/jwt';
import { IUser } from '../models/User.model';

const authService = new AuthService();

export const registerUser = async (req: Request, res: Response) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ message: error.message });
      }
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'An internal server error occurred' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { token, user } = await authService.login(req.body);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // Must be 'none' for cross-site cookies
      // Ensure your frontend URL is a subdomain of this, e.g., lendlocal-frontend.vercel.app
      domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined, 
      path: '/',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    res.status(200).json({ status: 'success', user });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: 'An internal server error occurred' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const { token, user } = await authService.verifyOtp(email, otp);
    
    // Set cookie and log the user in automatically upon verification
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // Must be 'none' for cross-site cookies
      // Ensure your frontend URL is a subdomain of this, e.g., lendlocal-frontend.vercel.app
      domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined, 
      path: '/',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    res.status(200).json({ status: 'success', user });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'An internal server error occurred' });
  }
};

export const googleAuthCallback = (req: Request, res: Response) => {
  const user = req.user as IUser | undefined;

  if (!user) {
    return res.status(401).json({ message: 'User authentication failed.' });
  }

  const token = generateToken(user._id.toString());

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none', // Must be 'none' for cross-site cookies
    // Ensure your frontend URL is a subdomain of this, e.g., lendlocal-frontend.vercel.app
    domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined, 
    path: '/',
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
};

// ... other controller functions

export const getSession = async (req: Request, res: Response) => {
  // This function is protected by the 'protect' middleware.
  // If the middleware passes, req.user is guaranteed to be attached.
  res.status(200).json({ user: req.user });
};