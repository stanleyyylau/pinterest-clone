const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

const Pin = require('./Pin');
var Schema = mongoose.Schema;

var UserSchema = new mongoose.Schema({
  twitterId: String,
  avatarPhone: String,
  Pins: [{type: Schema.Types.ObjectId, ref: 'Pin'}]
})

var User = mongoose.model('User', UserSchema);

module.exports = User;

