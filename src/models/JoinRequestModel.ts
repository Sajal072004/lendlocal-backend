import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { ICommunity } from './Community.model';

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export interface IJoinRequest extends Document {
  community: ICommunity['_id'];
  user: IUser['_id'];
  status: JoinRequestStatus;
}

const JoinRequestSchema: Schema = new Schema({
  community: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });


JoinRequestSchema.index({ community: 1, user: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

export const JoinRequest = mongoose.model<IJoinRequest>('JoinRequest', JoinRequestSchema);