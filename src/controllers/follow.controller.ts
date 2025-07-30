import { Request, Response } from 'express';
import { FollowService } from '../services/follow.service';

const followService = new FollowService();

export const follow = async (req: Request, res: Response) => {
    try {
        const followerId = req.user!._id.toString();
        const { userId: followingId } = req.params;
        await followService.followUser(followerId, followingId);
        res.status(200).json({ message: 'Successfully followed user.' });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const unfollow = async (req: Request, res: Response) => {
    try {
        const followerId = req.user!._id.toString();
        const { userId: followingId } = req.params;
        await followService.unfollowUser(followerId, followingId);
        res.status(200).json({ message: 'Successfully unfollowed user.' });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getFollowers = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const followers = await followService.getFollowers(userId);
        res.status(200).json(followers);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve followers.' });
    }
};

export const getFollowing = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const following = await followService.getFollowing(userId);
        res.status(200).json(following);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve users you are following.' });
    }
};