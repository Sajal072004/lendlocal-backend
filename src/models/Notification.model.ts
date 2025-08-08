import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';

export type NotificationType = 
    | 'new_borrow_request'
    | 'request_approved'
    | 'request_denied'
    | 'item_returned'
    | 'new_offer'
    | 'offer_accepted'
    | 'new_follower'
    | 'new_message'
    | 'return_confirmed'
    | 'new_join_request'
    | 'new_item_request'
    

export interface INotification extends Document {
  recipient: IUser['_id'];
  sender: IUser['_id'];
  type: NotificationType;
  message: string;
  link: string; 
  isRead: boolean;
}

const NotificationSchema: Schema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['new_borrow_request', 'request_approved', 'request_denied', 'item_returned', 'new_offer', 'offer_accepted', 'new_follower', 'new_message','new_item_request','return_confirmed'], required: true },
  message: { type: String, required: true },
  link: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);