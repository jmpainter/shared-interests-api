const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// interests are pulled from Wikipedia and associated id's are stored
const interestSchema = new Schema ({
  wikiPageId: String,
  name: String
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