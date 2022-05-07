const express = require("express");
const cookieParser = require("cookie-parser");
const session = require('express-session');

const passport = require("./passport-setup");
const config = require("./config.json");
const errorMiddleware = require("./middlewares/error-middleware");

/*
 * Инициализация фреймворка Express.
 */

const app = express();

const apiRouter = require('./routes/routes');

const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', config.SiteLink);
  res.header('Access-Control-Allow-Headers', "Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  res.header('Access-Control-Allow-Methods', "GET, OPTIONS, POST, PUT");
  res.header('Access-Control-Allow-Credentials', "true")
  next();
}

app.use(allowCrossDomain);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: config.key,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize(undefined));
app.use(passport.session(undefined));

app.use(cookieParser());

app.use("/", apiRouter);

app.use(errorMiddleware);

module.exports = app;