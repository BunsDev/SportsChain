const mongoose = require('mongoose');
const { Schema } = mongoose;

const TeamSchema = new mongoose.Schema({
  TeamId: {
    type: Number,
    required: true,
    unique: true,
  },
  Name: {
    type: String,
    required: true,
  },
  AreaId: {
    type: Number,
    required: true,
  },
  StadiumId: {
    type: Number,
    required: false,
  },
  Abbreviation: {
    type: String,
    required: false,
  },
  Founded: {
    type: Number,
    required: false,
  },
  PrimaryColor: {
    type: String,
    required: false,
  },
  SecondaryColor: {
    type: String,
    required: false,
  },
  LogoUrl: {
    type: String,
    required: false,
  },
  Website: {
    type: String,
    required: false,
  },
  Updated: {
    type: Date,
    required: false,
  },
  Players: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
});

module.exports = mongoose.models.Team || mongoose.model('Team', TeamSchema);