import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { IMessage } from './Message.model';

export interface IConversation extends Document {
  participants: IUser['_id'][];
  lastMessage?: IMessage['_id'];
}

const ConversationSchema: Schema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
}, { timestamps: true });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);