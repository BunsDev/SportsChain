const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI="mongodb+srv://geraldquenum9:s0f4CFfTN2qRasJe@cluster0.53ny1d3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
console.log(`Connecting to MongoDB at ${MONGODB_URI}`);

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  console.log('Connected to MongoDB successfully');
  return cached.conn;
}

module.exports = dbConnect;