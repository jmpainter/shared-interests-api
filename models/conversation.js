const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// a conversation's associated users are stored in an array
// for the future possiblity of multi user conversations
const conversationSchema = new Schema({
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

conversationSchema.methods.serialize = function () {
  return {
    id: this.id,
    data: this.date,
    users: this.users,
    messages: this.messages
  }
}

const Conversatation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversatation;