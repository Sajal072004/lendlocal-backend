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
   /**
     * Creates a notification for the website and conditionally sends an email based on user preferences.
     */
   public async createNotification(data: INotificationData): Promise<INotification & { sender: { name: string; profilePicture: string } }> {
    const recipientUser = await User.findById(data.recipient).select('+emailNotificationPreferences');
    if (!recipientUser) {
        throw new Error("Recipient user not found.");
    }
    
    // 1. Always create the notification record for the website.
    const notification = await Notification.create(data);
    const populatedNotification = await notification.populate('sender', 'name profilePicture') as unknown as INotification & { sender: { name: string; profilePicture: string } };

    // 2. Always emit the real-time event to update the website UI.
    io.to(data.recipient).emit('new_notification', populatedNotification);

    // 3. Check the user's EMAIL preferences before sending an email.
    const emailPreferenceKey = data.type as keyof typeof recipientUser.emailNotificationPreferences;
    if (recipientUser.emailNotificationPreferences[emailPreferenceKey] !== false) {
        try {
          await sendEmail({
              to: recipientUser.email,
              subject: `New Notification on LendLocal: ${this.getSubjectForType(data.type)}`,
              text: `Hi ${recipientUser.name},\n\nYou have a new notification: ${populatedNotification.sender.name} ${data.message}\n\nYou can view it here: ${process.env.FRONTEND_URL}${data.link}\n\nThanks,\nThe LendLocal Team`
          });
        } catch (error) {
          console.error("Failed to send notification email:", error);
          // We don't throw an error here because the main notification (on-site) was still successful.
        }
    }

    // 4. Always return the created notification object.
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