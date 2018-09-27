const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const haversine = require('haversine');
const bodyParser = require('body-parser');
const Joi = require('joi');
const jsonParser = bodyParser.json();
const User = require('../models/user');
const InterestUser = require('../models/interestUser');

mongoose.Promise = global.Promise;

const jwtAuth = passport.authenticate('jwt', { session: false });

router.post('/', jsonParser, (req, res) => {
  const schema = {
    firstName: Joi.string().alphanum().max(20).required(),
    lastName: Joi.string().alphanum().max(30).required(),
    screenName: Joi.string().max(20).required(),
    location: Joi.string().max(30),
    latitude: Joi.number(),
    longitude: Joi.number(),
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

  const { firstName, lastName, screenName, location = '', latitude, longitude, username, password } = req.body;
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
        latitude,
        longitude,
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

  if(req.query.interests === 'true') {
    // find other users by matching interest
    User.findById(req.user.id)
    .then(user => {
      return InterestUser.find({ 
        user: { $ne: user.id, $nin: user.blockedUsers },
        interest: [...user.interests]
      })
        .populate('user', 'firstName lastName screenName location username')
        .populate('interest')
    })
    .then(result => {
      result = result.map(result => {
        return {
          interest: result.interest,
          user: result.user
        }
      });
      return res.status(200).json(result);
    })
    .catch(err => console.error(err.message));    
  } else if(req.query.nearby === 'true') {
    // find other users by nearby location
    // get user's lat and log
    let userLocation;
    User.findById(req.user.id)
      .then(user => {
        userLocation = {
          latitude: user.latitude,
          longitude: user.longitude
        }
        // find other users within one degree of latitude and longitude
        return User.find({
          _id: { $ne: user.id, $nin: user.blockedUsers },
          latitude: { $gt: userLocation.latitude -1, $lt: userLocation.latitude + 1},
          longitude: { $gt: userLocation.longitude -1, $lt: userLocation.longitude + 1}
        });
      })
      .then(users => {
        users = users.map(user => {
          let otherUserLocation = {
            latitude: user.latitude,
            longitude: user.longitude
          }
          const distance = haversine(userLocation, otherUserLocation, {unit: 'mile'});
          return {
            id: user._id,
            screenName: user.screenName,
            location: user.location,
            distance
          };
        });
        res.status(200).json(users);
      });

  } else if(req.query.other === 'true') {
    // get a list of users with other interests
    User.findById(req.user.id)
    .then(user => {
      return InterestUser.find({
        user: { $ne: user.id, $nin: user.blockedUsers },
        interest: { $nin: user.interests }
      })
      .populate('user', 'firstName lastName screenName location username')
      .populate('interest')
    })
    .then(result => {
      result = result.map(result => {
        return {
          interest: result.interest,
          user: result.user
        }
      });
      return res.status(200).json(result);
    })
    .catch(err => console.error(err.message));   
  } else {
    // get this user's information
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
  }
});

// an authenticated user can get other other user's screenName, location, and interests
router.get('/:id', jwtAuth, (req, res) => {
  User.findById(req.params.id)
  .populate('interests', 'name')
  .then(user => {
    if(!user) {
      return res.status(404).json({ message: 'Not Found' });
    } else {
      return res.status(200).json({
        id: user._id,
        screenName: user.screenName,
        location: user.location,
        interests: user.interests
      });
    }
  })
  .catch(err => {
    return res.status(500).json({ message: 'Internal Server Error' });
  })

});

router.put('/:id', jsonParser, jwtAuth, (req, res) => {
  if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    return res.status(400).json({ message: 'Request path id and request body id values must match'});
  }

  const schema = {
    id: Joi.string().length(24).required(),
    firstName: Joi.string().alphanum().max(20),
    lastName: Joi.string().alphanum().max(30),
    screenName: Joi.string().max(20),
    location: Joi.string().max(30),
    longitude: Joi.number(),
    latitude: Joi.number(),
    username: Joi.string().min(3).max(30).trim(),
    password: Joi.string().min(7).max(72).trim(),
    interests: Joi.array().items(Joi.string().length(24)),
    blockedUsers: Joi.array().items(Joi.string().length(24))
  };

  const result = Joi.validate(req.body, schema);

  if(result.error) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: result.error.details[0].message,
      location: result.error.details[0].context.key
    });
  }

  const updated = {};
  const updateableFields = [
    'firstName',
    'lastName',
    'screenName',
    'location',
    'longitude',
    'latitude',
    'username',
    'password',
    'interests',
    'blockedUsers'    
  ];

  updateableFields.forEach(field => {
    if(field in req.body) {
     updated[field] = req.body[field];
    }
  });

  const newPassword = req.body['password'] || '';

  User.hashPassword(newPassword)
    .then(hash => {
      if(req.body['password']) {
        updated['password'] = hash;
      }
      return User.findByIdAndUpdate(req.params.id, { $set: updated }, { new: true });
    })
    .then(user => {
      return res.status(200).json({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        screenName: user.screenName,
        location: user.location,
        longitude: user.longitude,
        latitude: user.latitude,
        interests: user.interests,
        blockedUsers: user.blockedUsers
      });
    })
    .catch(err => {
      console.error(err.message);
      return res.status(500).json({ message: 'Internal server error '});
    })
});

module.exports = router;