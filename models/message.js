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

messageSchema.methods.serialize = function() {
  return {
    id: this.id,
    senderId: this.senderId,
    conversationId: this.conversationId,
    date: this.date,
    text: this.text
  }
}

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;