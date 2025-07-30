import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { IItem } from './Item.model';

export type ReportType = 'user' | 'item';
export type ReportStatus = 'open' | 'under-review' | 'resolved' | 'dismissed';

export interface IReport extends Document {
  reporter: IUser['_id'];
  reportedUser?: IUser['_id']; // The user being reported
  reportedItem?: IItem['_id']; // The item being reported
  reportType: ReportType;
  reason: string; // The detailed reason for the report
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

// Add a compound index to prevent a user from spam-reporting the same thing
ReportSchema.index({ reporter: 1, reportedUser: 1, reportedItem: 1 }, { unique: true });

export const Report = mongoose.model<IReport>('Report', ReportSchema);