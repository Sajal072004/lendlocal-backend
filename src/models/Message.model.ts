import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { IConversation } from './Conversation.model';

export interface IMessage extends Document {
  sender: IUser['_id'];
  conversation: IConversation['_id'];
  content?: string; // <-- Make content optional
  imageUrl?: string; // <-- Add imageUrl field
}

const MessageSchema: Schema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  content: { type: String, trim: true }, // <-- Content is no longer required
  imageUrl: { type: String }, // <-- Add imageUrl field
}, { timestamps: true });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);