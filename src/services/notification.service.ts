import { Notification, INotification, NotificationType } from '../models/Notification.model';
import { User } from '../models/User.model';
import { io } from '../socket'; 
import { sendEmail } from '../utils/email';

interface INotificationData {
    recipient: string;
    sender: string;
    type: NotificationType;
    message: string;
    link: string;
    itemName?: string; 
    metadata?: { itemName?: string }; 
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
    }); 
    
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
      
  
  const notification = await Notification.create(data);
  const populatedNotification = await notification.populate('sender', 'name profilePicture') as unknown as INotification & { sender: { name: string; profilePicture: string } };

  
  io.to(data.recipient).emit('new_notification', populatedNotification);

  
  const emailPreferenceKey = data.type as keyof typeof recipientUser.emailNotificationPreferences;
  
  
  if (recipientUser.emailNotificationPreferences[emailPreferenceKey] !== false) {
      
      try {
          
          const itemName = data.itemName || data.metadata?.itemName; 
          
          const dynamicSubject = this.getSubjectForType(
              data.type, 
              populatedNotification.sender.name,
              itemName
          );

          

          const emailResponse = await sendEmail({
            to: recipientUser.email,
            subject: dynamicSubject,
            html: `
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>LendLocal Notification</title>
                <style>
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                  }
                  
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    background-color: #f8f9fa;
                  }
                  
                  .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  }
                  
                  .header {
                    background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
                    padding: 30px 30px 20px;
                    text-align: center;
                  }
                  
                  .logo {
                    font-size: 28px;
                    font-weight: 700;
                    color: #ffffff;
                    letter-spacing: -0.5px;
                    margin-bottom: 6px;
                  }
                  
                  .tagline {
                    color: #e8ecff;
                    font-size: 13px;
                    font-weight: 400;
                  }
                  
                  .content {
                    padding: 35px 40px 25px;
                  }
                  
                  .greeting {
                    font-size: 18px;
                    font-weight: 600;
                    color: #2d3748;
                    margin-bottom: 24px;
                  }
                  
                  .notification-card {
                    background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                    border-left: 4px solid #2b6cb0;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                  }
                  
                  .sender-info {
                    display: flex;
                    align-items: center;
                    margin-bottom: 16px;
                  }
                  
                  .sender-avatar {
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ffffff;
                    font-weight: 600;
                    font-size: 16px;
                    margin-right: 12px;
                  }
                  
                  .sender-name {
                    font-size: 16px;
                    font-weight: 600;
                    color: #2d3748;
                  }
                  
                  .notification-message {
                    font-size: 16px;
                    color: #4a5568;
                    line-height: 1.5;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                  }
                  
                  .action-section {
                    text-align: center;
                    margin: 25px 0;
                  }
                  
                  .action-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                    color: #ffffff;
                    padding: 14px 28px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(72, 187, 120, 0.3);
                  }
                  
                  .action-button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(72, 187, 120, 0.4);
                  }
                  
                  .direct-link {
                    margin: 16px 0;
                    padding: 14px;
                    background-color: #f7fafc;
                    border-radius: 6px;
                    font-size: 13px;
                    color: #4a5568;
                  }
                  
                  .direct-link-label {
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: #2d3748;
                  }
                  
                  .direct-link-url {
                    word-break: break-all;
                    color: #667eea;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                  }
                  
                  .signature {
                    margin-top: 30px;
                    padding-top: 16px;
                    border-top: 1px solid #e2e8f0;
                    font-size: 15px;
                    color: #4a5568;
                  }
                  
                  .team-name {
                    font-weight: 600;
                    color: #667eea;
                  }
                  
                  .footer {
                    background-color: #f8f9fa;
                    padding: 25px 40px;
                    border-top: 1px solid #e2e8f0;
                  }
                  
                  .footer-content {
                    text-align: center;
                    font-size: 14px;
                    color: #718096;
                  }
                  
                  .footer-links {
                    margin: 20px 0;
                  }
                  
                  .footer-links a {
                    color: #667eea;
                    text-decoration: none;
                    margin: 0 15px;
                    font-weight: 500;
                  }
                  
                  .footer-links a:hover {
                    text-decoration: underline;
                  }
                  
                  .unsubscribe {
                    font-size: 12px;
                    color: #a0aec0;
                    margin-top: 20px;
                  }
                  
                  .unsubscribe a {
                    color: #a0aec0;
                    text-decoration: underline;
                  }
                  
                  .company-info {
                    font-size: 12px;
                    color: #a0aec0;
                    margin-top: 16px;
                  }
                  
                  @media (max-width: 640px) {
                    .content {
                      padding: 30px 20px;
                    }
                    
                    .header {
                      padding: 25px 20px 15px;
                    }
                    
                    .footer {
                      padding: 20px;
                    }
                    
                    .notification-card {
                      padding: 20px;
                    }
                    
                    .sender-info {
                      flex-direction: column;
                      text-align: center;
                    }
                    
                    .sender-avatar {
                      margin-right: 0;
                      margin-bottom: 8px;
                    }
                    
                    .action-button {
                      display: block;
                      margin: 0 auto;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="email-container">
                  <div class="header">
                    <div class="logo">LendLocal</div>
                    <div class="tagline">Connecting Communities Through Lending</div>
                  </div>
                  
                  <div class="content">
                    <div class="greeting">Hi ${recipientUser.name},</div>
                    
                    <div class="notification-card">
                      <div class="sender-info">
                        <div class="sender-name">${populatedNotification.sender.name}</div>
                      </div>
                      
                      <div class="notification-message">
                        ${data.message}
                      </div>
                    </div>
                    
                    <div class="action-section">
                      <a href="${process.env.FRONTEND_URL}${data.link}" class="action-button">
                        View Details
                      </a>
                    </div>
                    
                    <div class="direct-link">
                      <div class="direct-link-label">Direct Link:</div>
                      <div class="direct-link-url">${process.env.FRONTEND_URL}${data.link}</div>
                    </div>
                    
                    <div class="signature">
                      Thanks,<br>
                      <span class="team-name">The LendLocal Team</span>
                    </div>
                  </div>
                  
                  <div class="footer">
                    <div class="footer-content">
                      <div class="footer-links">
                        <a href="#">Dashboard</a>
                        <a href="#">Help Center</a>
                        <a href="#">Contact Support</a>
                        <a href="#">Settings</a>
                      </div>
                      
                      <div class="unsubscribe">
                        <a href="#">Manage notification preferences</a> | 
                        <a href="#">Unsubscribe from these emails</a>
                      </div>
                      
                      <div class="company-info">
                        © 2025 LendLocal Inc. All rights reserved.<br>
                        1234 Financial District, Suite 567, Business City, BC 12345<br>
                        This email was sent to ${recipientUser.email}
                      </div>
                    </div>
                  </div>
                </div>
              </body>
              </html>
            `,
            
            text: `Hi ${recipientUser.name},\n\n${populatedNotification.sender.name} ${data.message}\n\nYou can view it here: ${process.env.FRONTEND_URL}${data.link}\n\nThanks,\nThe LendLocal Team`
          });
          
          
      } catch (error) {
          console.error("Failed to send notification email:", error);
          
      }
  }

  
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