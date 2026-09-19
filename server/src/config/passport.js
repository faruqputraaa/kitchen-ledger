import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import env from '#config/env';
import userService from '#modules/user/user.service';

const configurePassport = () => {
  if (env.google.clientId && env.google.clientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.google.clientId,
          clientSecret: env.google.clientSecret,
          callbackURL: env.google.callbackUrl,
          passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;

            if (!email) {
              return done(new Error('Google account has no email'), null);
            }

            let user = await userService.findByGoogleId(profile.id);
            if (!user) {
              user = await userService.findByEmail(email);
            }

            if (!user) {
              // Create new Google user WITHOUT tenant - will complete via invitation page
              user = await userService.createGoogleUser({
                name: profile.displayName,
                email,
                googleId: profile.id,
                avatar: profile.photos?.[0]?.value ?? null,
                tenantId: null,
              });
            } else if (!user.googleId && profile.id) {
              // Link googleId if existing email user logs in via Google
              const { default: User } = await import('#modules/user/user.model');
              user = await User.findByIdAndUpdate(user._id, { googleId: profile.id, avatar: profile.photos?.[0]?.value ?? user.avatar }, { new: true });
            }

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        },
      ),
    );
  }

  passport.serializeUser((user, done) => {
    done(null, user.id ?? user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await userService.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  return passport;
};

export default configurePassport;
