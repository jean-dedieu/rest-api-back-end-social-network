const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const academieschema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  image: { type: String, required: true },
  players: [{ type: mongoose.Types.ObjectId, required: true, ref: 'player' }]
});

academieschema.plugin(uniqueValidator);

module.exports = mongoose.model('Academy', academieschema);
