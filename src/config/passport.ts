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


        // Auto-generate a username from display name, append random suffix on collision.
        let baseUsername = profile.displayName
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 16) || 'user';
        let username = baseUsername;
        const taken = await User.findOne({ username });
        if (taken) {
          username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
        }

        const newUser = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          username,
          email: profile._json.email,
          profilePicture: profile._json.picture,
          isVerified: true,
        });
        
        return done(null, newUser);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);