import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

const userService = new UserService();


export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userProfile = await userService.getProfileById(userId);
    res.status(200).json(userProfile);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};


export const getMyProfile = async (req: Request, res: Response) => {
    
    res.status(200).json(req.user);
};


export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    const updateData = req.body;

    
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



export const getUserLentItems = async (req: Request, res: Response) => {
  try {
      const { userId } = req.params;
      const items = await userService.getLendingHistory(userId); 
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


export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
      const userId = req.user!._id;
      const preferences = req.body;
      await userService.updateNotificationPreferences(userId.toString(), preferences);
      res.status(200).json({ message: 'Notification preferences updated successfully.' });
  } catch (error) {
      res.status(400).json({ message: (error as Error).message });
  }
};

export const updateEmailNotificationPreferences = async (req: Request, res: Response) => {
  try {
      const userId = req.user!._id;
      const preferences = req.body;
      await userService.updateEmailNotificationPreferences(userId.toString(), preferences);
      res.status(200).json({ message: 'Email notification preferences updated successfully.' });
  } catch (error) {
      res.status(400).json({ message: (error as Error).message });
  }
};