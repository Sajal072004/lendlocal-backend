import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

const notificationService = new NotificationService();

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user!._id.toString();
        const notifications = await notificationService.getUserNotifications(userId);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve notifications." });
    }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user!._id.toString();
        const notification = await notificationService.markAsRead(notificationId, userId);
        res.status(200).json(notification);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};