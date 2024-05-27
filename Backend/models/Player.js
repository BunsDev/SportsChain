const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  PlayerId: {
    type: Number,
    required: true,
    unique: true,
  },
  Name: {
    type: String,
    required: true,
  },
  Position: {
    type: String,
    required: true,
  },
  TeamId: {
    type: Number,
    required: true,
  },
  Height: {
    type: String,
    required: false,
  },
  Weight: {
    type: String,
    required: false,
  },
  BirthDate: {
    type: Date,
    required: false,
  },
  BirthPlace: {
    type: String,
    required: false,
  },
  Nationality: {
    type: String,
    required: false,
  },
  InjuryStatus: {
    type: String,
    required: false,
  },
  PhotoUrl: {
    type: String,
    required: false,
  },
  Updated: {
    type: Date,
    required: false,
  },
});

module.exports = mongoose.models.Player || mongoose.model('Player', PlayerSchema);