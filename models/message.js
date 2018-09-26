const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  text: String
});

messageSchema.methods.serialize = function() {
  return {
    id: this.id,
    sender: this.senderId,
    conversation: this.conversationId,
    date: this.date,
    text: this.text
  }
}

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;