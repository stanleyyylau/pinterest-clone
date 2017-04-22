const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path')

const config = require('./config/config')();
const apiController = require('./controllers/apiController');
const middleware = require('./middleware/authentication');

const app = express();
// Global middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname + "/../client/build")));

// CORS support
app.use('/', function(req, res, next) {
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

// API routes here
app.get('/api/allbooks', apiController.allBooks)
app.post('/api/searchbook', apiController.searchBook)
app.get('/api/book/:id', apiController.getOneBook)

app.post('/api/register', middleware.loggedOut, apiController.register)
app.post('/api/login', middleware.loggedOut, apiController.login)
app.get('/api/logout', middleware.loggedIn, apiController.logout)
app.get('/api/mybooks', middleware.loggedIn, apiController.getAllMyBooks)
app.post('/api/trade', middleware.loggedIn, apiController.tradeBook)

app.get('/api/mypropose', middleware.loggedIn, apiController.myPropose)
app.get('/api/myreceive', middleware.loggedIn, apiController.myReceive)

app.post('/api/tradecheck', middleware.loggedIn, apiController.tradeCheck)
app.post('/api/tradeconfirm', middleware.loggedIn, apiController.tradeConfirm)
app.post('/api/tradereject', middleware.loggedIn, apiController.tradeReject)
app.post('/api/tradecancel', middleware.loggedIn, apiController.tradeCancel)

app.get('/api/profile', middleware.loggedIn, apiController.getProfile)
app.post('/api/profile', middleware.loggedIn, apiController.updateProfile)

app.post('/api/addbook', middleware.loggedIn, apiController.addBook)

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
  console.log(err.errorMsg)
  res.status(500).json({
    errorCode: 1,
    errorMsg: err.message
  })
})

module.exports = app;
