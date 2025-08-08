import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { IConversation } from './Conversation.model';

export interface IMessage extends Document {
  sender: IUser['_id'];
  conversation: IConversation['_id'];
  content?: string; 
  imageUrl?: string; 
}

const MessageSchema: Schema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  content: { type: String, trim: true }, 
  imageUrl: { type: String }, 
}, { timestamps: true });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);