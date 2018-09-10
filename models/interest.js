const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const interestSchema = new Schema ({
  wikiPageId: Number,
  name: String,
  users: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

interestSchema.methods.serialize = function() {
  return {
    id: this.id,
    wikiPageId: this.wikiPageId,
    name: this.name
  }
}

const Interest = mongoose.model('Interest', interestSchema);

module.exports = Interest;

