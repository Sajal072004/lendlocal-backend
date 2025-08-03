import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { IBorrowRequest } from './BorrowRequest.model';
import { IItem } from './Item.model'; // <-- IMPORT IItem

// Interface for type safety
export interface IReview extends Document {
  rating: number;
  comment?: string;
  reviewer: IUser['_id'];
  reviewee: IUser['_id'];
  borrowRequest: IBorrowRequest['_id'];
  item: IItem['_id']; // <-- ADD THIS LINE
}

const ReviewSchema: Schema = new Schema({
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  borrowRequest: { type: Schema.Types.ObjectId, ref: 'BorrowRequest', required: true },
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true }, // <-- ADD THIS LINE
}, { timestamps: true });

ReviewSchema.index({ borrowRequest: 1, reviewer: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);