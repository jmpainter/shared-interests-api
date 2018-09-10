const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  text: String
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;