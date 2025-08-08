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

        let user = await User.findOne({ googleId: profile.id });

        if (user) {

          return done(null, user);
        }


        user = await User.findOne({ email: profile._json.email });

        if (user) {

          user.googleId = profile.id;
          user.profilePicture = user.profilePicture || profile._json.picture; // Update picture if they don't have one
          user.isVerified = true;
          await user.save();
          return done(null, user);
        }


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