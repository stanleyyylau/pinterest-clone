const Book = require('./../models/Book')
const User = require('./../models/User')

const jwt = require("jsonwebtoken");

module.exports.allBooks = function(req, res) {
    Book.find({}).then((books)=> {
        res.json(books)
    }).catch((err) => {
        res.json(err)
    })
}

module.exports.getOneBook = function(req, res) {
    let bookId = req.params.id
    Book.findById(bookId).populate('owner').then((book) => {
        res.json(book)
    }).catch((err) => {
        res.json({
            errorCode: 1,
            error: err
        })
    })
}

module.exports.searchBook = function(req, res) {
    let bookTitle = req.body.title
    ajaxHelper.searchBook(bookTitle)
    .then(function(results) {
        res.json(results);
    })
    .catch(function(error) {
        res.json(error);
    });   
}

module.exports.addBook = function(req, res) {
    let newBook = new Book({
        owner: req.decoded.id,
        title: req.body.title || "unknown title",
        author: req.body.author || "unknown author",
        pages: req.body.pages || "unknown page number",
        image: req.body.image || "unknown image",
        description: req.body.description || "unknown description"
    })

    User.findById(req.decoded.id).then((user) => {
        user.books.push(newBook._id)
        return user.save()
    }).then((user) => {
        return newBook.save()
    }).then((newBook)=>{
        res.json({
            errorCode: 0,
            msg: "Adding new book success!"
        })
    })

}

module.exports.register = function(req, res) {
    // Todo, need to check if email has been regiter or not
    let newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    })

    // Because we have a pre save function, the password will be hashed
    newUser.save().then((user)=>{
                res.json({
                    errorCode: 0
                }).catch((err)=>{
                res.json({
                    errorCode: 1,
                    errorInfo: err
                })
            })
    })

    // Todo, might do someting on the client side so user will automatically log in after signing up
}

module.exports.login = function(req, res, next){
    // Authenticate mathod on UserSchame on bcrypt's compare function to make sure password provided is correct
    User.authenticate(req.body.email, req.body.password, (error, user) => {
        if (error || !user) {
        res.json({ errorCode: 1, errorMsg: "Invalid username or password" })
        } else {
        // Return a token if user is authenticated
        jwt.sign({ username: user.username, id: user._id }, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "5 days"}, (error, token) => {
            if (error) {
            return next(error);
            }
            res.status(200).json({ errorCode: 0, token: token, userName: user.username});
        });
        }
    });    
}

module.exports.logout = function(req, res, next){
  // Delete the token for request header
  if (req.decoded) {
    req.decoded = null;
  }
  // Todo, something need to happen on the client side to delete token in header or token in request body
  res.json({
      errorCode: 0,
      msg: "Logged out from system"
  })
}

module.exports.getAllMyBooks = function(req, res){
    User.findById(req.decoded.id).populate('books').then((user)=>{
        res.json({
            errorCode: 0,
            books: user.books
        })
    })
}

// getProfile
module.exports.getProfile = function(req, res){
    User.findById(req.decoded.id).then((user)=>{
        res.json({
            errorCode: 0,
            profile: user
        })
    })
}

module.exports.updateProfile = function(req, res){
    var updateObj = {
        username: req.body.username,
        city: req.body.city,
        state: req.body.state
    }

    User.findByIdAndUpdate(req.decoded.id, updateObj).then((user)=>{
        return User.findById(req.decoded.id)
    }).then((user)=>{
        res.json({
            errorCode: 0,
            profile: user
        })        
    }).catch((err)=>{
        res.json({
            errorCode: 1,
            error: err
        })
    })
}

module.exports.tradeBook = function(req, res){
    let { mineBookId, theirBookId } = req.body
    let myBook = Book.findById(mineBookId)
    let theirBook = Book.findById(theirBookId)

    Promise.all([myBook, theirBook]).then(result => { 
        let mine = result[0]
        let theirs = result[1]

        if(mine.availability === false){
            res.json({
                errorCode: 1,
                msg: "You book is not available"
            })
        }

        if(theirs.availability === false){
            res.json({
                errorCode: 1,
                msg: "their book is not avaiable for trade right now"
            })
        }

        // Todo, to the trading logic, which is weird...
        // First make those two books not avaiable
        mine.availability = false
        theirs.availability = false

        return Promise.all([mine.save(), theirs.save()])
    }).then((result)=>{
        let mine = result[0]
        let theirs = result[1]

        let me = User.findById(mine.owner)
        let them = User.findById(theirs.owner)

        return Promise.all([me, them])
    }).then((result) => {
        let me = result[0]
        let them = result[1]

        me.tradeSent.push({
            mine: mineBookId,
            theirs: theirBookId
        })

        them.tradeReceived.push({
            mine: theirBookId,
            theirs: mineBookId
        })

        return Promise.all([me.save(), them.save()])
    }).then((result) => {
        res.json({
            errorCode: 0,
            msg: "trade success!"
        })
    }).catch((err) => {
        res.json({
            errorCode: 1,
            msg: err
        })
    })
}

module.exports.tradeCheck = function(req, res){
    var ownerIdToCheck = req.body.ownerIdToCheck
    console.log('decoded id is...')
    console.log(req.decoded.id)
    if(ownerIdToCheck == req.decoded.id){
        res.json({
            errorCode: 1
        })
    }else{
        res.json({
            errorCode: 0
        })
    }
}

// Only the trade receiver can perform this action
// @params myBookId, theirBookId
// After this, my book becomes theirs, theirs becomes mine
module.exports.tradeConfirm = function(req, res){
    // Make both book avaiable again
    // Both books should change owner
    // First remove my book from me and their book from them
    // Empty the trade record
    // Exchange ownership of books
    let { myBookId, theirBookId } = req.body
    var myBook
    var theirBook
    Promise.all([Book.findById(myBookId), Book.findById(theirBookId)]).then((result)=>{
        myBook = result[0]
        theirBook = result[1]

        myBook.availability = true
        theirBook.availability = true

        return Promise.all([
        User.update({_id: myBook.owner}, { $pull: { books: myBook._id, tradeReceived: { mine: myBook._id } }}),
        User.update({_id: theirBook.owner}, { $pull: { books: theirBook._id, tradeSent: {mine: theirBook._id} }}),
        myBook.save(),
        theirBook.save()
        ]).then((result)=>{
            return Promise.all([
                User.findById(myBook.owner),
                User.findById(theirBook.owner),
                myBook.save(),
                theirBook.save()
            ])
        })
    }).then((result)=>{
        let me = result[0]
        let them = result[1]

        me.books.push(theirBookId)
        them.books.push(myBookId)

         // Should change book owner here
        let ownerTemp = myBook.owner
        myBook.owner = theirBook.owner
        theirBook.owner = ownerTemp

        return Promise.all([me.save(), them.save(), myBook.save(), theirBook.save()])
    }).then((result)=>{
        res.json({
            errorCode: 0,
            msg: "trade confirm success!"
        })
    }).catch((err)=>{
        res.json({
            errorCode: 1,
            msg: "trade confirm fail!"
        })
    })
}

// Only the trade receiver can perform this action
// @params myBookId, theirBookId
module.exports.tradeReject = function(req, res){
    // Empty my tradeReceived and their tradeSent with the corresponding bookId
    // Make both book avaiable again
    let { myBookId, theirBookId } = req.body
    // First empty my tradeReceived
    Promise.all([Book.findById(myBookId), Book.findById(theirBookId)]).then((result)=>{
        let myBook = result[0]
        let theirBook = result[1]

        myBook.availability = true
        theirBook.availability = true

        Promise.all([
            User.update({_id: myBook.owner}, { $pull: { tradeReceived: { mine: myBook._id } }}),
            User.update({_id: theirBook.owner}, { $pull: { tradeSent: {mine: theirBook._id} }}),
            myBook.save(),
            theirBook.save()
        ]).then((result)=>{
            res.json({
                errorCode: 0,
                msg: "trade reject success"
            })
        }).catch((err)=>{
            res.json({
                errorCode: 1,
                msg: "trade reject fail"
            })
        })
    })
}

// Only the trade sender can perform this action
// @params myBookId, theirBookId
module.exports.tradeCancel = function(req, res){
    // Empty my tradeSent and their tradeReceived with the corresponding bookId
    // Make both book avaiable again
    let { myBookId, theirBookId } = req.body
    // First empty my tradeSent
    Promise.all([Book.findById(myBookId), Book.findById(theirBookId)]).then((result)=>{
        let myBook = result[0]
        let theirBook = result[1]

        myBook.availability = true
        theirBook.availability = true

        Promise.all([
            User.update({_id: myBook.owner}, { $pull: { tradeSent: { mine: myBook._id } }}),
            User.update({_id: theirBook.owner}, { $pull: { tradeReceived: {mine: theirBook._id} }}),
            myBook.save(),
            theirBook.save()
        ]).then((result)=>{
            res.json({
                errorCode: 0,
                msg: "trade cancel success"
            })
        }).catch((err)=>{
            res.json({
                errorCode: 1,
                msg: "trade cancel fail"
            })
        })
    })    
}

module.exports.myPropose = function(req, res){
    User.findById(req.decoded.id).populate({
        path: 'tradeSent.mine',
        model: 'Book'
    }).populate({
        path: 'tradeSent.theirs',
        model: 'Book',
        populate: {
            path: 'owner',
            model: 'User',
            select: 'username email'
        }
    })
    .then((result) => {
        console.log(result)
        res.json({
            errorCode: 0,
            myName: result.username,
            myPropose: result.tradeSent
        })
    }).catch((err)=>{
        res.json({
            errorCode: 1,
            msg: err
        })
    })
}

module.exports.myReceive = function(req, res){
    User.findById(req.decoded.id).populate({
        path: 'tradeReceived.mine',
        model: 'Book'
    }).populate({
        path: 'tradeReceived.theirs',
        model: 'Book',
        populate: {
            path: 'owner',
            model: 'User',
            select: 'username email'
        }
    })
    .then((result) => {
        res.json({
            errorCode: 0,
            myName: result.username,
            tradeReceived: result.tradeReceived
        })
    }).catch((err)=>{
        res.json({
            errorCode: 1,
            msg: err
        })
    })    
}