import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Document from "@/models/Document";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI client
const getGenAI = () => {
  // Check environment in server-side code
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined in environment variables");
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

// Analyze document content and extract expiry date
async function extractExpiryDate(content, name) {
  try {
    const genAI = getGenAI();
    if (!genAI) {
      console.error("Gemini AI client could not be initialized");
      return null;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are an AI document analyzer. Analyze the following document and extract the expiry date if present.
    The document is titled: "${name}"
    
    Document content:
    ${content.substring(0, 15000)}  // Limit content length for API constraints
    
    Extract ONLY the expiry date in YYYY-MM-DD format. If no specific expiry date is found, respond with "NONE".
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    console.log(`Gemini API response for document "${name}": ${response}`);

    if (response === "NONE" || !response.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return null;
    }

    return response;
  } catch (error) {
    console.error("Error analyzing document:", error.message);
    // Not failing the entire process because of individual document analysis issues
    return null;
  }
}

// Update expiry date for a single document
export async function PATCH(req) {
  try {
    // Connect to the database
    console.log("Connecting to database for PATCH expiry...");
    await dbConnect();
    console.log("Database connected successfully");

    // Parse request body
    const { documentId } = await req.json();
    console.log(`Updating expiry for document ID: ${documentId}`);

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Get the document
    const document = await Document.findById(documentId);

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Extract expiry date
    console.log(`Extracting expiry date for document: ${document.name}`);
    const expiryDate = await extractExpiryDate(document.content, document.name);
    console.log(`Extracted expiry date: ${expiryDate || "None found"}`);

    // Update the document with expiry date
    const updatedDocument = await Document.findByIdAndUpdate(
      documentId,
      {
        $set: { expiryDate },
      },
      { new: true }
    );
    console.log(`Document updated successfully: ${document.name}`);

    return NextResponse.json({
      success: true,
      document: JSON.parse(JSON.stringify(updatedDocument)),
    });
  } catch (error) {
    console.error("Error updating document expiry:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update document expiry",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Scan all documents for a user and update expiry dates
export async function POST(req) {
  try {
    // Connect to the database
    console.log("Connecting to database for POST expiry scan...");
    await dbConnect();
    console.log("Database connected successfully");

    // Try to get user ID from clerk session
    let userId = null;
    try {
      const session = auth();
      userId = session?.userId;
      console.log(`User ID from auth: ${userId || "Not authenticated"}`);
    } catch (authError) {
      console.log("Auth error:", authError.message);
      // Continue without user authentication for development/testing
    }

    // Get documents - either for specific user or all documents for testing
    console.log(
      `Fetching documents${
        userId ? ` for user: ${userId}` : " (all documents)"
      }`
    );

    // Query based on whether we have a user ID
    const query = userId ? { userId } : {};
    const documents = await Document.find(query);
    console.log(`Found ${documents.length} documents to scan`);

    if (documents.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No documents found to scan",
        processed: 0,
        updated: 0,
        results: [],
      });
    }

    // Process each document
    const results = [];
    for (const document of documents) {
      try {
        console.log(`Processing document: ${document.name} (${document._id})`);
        // Skip documents without content
        if (!document.content) {
          console.log(`Document ${document._id} has no content, skipping`);
          results.push({
            id: document._id,
            name: document.name,
            status: "skipped_no_content",
          });
          continue;
        }

        // Extract expiry date
        const expiryDate = await extractExpiryDate(
          document.content,
          document.name
        );
        console.log(
          `Extracted expiry date for ${document.name}: ${
            expiryDate || "None found"
          }`
        );

        // Update document if expiry date found
        if (expiryDate) {
          await Document.findByIdAndUpdate(document._id, {
            $set: { expiryDate },
          });
          console.log(
            `Document ${document._id} updated with expiry date: ${expiryDate}`
          );

          results.push({
            id: document._id,
            name: document.name,
            expiryDate,
            status: "updated",
          });
        } else {
          console.log(`No expiry date found for document ${document._id}`);
          results.push({
            id: document._id,
            name: document.name,
            status: "no_expiry_found",
          });
        }
      } catch (error) {
        console.error(`Error processing document ${document._id}:`, error);
        results.push({
          id: document._id,
          name: document.name,
          status: "error",
          error: error.message,
        });
        // Continue with the next document, don't fail the entire batch
      }
    }

    console.log(`Completed scanning ${documents.length} documents`);
    return NextResponse.json({
      success: true,
      processed: results.length,
      updated: results.filter((r) => r.status === "updated").length,
      results,
    });
  } catch (error) {
    console.error("Error scanning documents:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to scan documents",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
