const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
  _id: Schema.Types.ObjectId,
  date: Date,
  users: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [{
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }]
});

const Conversatation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversatation;