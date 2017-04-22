const server = require('./app.js');

const port = process.env.PORT;

server.listen(port, function(){
  console.log(`server listening on port ${port}`);
})


// test only
const Book = require('./models/Book.js');
const User = require('./models/User.js');


