import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';


export interface ICommunity extends Document {
  name: string;
  description: string;
  members: IUser['_id'][];
  owner: IUser['_id'];
  inviteCode: string;
}

const CommunitySchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  inviteCode: { type: String, required: true, unique: true },
}, { timestamps: true });

export const Community = mongoose.model<ICommunity>('Community', CommunitySchema);