import { Notification, INotification, NotificationType } from '../models/Notification.model';
import { User } from '../models/User.model';
import { io } from '../socket'; // Import the initialized io instance
import { sendEmail } from '../utils/email';

interface INotificationData {
    recipient: string;
    sender: string;
    type: NotificationType;
    message: string;
    link: string;
}

export class NotificationService {

    // Helper function to create a clean email subject
    private getSubjectForType(type: NotificationType): string {
      switch (type) {
          case 'new_borrow_request': return 'New Borrow Request';
          case 'request_approved': return 'Your Request was Approved';
          case 'request_denied': return 'Your Request was Denied';
          case 'new_offer': return 'You Received a New Offer';
          case 'offer_accepted': return 'Your Offer was Accepted';
          case 'new_follower': return 'You Have a New Follower';
          default: return 'You have a new notification';
      }
  }
    /**
     * Creates a notification and emits a real-time event to the recipient.
     */
    public async createNotification(data: INotificationData): Promise<INotification> {

        // --- ADD THIS BLOCK TO FETCH RECIPIENT ---
        const recipientUser = await User.findById(data.recipient);
        if (!recipientUser) {
            // If the recipient doesn't exist, we can't send a notification
            throw new Error("Recipient user not found.");
        }
        // ------------------------------------------


        // 1. Save the notification to the database
        const notification = await Notification.create(data);
        const populatedNotification = await notification.populate('sender', 'name profilePicture');

        // 2. Emit a 'notification' event to the recipient's personal room
        io.to(data.recipient).emit('new_notification', populatedNotification);


        // --- ADD THIS BLOCK TO SEND EMAIL ---
        try {
          await sendEmail({
              to: recipientUser.email,
              subject: `New Notification on LendLocal: ${this.getSubjectForType(data.type)}`,
              text: `Hi ${recipientUser.name},\n\n${data.message}\n\nYou can view it here: ${process.env.FRONTEND_URL}${data.link}\n\nThanks,\nThe LendLocal Team`
          });
      } catch (error) {
          console.error("Failed to send notification email:", error);
          // We don't throw an error here because the primary notification (socket/db) succeeded.
          // In a production app, you might add this to a retry queue.
      }
      // ------------------------------------

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