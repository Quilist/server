const passport = require("passport");
const config = require("./config.json");

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

/*
 * Инициализация стратегий авторизации через гугл и фейсбук,
 * возвращается инициализированный класс passport
 */

passport.use("google", new GoogleStrategy({
    clientID: process.env.GoogleClientID || config.GoogleClientID,
    clientSecret: process.env.GoogleClientSecret || config.GoogleClientSecret,
    callbackURL: process.env.GoogleResponseCallback || config.GoogleResponseCallback
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

passport.use("facebook", new FacebookStrategy({
    clientID: process.env.FacebookClientID || config.FacebookClientID,
    clientSecret: process.env.FacebookClientSecret || config.FacebookClientSecret,
    callbackURL: process.env.FacebookResponseCallback || config.FacebookResponseCallback,
    profileFields: ["email", "name"]
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

module.exports = passport;