const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const router = express.Router();
const User = require('../models/user');
const Interest = require('../models/interest');
const Joi = require('joi');

const jwtAuth = passport.authenticate('jwt', { session: false });

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
      if(!user.interests.find(interest => interest.id === interest.id)) {
        user.interests.push(interest.id);
      } else {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Interest already has been added'
        });
      }
      return user.save();
    })
    .then(() => {
      // add user reference to interest users array if it is not already there
      if(!interest.users.find(user => user.id === user.id)) {
        interest.users.push(user.id);
      } else {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Interest already has been added'
        });      
      }
      return interest.save();
    })
    .then(interest => {
      res.status(201).json(interest.serialize());
    })
    .catch(err => {
      if(err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      } else {
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    });
});

module.exports = router;