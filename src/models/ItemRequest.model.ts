import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { ICommunity } from './Community.model';

export type ItemRequestStatus = 'open' | 'fulfilled' | 'closed';

// Interface for a single offer made on a request
export interface IOffer {
  offeredBy: IUser['_id'];
  message?: string;
  createdAt: Date;
}

// Main interface for the ItemRequest
export interface IItemRequest extends Document {
  requester: IUser['_id'];
  community: ICommunity['_id'];
  title: string; // e.g., "Looking for a stepladder"
  description: string;
  status: ItemRequestStatus;
  offers: IOffer[];
}

const OfferSchema: Schema = new Schema({
    offeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, trim: true },
}, { timestamps: true });

const ItemRequestSchema: Schema = new Schema({
  requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  community: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'fulfilled', 'closed'], default: 'open' },
  offers: [OfferSchema], // Embed offers within the request
}, { timestamps: true });

export const ItemRequest = mongoose.model<IItemRequest>('ItemRequest', ItemRequestSchema);