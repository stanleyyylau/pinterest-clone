const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const assert = require('assert');

const User = require('./../models/User')
const Book = require('./../models/Book')

before(done => {
  mongoose.connect('mongodb://localhost/book_trading_test');
  mongoose.connection
    .once('open', () => done())
    .on('error', error => {
      console.warn('Warning', error);
    });
});

beforeEach(done => {
  const {books, users} = mongoose.connection.collections;
  books.drop(() => {
    users.drop(() => {
      done();
    });
  });

});
