import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Admin, IAdmin } from '../models/Admin.model';


declare global {
  namespace Express {
    interface Request {
      admin?: IAdmin;
    }
  }
}

export const protectAdmin = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string, type: string };
    
    
    if (decoded.type !== 'admin') {
        return res.status(401).json({ message: 'Not authorized, invalid token type' });
    }

    
    req.admin = await Admin.findById(decoded.id).select('-password');

    if (!req.admin) {
        return res.status(401).json({ message: 'Admin not found' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};