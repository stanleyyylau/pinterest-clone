const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

const Book = require('./Book');
var Schema = mongoose.Schema;

var UserSchema = new mongoose.Schema({
  username: String,
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: String,
  city: String,
  state: String,
  books: [{
    type: Schema.Types.ObjectId,
    ref: 'Book'
  }],
  tradeReceived: [{
    mine: {
      type: Schema.Types.ObjectId,
      ref: 'Book'
    },
    theirs: {
      type: Schema.Types.ObjectId,
      ref: 'Book'
  }}],
  tradeSent: [{
    mine: {
      type: Schema.Types.ObjectId,
      ref: 'Book'
    },
    theirs: {
      type: Schema.Types.ObjectId,
      ref: 'Book'
    }
  }]
})

UserSchema.statics.authenticate = function (email, password, callback) {
  User.findOne({ email: email })
    .exec((error, user) => {
      if (error) {
        return callback(error);
      }
      if (!user) {
        let error = new Error();
        error.message = "User not found";
        return callback(error);
      }
      bcrypt.compare(password, user.password, function (error, match) {
        if (match) {
          return callback(null, user);
        } else if (error) {
          return next(error);
        } else {
          let error = new Error();
          error.message = "Credentials don't match";
          return callback(error);
        }
      });
    });
};

UserSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  bcrypt.genSalt(10, function (error, salt) {
    bcrypt.hash(user.password, salt, function (error, hash) {
      if (error) {
        return next(error);
      }
      user.password = hash;
      next();
    });
  });
});

/**
 * instance method, whoever use this function to add a book
 * will become the owner of the newly added book
 * @param bookTitle
 * @returns {Promise.<*>}   result[0] is the current user
 */
UserSchema.methods.addBook = function (bookTitle) {
  var newBook = new Book({
    title: bookTitle,
    owner: this._id
  })

  this.books.push(newBook)
  return Promise.all([this.save(), newBook.save()])
};

/**
 * instance method
 * @param theirBookId
 * @param myBookId
 * @returns {Promise.<TResult>}
 */
UserSchema.methods.tradeWith = function (theirBookId, myBookId) {
  var myBook, theirBook;

  myBook = Book.findById(myBookId);
  theirBook = Book.findById(theirBookId);

  return Promise.all([theirBook, myBook]).then(function (result) {
    var theirs = result[0];
    var mine = result[1];
    theirs.tradeReceive.push(mine._id);
    mine.tradeSent.push(theirs._id);
    return Promise.all([mine.save(), theirs.save()])
  })

};

/**
 * Model method
 * @param userIdToCheck
 */
UserSchema.statics.checkTradeReceived = function (userIdToCheck) {
  this.findById(userIdToCheck)
    .populate({
      path: 'books',
      populate: {
        path: 'tradeReceive',
        model: 'Book'
      }
    })
    .then((result) => {
      console.log(result.books[0])
    })
};

UserSchema.statics.checkTradeSent = function (userIdToCheck) {

};

var User = mongoose.model('User', UserSchema);

module.exports = User;

