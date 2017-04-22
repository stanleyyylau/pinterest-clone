const assert = require('assert');

const User = require('./../models/User')
const Book = require('./../models/Book')

describe('User', ()=>{
  let newUser;

  beforeEach((done) => {
    newUser = new User({
      username: 'Stanley',
      password: 'StanleyIsCool'
    })
    newUser.addBook('book1')
    newUser.addBook('book2')
    newUser.addBook('book3')
    newUser.addBook('book4')
    newUser.save()
      .then(() => done())
  })

  it('View all book posted by every/this user', function (done) {
    Promise.all([User.findById(newUser._id), Book.find({})])
      .then((result) => {
        var stan = result[0]
        var allBooks = result[1]
        assert(stan.books.length === 4) //Stan will have 4 new books

        // Stan will also be the owner of these 4 new books
        assert(allBooks[0].owner.toString() === newUser._id.toString())
        assert(allBooks[1].owner.toString() === newUser._id.toString())
        assert(allBooks[2].owner.toString() === newUser._id.toString())
        assert(allBooks[3].owner.toString() === newUser._id.toString())
        done()
      });
  })

  it('Add a new book', function (done) {
    Promise.all([User.findById(newUser._id)])
      .then((result) => {
        var stan = result[0]
        return stan.addBook('new book')
      })
      .then((promiseAll) => {
        var currentUser = promiseAll[0]
        assert(currentUser.books.length === 5) //Stanley got new book
        return Book.findById(currentUser.books[4])
      })
      .then((newBook) => {
        assert(newBook.title === 'new book') // The new book belongs to Stanley
        assert(newBook.owner.toString() === newUser._id.toString())
        done()
      })
  })

  it('Can update their full name, city and state', function(done){
    var updateContent = {
      fullName: 'Stanley Lau',
      city: 'New York',
      state: 'New York State'
    }

    User.findByIdAndUpdate(newUser._id, updateContent)
      .then((user) => {
        return User.findById(user._id)
      })
      .then((user) => {
        assert(user.fullName === 'Stanley Lau')
        assert(user.city === 'New York')
        assert(user.state === 'New York State')
        done()
      })
  })

  it('I can propose a trade and wait for the other user to accept the trade', function () {
    throw new Error("fail");
  })

  it('Should return "validation fail" if email is incorrect or password is less then 6 characters', function(){
    var user = new User ({
      email: "thisisnotanemailaddres",
      password: "thisisSomeComplicatedpassword"
    })
    throw new Error("fail");
  })

  it('Should create a new record in database when correct email and password is passed', function(){
    throw new Error("fail");
  })

  it('Password should be hashed and encrypted', function(){
    throw new Error("fail");
  })

});
