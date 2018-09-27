const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const router = express.Router();
const User = require('../models/user');
const Conversation = require('../models/conversation');
const Joi = require('joi');

const jwtAuth = passport.authenticate('jwt', { session: false });

// get conversations for an authenticated user except those with a blocked user
router.get('/', jwtAuth, (req, res) => {
  User.findById(req.user.id)
    .then(user => {
      return  Conversation.find({ 
        users: { $eq: user.id, $nin: user.blockedUsers }
      })
        .populate('users', 'id screenName location')
        .populate('messages', 'id senderId text date')
        .populate({
          path: 'messages',
          populate: {
            path: 'sender',
            model: 'User',
            select: 'screenName location'
          }
        });
    })
    .then(conversations => {
      res.json({
        conversations
      });
    })
    .catch(err => {
      res.status(500).json({ message: 'Internal server error' });
    });
});

// create a conversation
router.post('/', jsonParser, jwtAuth, (req, res) => {
  const schema = {
    recipient: Joi.string().alphanum().required()
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

  Conversation.create({
    users: [req.user.id, req.body.recipient]
  })
  .then(conversation => {
    res.status(201).json(conversation.serialize());
  })
  .catch(err => {
    res.status(500).json({ message: 'Internal server error'});
  });
});

module.exports = router;
