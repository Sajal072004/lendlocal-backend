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

export const respondToRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { response } = req.body; // 'approved' or 'denied'
    const lenderId = req.user!._id.toString();

    if (response !== 'approved' && response !== 'denied') {
      return res.status(400).json({ message: 'Invalid response value.' });
    }

    const updatedRequest = await borrowService.respondToRequest(requestId, lenderId, response);
    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    const requests = await borrowService.getRequests(userId);
    res.status(200).json(requests);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
