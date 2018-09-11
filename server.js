const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const morgan = require('morgan');
const cors = require('cors');

const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const interestsRouter = require('./routes/interest');

const { localStrategy, jwtStrategy } = require('./helpers/strategies');

const logErrors = require('./middlewares/logErrors');

const app = express();
const { CLIENT_ORIGIN, PORT, DATABASE_URL } = require('./config');

// turned off for development
// app.use(morgan('common'));
app.use(logErrors);
app.use(cors({ origin: CLIENT_ORIGIN }));

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/users', userRouter);
app.use('/auth', authRouter);
app.use('/interests', interestsRouter);

mongoose.Promise = global.Promise;

let server;

function runServer(databaseUrl = DATABASE_URL, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, { useNewUrlParser: true }, err => {
      if(err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`App is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if(err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if(require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app , runServer, closeServer };