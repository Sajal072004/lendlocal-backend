import { Notification, INotification, NotificationType } from '../models/Notification.model';
import { io } from '../socket'; // Import the initialized io instance

interface INotificationData {
    recipient: string;
    sender: string;
    type: NotificationType;
    message: string;
    link: string;
}

export class NotificationService {
    /**
     * Creates a notification and emits a real-time event to the recipient.
     */
    public async createNotification(data: INotificationData): Promise<INotification> {
        // 1. Save the notification to the database
        const notification = await Notification.create(data);
        const populatedNotification = await notification.populate('sender', 'name profilePicture');

        // 2. Emit a 'notification' event to the recipient's personal room
        io.to(data.recipient).emit('new_notification', populatedNotification);

        return populatedNotification;
    }

    /**
     * Gets all notifications for a specific user.
     */
    public async getUserNotifications(userId: string): Promise<INotification[]> {
      return Notification.find({ recipient: userId })
          .populate('sender', 'name profilePicture')
          .sort({ createdAt: -1 });
  }

  /**
   * Marks a specific notification as read.
   */
  public async markAsRead(notificationId: string, userId: string): Promise<INotification> {
      const notification = await Notification.findOne({ _id: notificationId, recipient: userId });
      if (!notification) {
          throw new Error("Notification not found or you're not authorized to view it.");
      }
      notification.isRead = true;
      await notification.save();
      return notification;
  }
}