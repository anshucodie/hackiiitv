import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Document from "@/models/Document";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";

// Generate a share link
export async function POST(req) {
  try {
    await dbConnect();
    const { userId } = auth();
    const { documentId, expiresIn = 7 } = await req.json(); // Default expiry: 7 days

    const document = await Document.findById(documentId);

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Optional: Check if the user owns the document
    // if (document.userId && document.userId !== userId) {
    //   return NextResponse.json(
    //     { success: false, error: "Not authorized to share this document" },
    //     { status: 403 }
    //   );
    // }

    // Generate a unique share token
    const shareToken = crypto.randomBytes(20).toString("hex");

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiresIn);

    // Add share info to the document
    const updatedDocument = await Document.findByIdAndUpdate(
      documentId,
      {
        $set: {
          shareToken: shareToken,
          shareExpiry: expiryDate,
          isShared: true,
        },
      },
      { new: true }
    );

    // Generate the share URL
    const shareUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/shared/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      shareToken,
      shareExpiry: expiryDate,
      document: JSON.parse(JSON.stringify(updatedDocument)),
    });
  } catch (error) {
    console.error("Error sharing document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to share document" },
      { status: 500 }
    );
  }
}

// Get a document by share token
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No share token provided" },
        { status: 400 }
      );
    }

    const document = await Document.findOne({ shareToken: token });

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Invalid share token" },
        { status: 404 }
      );
    }

    // Check if share link has expired
    if (document.shareExpiry && new Date() > new Date(document.shareExpiry)) {
      return NextResponse.json(
        { success: false, error: "Share link has expired" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      document: JSON.parse(JSON.stringify(document)),
    });
  } catch (error) {
    console.error("Error fetching shared document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shared document" },
      { status: 500 }
    );
  }
}
