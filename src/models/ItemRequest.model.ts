import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { ICommunity } from './Community.model';

export interface IItemRequest extends Document {
  requestedBy: IUser['_id'];
  community: ICommunity['_id'];
  itemName: string;
  description: string;
  status: 'active' | 'fulfilled';
}

const ItemRequestSchema: Schema = new Schema({
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  community: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
  itemName: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['active', 'fulfilled'], default: 'active' },
}, { timestamps: true });

export const ItemRequest = mongoose.model<IItemRequest>('ItemRequest', ItemRequestSchema);