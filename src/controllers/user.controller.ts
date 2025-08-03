import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

const userService = new UserService();

// For fetching any user's public profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userProfile = await userService.getProfileById(userId);
    res.status(200).json(userProfile);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};

// For a user to get their own full profile
export const getMyProfile = async (req: Request, res: Response) => {
    // The 'protect' middleware already attached the user object
    res.status(200).json(req.user);
};

// For a user to update their own profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    const updateData = req.body;

    // If a new profile picture was uploaded, add its URL to the update data
    if (req.file) {
      updateData.profilePicture = req.file.path;
    }

    const updatedUser = await userService.updateProfile(userId, updateData);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getBorrowingHistory = async (req: Request, res: Response) => {
  try {
      const userId = req.user!._id.toString();
      const history = await userService.getBorrowingHistory(userId);
      res.status(200).json(history);
  } catch (error) {
      res.status(500).json({ message: "Failed to retrieve borrowing history." });
  }
};

export const getLendingHistory = async (req: Request, res: Response) => {
  try {
      const userId = req.user!._id.toString();
      const history = await userService.getLendingHistory(userId);
      res.status(200).json(history);
  } catch (error) {
      res.status(500).json({ message: "Failed to retrieve lending history." });
  }
};

// ... other controller functions

export const getUserLentItems = async (req: Request, res: Response) => {
  try {
      const { userId } = req.params;
      const items = await userService.getLendingHistory(userId); // We can reuse this service
      res.status(200).json(items);
  } catch (error) {
      res.status(500).json({ message: "Failed to retrieve user's items." });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!._id;
    const users = await userService.findAllUsers(currentUserId.toString());
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve users." });
  }
};