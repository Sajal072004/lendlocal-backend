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

export const returnItem = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const borrowerId = req.user!._id.toString();

    const updatedRequest = await borrowService.returnItem(requestId, borrowerId);
    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getRequestById = async (req: Request, res: Response) => {
  try {
      const { id } = req.params;
      const userId = req.user!._id;
      const request = await borrowService.findBorrowRequestById(id, userId.toString());
      res.status(200).json(request);
  } catch (error) {
      const errorMessage = (error as Error).message;
      const statusCode = errorMessage.includes('authorized') ? 403 : 404;
      res.status(statusCode).json({ message: errorMessage });
  }
};
