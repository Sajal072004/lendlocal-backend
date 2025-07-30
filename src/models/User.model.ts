import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for GeoJSON Point
interface IPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// Update the main User interface
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId; 
  name: string;
  email: string;
  password?: string;
  reputationScore: number;
  location?: IPoint;
  googleId?: string;
  profilePicture?: string;
  isVerified: boolean;
  otp?: string;
  otpExpires?: Date;
  isDisabled: boolean; // <-- ADD THIS
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, select: false },
  googleId: { type: String, unique: true, sparse: true },
  profilePicture: { type: String },
  reputationScore: { type: Number, default: 5, min: 1, max: 5 },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    }
  },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, select: false },
  otpExpires: { type: Date, select: false },
  isDisabled: { type: Boolean, default: false }, // <-- ADD THIS with a default value
}, { timestamps: true });

// Create a 2dsphere index for efficient geospatial queries
UserSchema.index({ location: '2dsphere' });

// pre-save password hashing middleware
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