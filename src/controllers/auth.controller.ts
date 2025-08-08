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

    
    
    
    
    
    
    
    
    

    
    
    res.status(200).json({ status: 'success', user, token });
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
    
    
    
    
    
    
    
    
    
    
    
    res.status(200).json({ status: 'success', user, token });
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

  
  
  res.redirect(`${process.env.FRONTEND_URL}/callback?token=${token}`);
};



export const getSession = async (req: Request, res: Response) => {
  
  
  res.status(200).json({ user: req.user });
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.status(200).json({ message: 'If a user with that email exists, a reset code has been sent.' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    await authService.resetPassword(email, otp, newPassword);
    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};