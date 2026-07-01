const mongoose = require("mongoose");
const dns = require("dns");

mongoose.set("strictQuery", false);

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

const connectDB = async () => {
  const MONGO_DB_URL = process.env.MONGO_DB_URL;

  if (!MONGO_DB_URL) {
    throw new Error("Please define the MONGO_DB_URL environment variable.");
  }

  // Return cached connection
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if one doesn't exist
  if (!cached.promise) {
    // Fix Windows DNS SRV issues with MongoDB Atlas
    if (
      process.platform === "win32" &&
      MONGO_DB_URL.startsWith("mongodb+srv://")
    ) {
      try {
        const originalServers = dns.getServers();

        dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1", ...originalServers]);

        console.log("DNS servers:", dns.getServers());
      } catch (err) {
        console.warn("Unable to set DNS servers:", err.message);
      }
    }

    cached.promise = mongoose.connect(MONGO_DB_URL, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB connected successfully.");
  } catch (err) {
    cached.promise = null;
    console.error("MongoDB connection failed:");
    console.error(err);
    throw err;
  }

  return cached.conn;
};

module.exports = connectDB;
