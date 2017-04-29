const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path')
var expressSession = require('express-session');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var TwitterStrategy = require('passport-twitter').Strategy;

// the process.env values are set in .env
const config = require('./config/config')();
const apiController = require('./controllers/apiController');
const middleware = require('./middleware/authentication');

const app = express();
app.use('/assets', express.static('views/assets'));

// Global middleware
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: process.env.TWITTER_CALLBACK_URL,
},
  function (token, tokenSecret, profile, done) {
    console.log(token, tokenSecret, profile)
    return done(null, profile);
  }));
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname + "/../client/build")));

// Authentication middleware
app.use(expressSession({ secret: 'watchingferries', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// CORS support
app.use('/', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, x-auth, Content-Type, x-access-token");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH");
  res.header("Access-Control-Max-Age", 600);

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  }
  else {
    next();
  }
});

app.set('view engine', 'pug');

app.get('/', function (req, res) {
  res.render('index', { title: 'Hey', message: 'Hello there!' })
})

// API routes here
app.get('/api/test', function (req, res) {
  res.sendFile(__dirname + '/index.html');
})
app.get('/api/twitter/login', passport.authenticate('twitter', { session: false }) )
app.get('/api/twitter/login/return', passport.authenticate('twitter', { session: false }),
  function (req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    res.send('login success!')
  })

// TODO: Swap for server-side universal react routing
app.get("/*", (req, res, next) => {
  res.status(301).redirect("/");
});

// Error handling here
app.use((req, res) => {
  res.send('index.html')
  res.status(404).send('We can\' find what you\'re looking for');
})

app.use((err, req, res, next) => {
  console.log('Error handling begin....')
  console.log(err)
  res.status(500).json({
    errorCode: 1,
    errorMsg: err
  })
})

module.exports = app;
