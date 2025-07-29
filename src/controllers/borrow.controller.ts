import { Request, Response } from 'express';
import { BorrowService } from '../services/borrow.service';

const borrowService = new BorrowService();

export const requestItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const borrowerId = req.user!._id.toString();

    const borrowRequest = await borrowService.createRequest(itemId, borrowerId);
    res.status(201).json(borrowRequest);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};