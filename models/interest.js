const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const interestSchema = new Schema ({
  _id: Schema.Types.ObjectId,
  wikiPageId: Number,
  name: String,
  users: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const Interest = mongoose.model('Interest', interestSchema);

module.exports = Interest;

