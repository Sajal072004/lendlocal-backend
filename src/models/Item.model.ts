import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { ICommunity } from './Community.model';

// Type definition for status for better type safety
export type AvailabilityStatus = 'available' | 'borrowed';

// Interface for type safety
export interface IItem extends Document {
  name: string;
  description: string;
  category: string;
  photos: string[];
  owner: IUser['_id'];
  community: ICommunity['_id'];
  availabilityStatus: AvailabilityStatus;
}

const ItemSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  photos: [{ type: String }], // Array of image URLs
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  community: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
  availabilityStatus: { type: String, enum: ['available', 'borrowed'], default: 'available' },
}, { timestamps: true });

export const Item = mongoose.model<IItem>('Item', ItemSchema);