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
const User = require('./models/User.js')
const Pin = require('./models/Pin.js')

const app = express();
app.use('/assets', express.static('views/assets'));

// Global middleware
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: process.env.TWITTER_CALLBACK_URL,
},
  function (token, tokenSecret, profile, done) {
    // Save this user to DB if this is a first time visit user
    User.find({twitterId: profile.id}).then((user)=>{
      if(user.length == 0){
        var newUser = new User({
          twitterId: profile.id,
          avatarPhone: profile.photos[0].value
        })
        newUser.save()
      }
    }).catch((err)=>{
      var newUser = new User({
        twitterId: profile.id,
        avatarPhone: profile.photos[0].value
      })
      newUser.save()
    })
    
    return done(null, { id: profile.id, photos: profile.photos } );
  }));
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  User.find({twitterId: obj.id}).then((user)=>{
    console.log(user)
    done(null, user[0]);
  })
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
  // Pull all pins from db
  Pin.find({}).populate('owner').then((pins)=>{
    console.log(pins)
    
    if(req.user && req.user.twitterId){
      res.render('index', { 
            title: 'Hey', 
            message: 'Hello there!',
            login: true,
            pins: pins,
            currentUserId: req.user._id
          })
    } else {
      res.render('index', { 
          title: 'Hey', 
          message: 'Hello there!',
          login: false,
          pins: pins
        })
    }
  })
  
  
})

app.post('/delete', function(req, res){
  // First remove it from user array
  var newPins = []
  User.findById(req.user._id).then((user)=>{
    user.Pins.forEach(function(val, index){
      if(val!==req.body.pinId){
        newPins.push(val)
      }
    })
    
    user.Pins = newPins;
    return user.save()
  }).then((user)=>{
    // Now remove the pin from PIN collection
    return Pin.findByIdAndRemove(req.body.pinId)
  }).then((pin)=>{
    res.redirect(`/user/${req.user._id}`)
  })
})

app.get('/user/:id', function(req, res){
  Pin.find({owner:req.params.id}).populate('owner').then(pins=>{
    
    if(req.user && req.user.twitterId){
      // if user is login
      res.render('mypics', {
        login: true,
        pins: pins
      })
    } else {
      res.render('index', {
        login: false,
        pins: pins
      })
    }
    
  })
})

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.post('/addpin', function(req, res){
  // Crate a new pin
  var newPin = new Pin({
    pinUrl: req.body.pinUrl,
    pinDes: req.body.pinDes,
    owner: req.user._id
  })
  
  User.findById(req.user.id).then((user)=>{
    user.Pins.push(newPin)
    Promise.all([newPin.save(), user.save()]).then(result=>{
      console.log(result)
      res.redirect('/');
    })
  })
  
  
  
});

// API routes here
app.get('/api/test', function (req, res) {
  res.sendFile(__dirname + '/index.html');
})
app.get('/api/twitter/login', passport.authenticate('twitter', { session: true }) )
app.get('/api/twitter/login/return', passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/' }) )

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
