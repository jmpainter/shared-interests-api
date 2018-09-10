const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  firstName: String,
  lastName: String,
  screenName: String,
  userName: String,
  password: String,
  interests: [{
    type: Schema.Types.ObjectId,
    ref: 'Interest'
  }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;