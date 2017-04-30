const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./User');

const PinSchema = new mongoose.Schema({
  pinUrl: String,
  pinDes: String,
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
})

const Pin = mongoose.model('Pin', PinSchema);

module.exports = Pin;