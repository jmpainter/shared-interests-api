const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const morgan = require('morgan');
const cors = require('cors');

const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const interestsRouter = require('./routes/interest');
const conversationsRouter = require('./routes/conversation');
const messagesRouter = require('./routes/message');

const { localStrategy, jwtStrategy } = require('./helpers/strategies');

const logErrors = require('./middlewares/logErrors');

const app = express();
const { CLIENT_ORIGIN, PORT, DATABASE_URL } = require('./config');

app.use(morgan('common'));

// using cors because client has a different domain than api
// client orign is configurable
app.use(cors({ origin: CLIENT_ORIGIN }));

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/users', userRouter);
app.use('/auth', authRouter);
app.use('/interests', interestsRouter);
app.use('/conversations', conversationsRouter);
app.use('/conversations/:id/messages', messagesRouter);

app.use(logErrors);

// using native javascript promises with Mongoose
mongoose.Promise = global.Promise;

let server;

// runServer can be used by tests or when launching from command line
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

// closeServer can be used by tests
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

// detect if server.js called by the command line and start server
if(require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app , runServer, closeServer };