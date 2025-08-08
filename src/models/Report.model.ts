import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { IItem } from './Item.model';

export type ReportType = 'user' | 'item';
export type ReportStatus = 'open' | 'under-review' | 'resolved' | 'dismissed';

export interface IReport extends Document {
  reporter: IUser['_id'];
  reportedUser?: IUser['_id']; 
  reportedItem?: IItem['_id']; 
  reportType: ReportType;
  reason: string; 
  status: ReportStatus;
}

const ReportSchema: Schema = new Schema({
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportedUser: { type: Schema.Types.ObjectId, ref: 'User' },
  reportedItem: { type: Schema.Types.ObjectId, ref: 'Item' },
  reportType: { type: String, enum: ['user', 'item'], required: true },
  reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ['open', 'under-review', 'resolved', 'dismissed'], default: 'open' },
}, { timestamps: true });


ReportSchema.index({ reporter: 1, reportedUser: 1, reportedItem: 1 }, { unique: true });

export const Report = mongoose.model<IReport>('Report', ReportSchema);