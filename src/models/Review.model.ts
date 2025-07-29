import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { IBorrowRequest } from './BorrowRequest.model';

// Interface for type safety
export interface IReview extends Document {
  rating: number;
  comment?: string;
  reviewer: IUser['_id'];
  reviewee: IUser['_id'];
  borrowRequest: IBorrowRequest['_id'];
}

const ReviewSchema: Schema = new Schema({
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // Ensures one review per transaction
  borrowRequest: { type: Schema.Types.ObjectId, ref: 'BorrowRequest', required: true, unique: true },
}, { timestamps: true });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);