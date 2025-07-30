import { Request, Response } from 'express';
import { CommunityService } from '../services/community.service';

const communityService = new CommunityService();

export const createCommunity = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const ownerId = req.user!._id; // We get req.user from the 'protect' middleware

    const community = await communityService.create(name, description, ownerId.toString());
    res.status(201).json(community);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const joinCommunity = async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user!._id;

    const community = await communityService.join(inviteCode, userId.toString());
    res.status(200).json(community);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};

export const getUserCommunities = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const communities = await communityService.findByUser(userId.toString());
    res.status(200).json(communities);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getCommunityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const community = await communityService.findById(id, userId.toString());
    res.status(200).json(community);
  } catch (error) {
    const errorMessage = (error as Error).message;
    const statusCode = errorMessage.includes('authorized') ? 403 : 404;
    res.status(statusCode).json({ message: errorMessage });
  }
};