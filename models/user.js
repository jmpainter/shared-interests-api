const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;
const passport = require('passport');

const userSchema = new Schema({
  firstName: String,
  lastName: String,
  screenName: String,
  location: String,
  username: String,
  password: String,
  interests: [{
    type: Schema.Types.ObjectId,
    ref: 'Interest'
  }]
});

userSchema.methods.serialize = function() {
  return {
    id: this.id,
    firstName: this.firstName,
    lastName: this.lastName,
    screenName: this.screenName,
    location: this.location || '',
    username: this.username
   // interests: this.interests
  }
}

userSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
}

userSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
}

const User = mongoose.model('User', userSchema);

module.exports = User;