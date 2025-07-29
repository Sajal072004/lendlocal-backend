import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.model';

// This declaration merging adds the 'user' property to the Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
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
    
    // 4. Grant access to the protected route
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};