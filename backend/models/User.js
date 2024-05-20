const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema({
  credentialID: {
    type: String,
    required: true,
  },
  credentialPublicKey: {
    type: String,
    required: true,
  },
  counter: {
    type: Number,
    required: true,
  },
});

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  credentials: [CredentialSchema],
  currentChallenge: {
    type: String,
  },
});

module.exports = mongoose.model('User', UserSchema);
