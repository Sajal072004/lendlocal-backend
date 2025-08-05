import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for GeoJSON Point
interface IPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// An interface for a structured address
interface IAddress {
  street: string;
  city: string;
  state: string;
  pinCode: string;
}

export interface INotificationPreferences {
  new_borrow_request?: boolean;
  request_approved?: boolean;
  request_denied?: boolean;
  item_returned?: boolean;
  return_confirmed?: boolean;
  new_join_request?: boolean;
  new_item_request?: boolean; // For wanted items
  new_offer?: boolean;
  offer_accepted?: boolean;
  new_follower?: boolean;
  new_message?: boolean;
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
  isDisabled: boolean; 
  phoneNumber?: string; 
  address?: IAddress;
  passwordResetOTP?: string;       
  passwordResetExpires?: Date;
  notificationPreferences: INotificationPreferences;
  emailNotificationPreferences: INotificationPreferences;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, select: false },
  googleId: { type: String, unique: true, sparse: true },
  profilePicture: { type: String, default:"https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.freepik.com%2Fpremium-vector%2Fprofile-picture-placeholder-avatar-silhouette-gray-tones-icon-colored-shapes-gradient_291679346.htm&psig=AOvVaw1gDWHqS1dj6RVCo7nE8M6I&ust=1754497830372000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCJC76vSL9I4DFQAAAAAdAAAAABAE" },
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
  isDisabled: { type: Boolean, default: false }, 
  phoneNumber: { type: String }, 
  address: {                    
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pinCode: { type: String },
  },
  passwordResetOTP: { type: String, select: false }, 
  passwordResetExpires: { type: Date, select: false }, 
  notificationPreferences: {
    new_borrow_request: { type: Boolean, default: true },
    request_approved: { type: Boolean, default: true },
    request_denied: { type: Boolean, default: true },
    item_returned: { type: Boolean, default: true },
    return_confirmed: { type: Boolean, default: true },
    new_join_request: { type: Boolean, default: true },
    new_item_request: { type: Boolean, default: true },
    new_offer: { type: Boolean, default: true },
    offer_accepted: { type: Boolean, default: true },
    new_follower: { type: Boolean, default: true },
    new_message: { type: Boolean, default: true },
  },
  emailNotificationPreferences: {
    new_borrow_request: { type: Boolean, default: true },
    request_approved: { type: Boolean, default: true },
    request_denied: { type: Boolean, default: true },
    item_returned: { type: Boolean, default: true },
    return_confirmed: { type: Boolean, default: true },
    new_join_request: { type: Boolean, default: true },
    new_item_request: { type: Boolean, default: true },
    new_offer: { type: Boolean, default: true },
    offer_accepted: { type: Boolean, default: true },
    new_follower: { type: Boolean, default: true },
    new_message: { type: Boolean, default: false },
  },
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