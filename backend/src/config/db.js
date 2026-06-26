import mongoose from 'mongoose';

/**
 * Connects to MongoDB using Mongoose.
 * Reads connection URI from environment variables.
 */
const connectDB = async () => {
  try {
    // Support both MONGODB_URI and MONGO_URI from the environment
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error('MongoDB connection URI is missing in the environment variables.');
    }

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected! Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully.');
    });

    console.log(`=============================================`);
    console.log(`  MongoDB Connected Successfully!`);
    console.log(`  Host: ${conn.connection.host}`);
    console.log(`  Database Name: ${conn.connection.name}`);
    console.log(`=============================================`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
