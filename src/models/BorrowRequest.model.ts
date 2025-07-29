import mongoose, { Schema, Document } from 'mongoose';
import { IItem } from './Item.model';
import { IUser } from './User.model';

// Type definition for status
export type RequestStatus = 'pending' | 'approved' | 'denied' | 'returned' | 'cancelled';

// Interface for type safety
export interface IBorrowRequest extends Document {
  item: IItem['_id'];
  borrower: IUser['_id'];
  lender: IUser['_id'];
  status: RequestStatus;
  requestDate: Date;
  returnDate?: Date;
}

const BorrowRequestSchema: Schema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'denied', 'returned', 'cancelled'], default: 'pending' },
  requestDate: { type: Date, default: Date.now },
  returnDate: { type: Date },
}, { timestamps: true });

export const BorrowRequest = mongoose.model<IBorrowRequest>('BorrowRequest', BorrowRequestSchema);