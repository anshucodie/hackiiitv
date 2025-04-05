import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Document from "@/models/Document";
import { auth } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    // Connect to the database
    console.log("Attempting to connect to database...");
    await dbConnect();
    console.log("Database connected successfully");

    // Get user ID from clerk session (if authenticated)
    const { userId } = auth();
    console.log("User ID:", userId || "Not authenticated");

    // Parse request body
    const data = await req.json();
    console.log("Received document data:", {
      ...data,
      content: data.content ? `${data.content.substring(0, 100)}...` : null,
    });

    // Add user ID to document data if available
    if (userId) {
      data.userId = userId;
    }

    // Create new document
    console.log("Creating new document...");
    const document = await Document.create(data);
    console.log("Document created successfully:", {
      _id: document._id,
      name: document.name,
      userId: document.userId,
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        document: JSON.parse(JSON.stringify(document)),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating document:", error.message);
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
    console.error("Error stack:", error.stack);

    // Determine the appropriate error message based on the error type
    let errorMessage = "Failed to create document";
    let statusCode = 500;

    if (error.name === "MongoServerSelectionError") {
      errorMessage = "Database connection error. Please try again later.";
    } else if (error.name === "ValidationError") {
      errorMessage = "Invalid document data provided";
      statusCode = 400;
    } else if (error.code === 11000) {
      errorMessage = "A document with this name already exists";
      statusCode = 409;
    }

    // Return more detailed error
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: error.message,
        details:
          process.env.NODE_ENV === "development"
            ? {
                name: error.name,
                code: error.code,
                stack: error.stack,
              }
            : undefined,
      },
      { status: statusCode }
    );
  }
}

export async function GET(req) {
  try {
    // Connect to the database
    console.log("Connecting to database...");
    await dbConnect();
    console.log("Database connected successfully");

    // Get user ID from clerk session (if authenticated)
    const { userId } = auth();
    console.log("User ID:", userId || "Not authenticated");

    let query = {};

    // If user is authenticated, only return their documents
    if (userId) {
      query.userId = userId;
    }

    // Get all documents for this user (or all if not authenticated)
    console.log("Fetching documents with query:", query);
    const documents = await Document.find(query).sort({ createdAt: -1 });
    console.log(`Found ${documents.length} documents`);

    // Return success response
    return NextResponse.json({
      success: true,
      documents: JSON.parse(JSON.stringify(documents)),
    });
  } catch (error) {
    console.error("Error fetching documents:", error.message);
    console.error("Error stack:", error.stack);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch documents",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
