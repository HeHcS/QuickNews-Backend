import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../models/userModel.js';

dotenv.config();

// JWT Strategy Configuration
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'fallback_jwt_secret_for_dev'
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Find the user specified in token
      const user = await User.findById(payload.id);
      
      // If user doesn't exist, handle it
      if (!user) {
        return done(null, false);
      }
      
      // Otherwise, return the user
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists in our database
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
          return done(null, user);
        }
        
        // If user doesn't exist, create a new one
        user = new User({
          name: profile.displayName,
          handle: `google_${profile.id}`,
          email: profile.emails[0].value,
          googleId: profile.id,
          profilePicture: profile.photos[0].value,
          isVerified: true // Google already verified their email
        });
        
        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    })
  );
}

// Apple OAuth Strategy would go here (requires apple-signin-auth package)
// Similar implementation as Google OAuth

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport; 