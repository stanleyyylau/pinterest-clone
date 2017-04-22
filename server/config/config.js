module.exports=() => {
  const mongoose = require('mongoose');

  var env = process.env.NODE_ENV || 'development';

  if (env === 'development' || env === 'test') {
    var config = require('./config.json');
    var envConfig = config[env];

    Object.keys(envConfig).forEach((key) => {
      process.env[key] = envConfig[key];
    });
  }

// connect to DB
  mongoose.Promise = global.Promise;
  mongoose.connect(process.env.MONGODB_URI);

  mongoose.connection.on('error', () => {
    console.log('error');
  })
}


