import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.model';
import { ObjectId } from 'mongoose';

// This declaration merging adds the 'user' property to the Express Request type
declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser; // The user property will hold the authenticated user
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // 1. Get the token from the http-only cookie
  if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // 2. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    
    // 3. Get user from the token and attach it to the request object
    req.user = (await User.findById(decoded.id).select('-password')) as IUser | undefined;

    if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
    }

    if (req.user.isDisabled) {
      // Clear the cookie to log them out on the frontend
      res.clearCookie('token');
      return res.status(403).json({ message: 'Forbidden: Your account has been disabled.' });
    }
    
    // 4. Grant access to the protected route
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};