import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for type safety
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  reputationScore: number;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false }, // 'select: false' hides password from default queries
  reputationScore: { type: Number, default: 5, min: 1, max: 5 }, // Neutral starting score
}, { timestamps: true });

// Mongoose middleware to hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

export const User = mongoose.model<IUser>('User', UserSchema);