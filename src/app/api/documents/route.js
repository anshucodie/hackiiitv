import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Document from "@/models/Document";
import { auth } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    // Connect to the database
    await dbConnect();

    // Get user ID from clerk session (if authenticated)
    const { userId } = auth();

    // Parse request body
    const data = await req.json();

    console.log("Received document data:", data);

    // Add user ID to document data if available
    if (userId) {
      data.userId = userId;
    }

    // Create new document
    const document = await Document.create(data);
    console.log("Document created successfully:", document);

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
    console.error("Error stack:", error.stack);

    // Return more detailed error
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create document",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
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
