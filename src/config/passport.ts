import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.model';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Find user by their unique Google ID first
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // If user exists with this Google ID, they are good to go
          return done(null, user);
        }

        // 2. If no user with Google ID, check if they registered manually with the same email
        user = await User.findOne({ email: profile._json.email });

        if (user) {
          // If they exist, link their Google account and mark as verified
          user.googleId = profile.id;
          user.profilePicture = user.profilePicture || profile._json.picture; // Update picture if they don't have one
          user.isVerified = true;
          await user.save();
          return done(null, user);
        }

        // 3. If user is completely new, create a new account
        const newUser = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile._json.email,
          profilePicture: profile._json.picture,
          isVerified: true, // Google users are automatically verified
        });
        
        return done(null, newUser);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);