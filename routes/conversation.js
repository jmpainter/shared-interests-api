const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const router = express.Router();
const User = require('../models/user');
const Conversation = require('../models/conversation');
const Joi = require('joi');

const jwtAuth = passport.authenticate('jwt', { session: false });

// get all conversations for an authenticated user
router.get('/', jwtAuth, (req, res) => {
  Conversation.find({ users: req.user.id })
  .populate('users', 'id screenName location')
  .populate('messages', 'id senderId text date')
    .then(conversations => {
      res.json({
        conversations
      });
    })
    .catch(err => {
      res.status(500).json({ message: 'Internal server error' });
    });
});

// get conversation by id of other user in conversation

router.get('/:id', jwtAuth, (req, res) => {
  Conversation.findOne({ users: { $all: [req.params.id, req.user.id] } })
    .populate('users', 'id screenName location')
    .populate('messages', 'id senderId text date')
    .then(conversation => {
      if(!conversation) {
        return res.status(404).json({ message: 'Not found' });
      } else {
        return res.status(200).json(conversation.serialize());
      }
    }) 
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
