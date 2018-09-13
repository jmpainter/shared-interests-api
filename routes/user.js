const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');
const Joi = require('joi');
const jsonParser = bodyParser.json();
const User = require('../models/user');

mongoose.Promise = global.Promise;

const jwtAuth = passport.authenticate('jwt', { session: false });

router.post('/', jsonParser, (req, res) => {
  const schema = {
    firstName: Joi.string().alphanum().max(20).required(),
    lastName: Joi.string().alphanum().max(30).required(),
    screenName: Joi.string().max(20).required(),
    location: Joi.string().max(30),
    username: Joi.string().min(3).max(30).trim().required(),
    password: Joi.string().min(7).max(72).trim().required()
  };
  const result = Joi.validate(req.body, schema, { convert: false });

  if(result.error) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: result.error.details[0].message,
      location: result.error.details[0].context.key
    });
  }

  const { firstName, lastName, screenName, location = '', username, password } = req.body;

  User.find({ username })
    .countDocuments()
    .then(count => {
      if(count > 0) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'sorry, that username is already taken'
        });
      }
      return User.hashPassword(password);
    })
    .then(hash => {
      return User.create({
        firstName,
        lastName,
        screenName,
        location,
        username,
        password: hash
      });
    })
    .then(user => {
      return res.status(201).json(user.serialize());
    })
    .catch(err => {
      if(err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({message: 'Internal Server Error'});
    });
});

router.get('/', jwtAuth, (req, res) => {
  User.findById(req.user.id)
    .populate('interests', 'name')
    .populate('blockedUsers', 'name')
    .then(user => {
      if(!user) {
        return res.status(404).json({ message: 'Not Found' });
      } else {
        return res.status(200).json({
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          screenName: user.screenName,
          location: user.location,
          interests: user.interests,
          blockedUsers: user.blockedUsers
        });
      }
    })
    .catch(err => {
      return res.status(500).json({ message: 'Internal Server Error' });
    })
});

module.exports = router;