import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.model';
import { ObjectId } from 'mongoose';



export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    
    
    req.user = (await User.findById(decoded.id).select('-password')) as IUser | undefined;

    if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
    }

    if (req.user.isDisabled) {
      return res.status(403).json({ message: 'Forbidden: Your account has been disabled.' });
    }
    
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};