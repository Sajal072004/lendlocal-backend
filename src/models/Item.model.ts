import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { ICommunity } from './Community.model';


export type AvailabilityStatus = 'available' | 'borrowed';


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
  photos: [{ type: String }], 
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  community: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
  availabilityStatus: { type: String, enum: ['available', 'borrowed'], default: 'available' },
}, { timestamps: true });

export const Item = mongoose.model<IItem>('Item', ItemSchema);