const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PinSchema = new mongoose.Schema({
  title: String,
  author: String,
  pages: String,
  description: String,
  image: String,
  availability: { type: Boolean, default: true },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
})

const Pin = mongoose.model('Pin', PinSchema);

module.exportsPin;