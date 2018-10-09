const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const Message = require('../models/message');
const Conversation = require('../models/conversation');
const router = express.Router({ mergeParams: true });
const Joi = require('joi');

const jwtAuth = passport.authenticate('jwt', { session: false });

// add a message to a conversation specified in request parameter
router.post('/', jsonParser, jwtAuth, (req, res) => {
  if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    return res.status(400).json({ message: 'Request path id and request body id values must match'});
  }
  const schema = {
    id: Joi.string().required(),
    text: Joi.string().required()
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

  const { text } = req.body;
  const conversationId = req.params.id;
  const senderId = req.user.id;
  let conversation;
  let message;

  // get the conversation that the message will be added to
  Conversation
    .findById(conversationId)
    .then(_conversation => {
      conversation = _conversation;
      if(!conversation) {
        return Promise.reject({
          code: 404,
          reason: 'RequestError',
          message: 'Not Found'
        });
      }
      return Message.create({
        sender: senderId,
        conversation: conversationId,
        text
      });
    })
    .then(_message => {
      message = _message;
      // add the message reference to the conversation
      conversation.messages.push(message.id);
      return conversation.save();
    })
    .then(() => {
      return res.status(201).json(message.serialize());
    })
    .catch(err => {
      if(err.reason === 'RequestError') {
        return res.status(err.code).json(err);
      } else {
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
});

module.exports = router;