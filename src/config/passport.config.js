import { logger } from '../utils/logger.js';
import passport from 'passport';
import local from 'passport-local';
import UserModel from '../DAO/models/user.model.js';
import { compareHash, createHash } from '../config/bcrypt.js';
import dotenv from 'dotenv';
dotenv.config();
import config from './envConfig.js';
import GitHubStrategy from 'passport-github2';
import fetch from 'node-fetch';

const localStrategy = local.Strategy;

import ServiceCarts from '../services/carts.service.js';
const serviceCarts = new ServiceCarts();

export default function initPassport() {
  passport.use(
    'register',
    new localStrategy(
      {
        passReqToCallback: true,
        usernameField: 'email',
      },
      async (req, username, password, done) => {
        try {
          const { email, firstName, lastName, age } = req.body;
          let user = await UserModel.findOne({ email: username });
          if (user) {
            logger.info('User Registration successful', { user: userCreated });
            return done(null, false);
          }
          const newCart = await serviceCarts.createOne();
          const cartID = newCart.result.payload._id.toString();
          const newUser = {
            email,
            firstName,
            lastName,
            age: Number(age),
            role: 'user',
            password: createHash(password),
            cartID: cartID,
          };
          let userCreated = await UserModel.create(newUser);
          logger.info('User Registration successful', { user: userCreated });
          return done(null, userCreated);
        } catch (e) {
          logger.error('Error in register', { error: e });
          return done(e);
        }
      }
    )
  );

  passport.use(
    'login',
    new localStrategy({ usernameField: 'email' }, async (username, password, done) => {
      try {
        const user = await UserModel.findOne({ email: username });
        if (!user) {
          logger.info('User Not Found with username (email)', { email: username });
          return done(null, false);
        }
        if (!compareHash(password, user.password)) {
          logger.info('Invalid Password');
          return done(null, false);
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.use(
    'github',
    new GitHubStrategy(
      {
        clientID: config.clientId,
        clientSecret: config.clientSecret,
        callbackURL: "http://localhost:8080/api/sessions/githubcallback",
      },
      async (accesToken, refreshToken, profile, done) => {
        try {
          const res = await fetch('https://api.github.com/user/emails', {
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: 'Bearer ' + accesToken,
              'X-Github-Api-Version': '2022-11-28',
            },
          });
          const emails = await res.json();
          const emailDetail = emails.find((email) => email.verified == true);
          if (!emailDetail) {
            return done(new Error('cannot get a valid email for this user'));
          }
          profile.email = emailDetail.email;
          logger.info('GitHub profile:', { profile });
          let user = await UserModel.findOne({ email: profile.email });
          if (!user) {
            const newCart = await serviceCarts.createOne();
            const cartID = newCart.result.payload._id.toString();
            const newUser = {
              email: profile.email,
              firstName: profile._json.name || profile._json.login || 'noname',
              lastName: "nolast",
              age: 21,
              role: 'user',
              password: "nopass",
              cartID: cartID,
            };
            let userCreated = await UserModel.create(newUser);
            logger.info('User Registration successful');
            return done(null, userCreated);
          } else {
            logger.info('User already exists');
            return done(null, user);
          }
        } catch (e) {
          logger.error('Error in Auth GitHub!', { error: e });
          return done(e);
        }
      }
    )
  );
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    let user = await UserModel.findById(id);
    done(null, user);
  });
}
