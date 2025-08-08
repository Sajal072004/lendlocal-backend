import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';

export interface IFollow extends Document {
  follower: IUser['_id']; 
  following: IUser['_id']; 
}

const FollowSchema: Schema = new Schema({
  follower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });


FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

export const Follow = mongoose.model<IFollow>('Follow', FollowSchema);