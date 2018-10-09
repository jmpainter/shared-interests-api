const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

const User = require('../models/user');
const { JWT_SECRET } = require('../config');

// localStrategy used for initial login
const localStrategy = new LocalStrategy((username, password, done) => {
  let user;

  User.findOne({ username: username })
    .then(_user => {
      user = _user;
      if(!user) {
        return Promise.reject({
          reason: 'LoginError',
          message: 'Incorrect username or password'
        });
      }
      return user.validatePassword(password);
    })
    .then(isValid => {
      if(!isValid) {
        return Promise.reject({
          reason: 'LoginError',
          message: 'Incorrect username or password'
        });
      }
      return done(null, user);
    })
    .catch(err => {
      if(err.reason === 'LoginError') {
        return done(null, false, err);
      }
      return done(err, false);
    });
});

// jwtStategy used for accessing protected endpoints
const jwtStrategy = new JwtStrategy(
  {
    secretOrKey: JWT_SECRET,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken('Bearer'),
    algorithms: ['HS256']
  },
  (payload, done) => {
    done(null, payload.user);
  }
);

module.exports = { localStrategy, jwtStrategy };