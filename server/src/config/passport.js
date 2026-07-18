import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import env from '#config/env';
import userService from '#modules/user/user.service';

const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,

        clientSecret: env.google.clientSecret,

        callbackURL: env.google.callbackUrl,
      },

      async (accessToken, refreshToken, profile, done) => {
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
            user = await userService.createGoogleUser({
              name: profile.displayName,

              email,

              googleId: profile.id,

              avatar: profile.photos?.[0]?.value ?? null,
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

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
