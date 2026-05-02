import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { generateToken } from '../utils/jwt';
import { User, IUser } from '../models/User.model';

const AADHAAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const authService = new AuthService();

export const registerUser = async (req: Request, res: Response) => {
  const { aadhaarNumber, panNumber, username } = req.body;

  if (aadhaarNumber && !AADHAAR_REGEX.test(aadhaarNumber)) {
    return res.status(400).json({ message: 'Invalid Aadhaar number. Must be exactly 12 digits.' });
  }
  if (panNumber && !PAN_REGEX.test(panNumber.toUpperCase())) {
    return res.status(400).json({ message: 'Invalid PAN number. Format: ABCDE1234F' });
  }
  if (username && !/^[a-z0-9_]{3,20}$/i.test(username)) {
    return res.status(400).json({ message: 'Username must be 3-20 characters: letters, numbers, underscores only.' });
  }

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



export const checkUsernameAvailability = async (req: Request, res: Response) => {
  const { username } = req.query;
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ message: 'Username required.' });
  }
  if (!/^[a-z0-9_]{3,20}$/i.test(username)) {
    return res.status(200).json({ available: false, message: 'Invalid format.' });
  }
  const exists = await User.findOne({ username: username.toLowerCase() });
  return res.status(200).json({ available: !exists });
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

export const saveKyc = async (req: Request, res: Response) => {
  const { aadhaarNumber, panNumber } = req.body;

  if (!aadhaarNumber || !panNumber) {
    return res.status(400).json({ message: 'Both Aadhaar number and PAN number are required.' });
  }
  if (!AADHAAR_REGEX.test(aadhaarNumber)) {
    return res.status(400).json({ message: 'Invalid Aadhaar number. Must be exactly 12 digits.' });
  }
  if (!PAN_REGEX.test(panNumber.toUpperCase())) {
    return res.status(400).json({ message: 'Invalid PAN number. Format: ABCDE1234F' });
  }

  try {
    const userId = (req.user as IUser)._id;
    const updated = await User.findByIdAndUpdate(
      userId,
      { aadhaarNumber, panNumber: panNumber.toUpperCase(), kycCompleted: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ message: 'KYC details saved successfully.', kycCompleted: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save KYC details.' });
  }
};