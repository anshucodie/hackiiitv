import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Document from "@/models/Document";

export async function GET() {
  try {
    console.log("Seed API: Connecting to database...");
    await dbConnect();
    console.log("Seed API: Database connected successfully");

    console.log("Seed API: Checking for existing demo documents...");
    const existingDocs = await Document.find({ userId: { $exists: false } });

    if (existingDocs.length > 0) {
      console.log(
        `Seed API: Found ${existingDocs.length} existing demo documents`
      );
      return NextResponse.json({
        success: true,
        message: `${existingDocs.length} demo documents already exist`,
        documents: existingDocs.map((doc) => ({
          id: doc._id.toString(),
          name: doc.name,
        })),
      });
    }

    console.log("Seed API: Creating demo documents...");

    // Sample documents for demo purposes
    const demoDocuments = [
      {
        name: "Getting Started Guide",
        content: `# Welcome to Your Document System

This guide will help you get started with our document management system.

## Creating Documents

To create a new document, follow these steps:
1. Click on "Add Document" in the Documents tab
2. Choose a template or start from scratch
3. Enter your content and save

## Searching Documents

The Query feature allows you to search across all your documents using natural language. Simply type your question in the query box and our AI will search through your documents to find relevant information.

## Managing Documents

You can favorite, share, and delete documents from the Documents tab. Click the corresponding icon next to each document to perform these actions.`,
        templateId: "blank",
        size: "1.2 KB",
        fileType: "pdf",
        createdAt: new Date(),
      },
      {
        name: "Project Proposal",
        content: `# Project Proposal: AI-Powered Document Management

## Executive Summary

This proposal outlines our plan to develop an AI-powered document management system that will revolutionize how organizations handle their documentation needs.

## Problem Statement

Organizations struggle with:
- Document fragmentation across multiple platforms
- Difficulty finding specific information quickly
- Manual tagging and organization requirements
- Limited insights from document content

## Solution

Our document management system features:
- Centralized storage with robust search capabilities
- AI-powered content analysis and tagging
- Natural language querying of document contents
- Automatic summarization and key point extraction

## Budget and Timeline

Implementation will require:
- Development: $150,000
- Infrastructure: $30,000
- Testing and Deployment: $20,000

Timeline: 6 months from project kickoff to initial release`,
        templateId: "proposal",
        size: "1.5 KB",
        fileType: "pdf",
        createdAt: new Date(),
      },
      {
        name: "Research Notes",
        content: `# Research Notes: Natural Language Processing Advancements

## Vector Embeddings

Recent advancements in vector embeddings have dramatically improved information retrieval systems. By representing documents as high-dimensional vectors, we can efficiently find semantic relationships between different texts.

Key findings:
- Transformer-based embeddings outperform traditional word vectors
- Contrastive learning approaches show promising results
- Domain-specific fine-tuning significantly improves performance

## Retrieval-Augmented Generation

Combining retrieval systems with generative models leads to:
1. More factually accurate responses
2. Ability to cite sources and provide evidence
3. Better handling of specialized knowledge domains

## Future Directions

Our next research phase will focus on:
- Multi-modal embeddings (text + images)
- Efficient vector search at scale
- Evaluation metrics for retrieval quality`,
        templateId: "notes",
        size: "1.3 KB",
        fileType: "pdf",
        createdAt: new Date(),
      },
    ];

    // Insert demo documents
    const inserted = await Document.insertMany(demoDocuments);
    console.log(
      `Seed API: Successfully created ${inserted.length} demo documents`
    );

    return NextResponse.json({
      success: true,
      message: `Created ${inserted.length} demo documents`,
      documents: inserted.map((doc) => ({
        id: doc._id.toString(),
        name: doc.name,
      })),
    });
  } catch (error) {
    console.error("Seed API: Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed database",
        message: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
