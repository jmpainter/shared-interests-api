const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const router = express.Router();
const User = require('../models/user');
const Interest = require('../models/interest');
const InterestUser = require('../models/interestUser');
const Joi = require('joi');

const jwtAuth = passport.authenticate('jwt', { session: false });

// get list of 6 latest interests
router.get('/', (req, res) => {
  Interest.find()
    .sort({$natural: -1})
    .limit(6)
    .then(interests => {
      return res.status(200).json(interests);
    })
    .catch(err => console.error(err.message));
});

// user is adding an interest to their list of interests.
// interest is being added from Wikipedia results
router.post('/', jsonParser, jwtAuth, (req, res) => {
  const schema = {
    wikiPageId: Joi.string().alphanum().max(30).required(),
    name: Joi.string().max(50).required()
  }
  const result = Joi.validate(req.body, schema);

  if(result.error) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: result.error.details[0].message,
      location: result.error.details[0].context.key
    });
  }

  const { wikiPageId, name } = req.body;

  let user;
  let interest;
  return User.findById(req.user.id)
  .then(_user => {
    if(!_user) {
        Promise.reject({
          code: 404,
          reason: 'ValidationError',
          message: 'Not Found'
        })
      } else {
        user = _user;
      }
      //check if interest has already been added to the database from Wikipedia
      return Interest.findOne({ wikiPageId })
    })
    .then(_interest => {
      // if the interest is not in the database, add it
      if(!_interest) {
        return Interest.create({
          wikiPageId,
          name
        });
      } else {
        return _interest;
      }
    })
    .then(_interest => {
      // add interest reference to user's interest array if it is not already there
      interest = _interest;
      if(user.interests.indexOf(interest.id) === -1) {
        user.interests.push(interest.id);
      }
      return user.save();
    })
    .then(() => {
      return InterestUser.create({
        interest: interest.id,
        user: user.id
      });
    })
    .then(() => {
      res.status(201).json(interest.serialize());
    })
    .catch(err => {
      if(err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      } else {
        console.error(err.message);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    });
});

// user is deleting an interest from their list of interests
// interest is kept in database
router.delete('/:id', jwtAuth, (req, res) => {
  let user;
  let interest;
  return User.findById(req.user.id)
    .then(_user => {
      if(!_user) {
        return Promise.reject({
          code: 404,
          reason: 'RequestError',
          message: 'Not found'
        });
      } else {
        user = _user;
        return Interest.findById(req.params.id);
      }
    })
    .then(_interest => {
      if(!_interest) {
        return Promise.reject({
          code: 404,
          reason: 'RequestError',
          message: 'Not found'
        });
      } else {
        interest = _interest;
        //remove the interest from the user's list of interests
        const index = user.interests.indexOf(req.params.id);
        if(index === -1) {
          return Promise.reject({
            code: 404,
            reason: 'RequestError',
            message: 'Not found'
          });
        } else {
          user.interests.splice(index, 1);
        }
        return user.save();
      }
    })
    .then(() => {
      // remove the entry in interestuser
      return InterestUser.findOneAndDelete({
        interest: interest.id,
        user: user.id
      });
    })
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      if(err.reason === 'RequestError') {
        return res.status(err.code).json(err);
      }
      return res.status(500).json({ message: 'Internal Server Error' });
    });
});

module.exports = router;