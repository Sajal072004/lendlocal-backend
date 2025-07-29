import { User, IUser } from '../models/User.model';
import bcrypt from 'bcryptjs';
import otpGenerator from 'otp-generator';
import { generateToken } from '../utils/jwt';
import { sendEmail } from '../utils/email';

// Define the shape of the registration data, including optional location
interface IRegisterData extends Pick<IUser, 'name' | 'email' | 'password'> {
  latitude?: number;
  longitude?: number;
}

export class AuthService {
  /**
   * Creates an unverified user and sends an OTP to their email.
   * @param userData - The user's name, email, password, and location.
   * @returns A success message indicating that the OTP was sent.
   */
  public async register(
    userData: IRegisterData
  ): Promise<{ message: string }> {
    const { email, name, password, latitude, longitude } = userData;

    if (!email || !name || !password) {
      throw new Error('Name, email, and password are required.');
    }

    // Check if a verified user with this email already exists
    const existingUser = await User.findOne({ email, isVerified: true });
    if (existingUser) {
      throw new Error('An account with this email already exists.');
    }
    
    // If an unverified user exists, remove them to start fresh
    await User.deleteOne({ email, isVerified: false });

    // 1. Generate a 6-digit OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    // 2. Set OTP expiration for 10 minutes from now
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // 3. Prepare user data
    const newUser: Partial<IUser> = { name, email, password, otp, otpExpires, isVerified: false };
    if (latitude && longitude) {
      newUser.location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    }

    // 4. Create the unverified user
    const user = new User(newUser);
    await user.save();

    // 5. Send the OTP via email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Your LendLocal Verification Code',
        text: `Welcome to LendLocal! Your verification code is: ${otp}. It will expire in 10 minutes.`,
      });
      return { message: 'OTP sent to your email. Please verify your account.' };
    } catch (error) {
      console.error('Email sending failed:', error);
      // Clean up the created user if email fails
      await User.findByIdAndDelete(user._id);
      throw new Error('Failed to send verification email. Please try again.');
    }
  }

  /**
   * Verifies a user's OTP, marks them as verified, and logs them in.
   * @param email The user's email.
   * @param otp The 6-digit OTP from the email.
   * @returns A login token and the user object.
   */
  public async verifyOtp(
    email: string,
    otp: string
  ): Promise<{ token: string; user: Omit<IUser, 'password'> }> {
    const user = await User.findOne({ email }).select('+otp +otpExpires');

    if (!user || user.otp !== otp || (user.otpExpires && user.otpExpires < new Date())) {
      throw new Error('Invalid or expired OTP.');
    }

    // Verification successful: update user record
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Log the user in by generating a token
    const token = generateToken(user._id.toString());
    const userObject = user.toObject();
    delete userObject.password;

    return { token, user: userObject };
  }

  /**
   * Logs in a verified user.
   * @param credentials - The user's email and password.
   * @returns The user object and a JWT.
   */
  public async login(
    credentials: Pick<IUser, 'email' | 'password'>
  ): Promise<{ token: string; user: Omit<IUser, 'password'> }> {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');

    // Add a check to ensure the account is verified
    if (user && !user.isVerified) {
      throw new Error('Account not verified. Please check your email and enter the OTP.');
    }

    if (!user || !(await bcrypt.compare(password, user.password as string))) {
      throw new Error('Incorrect email or password');
    }

    const token = generateToken(user._id.toString());
    const userObject = user.toObject();
    delete userObject.password;

    return { token, user: userObject };
  }
}