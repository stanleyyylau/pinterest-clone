const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookSchema = new mongoose.Schema({
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

const Book = mongoose.model('Book', BookSchema);

module.exports = Book;