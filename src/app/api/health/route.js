import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import mongoose from "mongoose";

export async function GET() {
  let mongodbConnected = false;

  try {
    console.log("Health check: Testing MongoDB connection...");

    // Try to connect to MongoDB
    await dbConnect();

    // Check connection state
    mongodbConnected = mongoose.connection.readyState === 1;

    console.log(
      "Health check: MongoDB connection state:",
      mongoose.connection.readyState === 1 ? "Connected" : "Not connected"
    );

    if (mongodbConnected) {
      console.log(
        "Health check: Connected to MongoDB database:",
        mongoose.connection.name
      );
    }

    // Return health status
    return NextResponse.json({
      status: "ok",
      message: "API is operational",
      timestamp: new Date().toISOString(),
      mongodb: mongodbConnected,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error("Health check: MongoDB connection error:", error);

    // Return error status but still a 200 response to avoid error cascade
    return NextResponse.json({
      status: "error",
      message: "API is operational but database connection failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Database connection error",
      timestamp: new Date().toISOString(),
      mongodb: false,
      environment: process.env.NODE_ENV,
    });
  }
}
