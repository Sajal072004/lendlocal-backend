import { Request, Response } from 'express';
import { ItemRequestService } from '../services/item-request.service';

const itemRequestService = new ItemRequestService();

export const createItemRequest = async (req: Request, res: Response) => {
  try {
    const requesterId = req.user!._id.toString();
    const { communityId, title, description } = req.body;

    const requestData = { requesterId, communityId, title, description };
    const itemRequest = await itemRequestService.create(requestData);

    res.status(201).json(itemRequest);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getOpenRequestsForCommunity = async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;
    const userId = req.user!._id.toString();

    const requests = await itemRequestService.findAllOpenByCommunity(communityId, userId);
    res.status(200).json(requests);
  } catch (error) {
    res.status(403).json({ message: (error as Error).message });
  }
};

export const makeOfferOnRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const offeredById = req.user!._id.toString();
    const { message } = req.body;

    const offerData = { itemRequestId: requestId, offeredById, message };
    const updatedRequest = await itemRequestService.addOffer(offerData);

    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const acceptOffer = async (req: Request, res: Response) => {
  try {
    const { requestId, offerId } = req.params;
    const requesterId = req.user!._id.toString();

    const borrowRequest = await itemRequestService.acceptOffer(requestId, offerId, requesterId);

    res.status(200).json({ 
        message: "Offer accepted successfully! A formal borrow request has been created.",
        borrowRequest 
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};