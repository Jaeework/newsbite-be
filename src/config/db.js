
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    const conn = await mongoose.connect(mongoURI);
    console.log(`mongoose connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("DB connection fail", error);
    process.exit(1);
  }
};

module.exports = connectDB;
