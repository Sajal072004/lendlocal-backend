import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for GeoJSON Point
interface IPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// Update the main User interface
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId; // Ensure _id is included 
  name: string;
  email: string;
  password?: string;
  reputationScore: number;
  location?: IPoint; // Add optional location field
  googleId?: string; // <-- Add this
  profilePicture?: string; // <-- Add this
  isVerified: boolean;
  otp?: string;
  otpExpires?: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, select: false },
  googleId: { type: String, unique: true, sparse: true }, // <-- Add this
  profilePicture: { type: String }, // <-- Add this
  reputationScore: { type: Number, default: 5, min: 1, max: 5 },
  // Add the location field to the schema
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    }
  },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, select: false },
  otpExpires: { type: Date, select: false },
}, { timestamps: true });

// Create a 2dsphere index for efficient geospatial queries
UserSchema.index({ location: '2dsphere' });

// ... (keep the pre-save password hashing middleware)
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