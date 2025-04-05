import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Document from "@/models/Document";
import { auth } from "@clerk/nextjs/server";

// Get a single document by ID
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const document = await Document.findById(id);

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document: JSON.parse(JSON.stringify(document)),
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

// Update an existing document
export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    // Parse request body
    const updates = await req.json();

    // Get current document to check if it exists and belongs to user
    const document = await Document.findById(id);

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Optional: Check if the user owns the document (in a real app)
    // const { userId } = auth();
    // if (document.userId && document.userId !== userId) {
    //   return NextResponse.json({ success: false, error: "Not authorized to update this document" }, { status: 403 });
    // }

    // Allow updating specific fields
    const allowedUpdates = {};

    if (updates.hasOwnProperty("isFavorite")) {
      allowedUpdates.isFavorite = updates.isFavorite;
    }

    if (updates.hasOwnProperty("name")) {
      allowedUpdates.name = updates.name;
    }

    if (updates.hasOwnProperty("content")) {
      allowedUpdates.content = updates.content;
    }

    if (updates.hasOwnProperty("expiryDate")) {
      allowedUpdates.expiryDate = updates.expiryDate;
    }

    // Update the document
    const updatedDocument = await Document.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      document: JSON.parse(JSON.stringify(updatedDocument)),
    });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update document",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Download document endpoint - returns content for PDF generation
export async function POST(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const document = await Document.findById(id);

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // For a real implementation, we would generate a PDF here
    // For now, we'll just return the document content

    return NextResponse.json({
      success: true,
      document: JSON.parse(JSON.stringify(document)),
      content: document.content,
      fileName: `${document.name}.pdf`,
    });
  } catch (error) {
    console.error("Error downloading document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to download document" },
      { status: 500 }
    );
  }
}

// Delete a document
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const { userId } = auth();

    const document = await Document.findById(id);

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Optional: Check if the user owns the document
    // if (document.userId && document.userId !== userId) {
    //   return NextResponse.json(
    //     { success: false, error: "Not authorized to delete this document" },
    //     { status: 403 }
    //   );
    // }

    // Delete the document
    await Document.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
