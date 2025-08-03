import { Request, Response } from 'express';
import { ItemRequestService } from '../services/item-request.service';

const itemRequestService = new ItemRequestService();

export const createItemRequest = async (req: Request, res: Response) => {
  try {
    const itemRequest = await itemRequestService.create(req.body, req.user!._id.toString());
    res.status(201).json(itemRequest);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getCommunityItemRequests = async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;
    const requests = await itemRequestService.findByCommunity(communityId);
    res.status(200).json(requests);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};