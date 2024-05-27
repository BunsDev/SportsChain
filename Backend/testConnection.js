// testConnection.js
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const testConnection = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    mongoose.connection.close();
  }
};

testConnection();