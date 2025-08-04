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
    itemName?: string; // Optional, if applicable
    metadata?: { itemName?: string }; // Optional metadata object
}

export class NotificationService {

  private getSubjectForType(type: NotificationType, senderName: string, itemName?: string): string {
    const now = new Date();
    const dateTime = now.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }); // e.g., "Dec 15, 2:30 PM"
    
    switch (type) {
        case 'new_borrow_request': 
            return itemName 
                ? `${senderName} wants to borrow your ${itemName} - ${dateTime}`
                : `${senderName} sent you a borrow request - ${dateTime}`;
        
        case 'request_approved': 
            return itemName 
                ? `Great news! Your request for ${itemName} was approved - ${dateTime}`
                : `Your borrow request was approved - ${dateTime}`;
        
        case 'request_denied': 
            return itemName 
                ? `Update on your request for ${itemName} - ${dateTime}`
                : `Update on your borrow request - ${dateTime}`;
        
        case 'item_returned':
            return itemName 
                ? `${senderName} returned your ${itemName} - ${dateTime}`
                : `${senderName} returned your item - ${dateTime}`;
        
        case 'new_offer': 
            return itemName 
                ? `${senderName} made an offer on your ${itemName} - ${dateTime}`
                : `${senderName} sent you a new offer - ${dateTime}`;
        
        case 'offer_accepted': 
            return itemName 
                ? `${senderName} accepted your offer for ${itemName} - ${dateTime}`
                : `Your offer was accepted - ${dateTime}`;
        
        case 'new_follower': 
            return `${senderName} started following you on LendLocal - ${dateTime}`;
        
        case 'new_message':
            return `New message from ${senderName} - ${dateTime}`;
        
        case 'return_confirmed':
            return itemName 
                ? `Return confirmed for ${itemName} - ${dateTime}`
                : `Item return confirmed - ${dateTime}`;
        
        case 'new_join_request':
            return `${senderName} wants to join your group - ${dateTime}`;
        
        case 'new_item_request':
            return itemName 
                ? `${senderName} is looking for ${itemName} - ${dateTime}`
                : `${senderName} posted a new item request - ${dateTime}`;
        
        default: 
            return `${senderName} sent you a message on LendLocal - ${dateTime}`;
    }
}

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
          // Extract item name from the message or data if available
          const itemName = data.itemName || data.metadata?.itemName; // Add itemName to your INotificationData interface if needed
          
          const dynamicSubject = this.getSubjectForType(
              data.type, 
              populatedNotification.sender.name,
              itemName
          );

          

          const emailResponse = await sendEmail({
              to: recipientUser.email,
              subject: dynamicSubject,
              text: `Hi ${recipientUser.name},\n\n${populatedNotification.sender.name} ${data.message}\n\nYou can view it here: ${process.env.FRONTEND_URL}${data.link}\n\nThanks,\nThe LendLocal Team`
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