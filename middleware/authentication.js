const jwt = require("jsonwebtoken");

module.exports = {
  loggedOut: function(req, res, next) {
    if (req.decoded) {
      res.redirect("/");
    }
    return next();
  },
  loggedIn: function(req, res, next) {
    const token = req.headers["x-access-token"] || req.body.token;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if (error) {
          return next(error);
        }
        req.decoded = decoded;
        return next();
      });
    } else {
      let error = new Error();
      error.message = "You must login first"
      return next(error);
    }
  }
}