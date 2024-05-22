const mongoose = require('mongoose');

const AreaSchema = new mongoose.Schema({
  AreaId: {
    type: Number,
    required: true,
    unique: true,
  },
  CountryCode: {
    type: String,
    required: true,
  },
  Name: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.models.Area || mongoose.model('Area', AreaSchema);