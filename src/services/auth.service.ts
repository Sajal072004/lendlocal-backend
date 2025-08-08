import { User, IUser } from '../models/User.model';
import bcrypt from 'bcryptjs';
import otpGenerator from 'otp-generator';
import { generateToken } from '../utils/jwt';
import { sendEmail } from '../utils/email';


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

    
    const existingUser = await User.findOne({ email, isVerified: true });
    if (existingUser) {
      throw new Error('An account with this email already exists.');
    }
    
    
    await User.deleteOne({ email, isVerified: false });

    
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    
    const newUser: Partial<IUser> = { name, email, password, otp, otpExpires, isVerified: false };
    if (latitude && longitude) {
      newUser.location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    }

    
    const user = new User(newUser);
    await user.save();

    
    try {
      
      const now = new Date();
      const day = now.getDate();
      const daySuffix = (d: number) => {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
          case 1: return 'st';
          case 2: return 'nd';
          case 3: return 'rd';
          default: return 'th';
        }
      };
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[now.getMonth()];
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'Pm' : 'Am';
      hours = hours % 12 || 12;
      const formattedDate = `${day}${daySuffix(day)} ${month} ${hours}:${minutes} ${ampm}`;

      await sendEmail({
        to: user.email,
        subject: `Your LendLocal Verification Code (${formattedDate})`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LendLocal Verification</title>
        <style>
          /* ...styles unchanged... */
        </style>
          </head>
          <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">LendLocal</div>
            <div class="tagline">Connecting Communities Through Lending</div>
          </div>
          
          <div class="content">
            <h1 class="welcome-text">Welcome to LendLocal!</h1>
            <p class="description">
          Thank you for joining our community. To complete your account setup, 
          please use the verification code below.
            </p>
            
            <div class="verification-box">
          <div class="verification-label">Your Verification Code</div>
          <div class="verification-code">${otp}</div>
          <div class="expiry-notice">⏰ Expires in 10 minutes</div>
          <div style="margin-top:10px;font-size:13px;color:#718096;">
            Requested on: <strong>${formattedDate}</strong>
          </div>
            </div>
            
            <div class="security-notice">
          <div class="security-title">🔐 Security Notice</div>
          <div class="security-text">
            This code is for your account verification only. Never share it with anyone. 
            LendLocal will never ask for this code via phone or email.
          </div>
            </div>
            
            <div class="cta-section">
          <a href="${process.env.FRONTEND_URL}/verify-otp?email=${encodeURIComponent(user.email)}" class="cta-button">Complete Verification</a>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-content">
          <div class="footer-links">
            <a href="#">Help Center</a>
            <a href="#">Contact Support</a>
            <a href="#">Privacy Policy</a>
          </div>
          
          <div class="company-info">
            © 2025 LendLocal Inc. All rights reserved.<br>
            1234 Financial District, Suite 567, Business City, BC 12345
          </div>
            </div>
          </div>
        </div>
          </body>
          </html>
        `,
        text: `Welcome to LendLocal! Your verification code is: ${otp}. It will expire in 10 minutes.\nRequested on: ${formattedDate}`
      });
      return { message: 'OTP sent to your email. Please verify your account.' };
    } catch (error) {
      console.error('Email sending failed:', error);
      
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

    
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    
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

    if (user && user.isDisabled) {
      throw new Error('Your account has been disabled. Please contact support.');
    }

    
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

  /**
   * Generates a password reset OTP, saves it to the user, and sends it via email.
   */
  public async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) {
      
      return;
    }

    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.passwordResetOTP = hashedOtp;
    
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    
    try {
      
      const now = new Date();
      const day = now.getDate();
      const daySuffix = (d: number) => {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
          case 1: return 'st';
          case 2: return 'nd';
          case 3: return 'rd';
          default: return 'th';
        }
      };
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[now.getMonth()];
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'Pm' : 'Am';
      hours = hours % 12 || 12;
      const formattedDate = `${day}${daySuffix(day)} ${month} ${hours}:${minutes} ${ampm}`;

      await sendEmail({
        to: user.email,
        subject: `Your LendLocal Password Reset Code (${formattedDate})`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - LendLocal</title>
        <style>
          /* ...styles unchanged... */
        </style>
          </head>
          <body>
        <div class="email-container">
          <div class="header">
        <div class="logo">LendLocal</div>
        <div class="tagline">Connecting Communities Through Lending</div>
          </div>
          
          <div class="content">
        <div class="alert-icon">🔒</div>
        <h1 class="main-title">Password Reset Request</h1>
        <p class="description">
          We received a request to reset your password. Use the code below or click the button to reset your password securely.
        </p>
        
        <div class="verification-box">
          <div class="verification-label">Password Reset Code</div>
          <div class="verification-code">${otp}</div>
          <div class="expiry-notice">⏰ Valid for 10 minutes only</div>
          <div style="margin-top:10px;font-size:13px;color:#718096;">
        Requested on: <strong>${formattedDate}</strong>
          </div>
        </div>
        
        <div class="security-notice">
          <div class="security-title">🛡️ Security Notice</div>
          <div class="security-text">
        If you didn't request this, ignore this email. Your password remains secure.
          </div>
        </div>
        
        <div class="cta-section">
          <a href="${process.env.FRONTEND_URL}/reset-password?email=${encodeURIComponent(user.email)}" class="action-button">
        Reset My Password
          </a>
        </div>
        
        <div class="alternative-text">
          <strong>Need help?</strong> Contact our support team if you're having trouble with password reset.
        </div>
          </div>
          
          <div class="footer">
        <div class="footer-content">
          <div class="footer-links">
        <a href="#">Help Center</a>
        <a href="#">Contact Support</a>
        <a href="#">Security Center</a>
        <a href="#">Privacy Policy</a>
          </div>
          
          <div class="divider"></div>
          
          <div class="company-info">
        © 2025 LendLocal Inc. All rights reserved.<br>
        1234 Financial District, Suite 567, Business City, BC 12345<br>
        This is an automated security email from LendLocal.
          </div>
        </div>
          </div>
        </div>
          </body>
          </html>
        `,
        
        text: `You requested a password reset. Your verification code is: ${otp}\nRequested on: ${formattedDate}\n\nThis code is valid for 10 minutes.`
      });
    } catch (error) {
      
      user.passwordResetOTP = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new Error('Failed to send reset email. Please try again.');
    }
  }

  /**
   * Verifies the OTP and resets the user's password.
   */
  public async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const user = await User.findOne({
      email,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetOTP');

    if (!user || !user.passwordResetOTP) {
      throw new Error('Invalid or expired OTP.');
    }

    const isMatch = await bcrypt.compare(otp, user.passwordResetOTP);
    if (!isMatch) {
      throw new Error('Invalid or expired OTP.');
    }

    
    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
  }
}