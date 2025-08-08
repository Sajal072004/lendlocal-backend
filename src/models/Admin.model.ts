import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';


export type AdminRole = 'super-admin' | 'moderator' | 'support';

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}

const AdminSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, 
  role: { type: String, enum: ['super-admin', 'moderator', 'support'], required: true },
}, { timestamps: true });


AdminSchema.pre<IAdmin>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);