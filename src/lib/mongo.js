import mongoose from "mongoose";

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Check if MongoDB URI is defined
if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env"
  );
}

// Log the MongoDB URI (excluding password) for debugging
console.log(
  "MongoDB URI configured:",
  MONGODB_URI.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, (match) =>
    match.replace(/:[^@]+@/, ":***@")
  )
);

// Cache the database connection
let cached = global.mongoose || { conn: null, promise: null };

// Connect to MongoDB
async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      connectTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      serverSelectionTimeoutMS: 5000, // 5 seconds
      // Add any additional connection options here
    };

    console.log("Attempting to connect to MongoDB...");
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB connected successfully");
        console.log(
          "MongoDB connection state:",
          mongoose.connection.readyState
        );
        return mongoose;
      })
      .catch((error) => {
        console.error("MongoDB connection error:", error.message);
        console.error("Error code:", error.code);
        console.error("Error name:", error.name);
        if (error.name === "MongoServerSelectionError") {
          console.error(
            "This may be due to network issues or incorrect credentials"
          );
        }
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error("Error awaiting MongoDB connection:", e.message);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
