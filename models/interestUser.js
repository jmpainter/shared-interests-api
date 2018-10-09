const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// creating a separate collection to associate users and interests
// to avoid embedding users in the interest documents
// because of performance issues with large embedded arrays in MongoDB
const interestUserSchema = new Schema({
  interest: {
    type: Schema.Types.ObjectId,
    ref: 'Interest'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

const InterestUser = mongoose.model('InterestUser', interestUserSchema);

module.exports = InterestUser;
