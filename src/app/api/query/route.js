import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Document from "@/models/Document";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    // Connect to the database
    console.log("Query API: Connecting to database...");
    try {
      await dbConnect();
      console.log("Query API: Database connected successfully");
    } catch (dbError) {
      console.error("Query API: Database connection error:", dbError);
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          message: dbError.message,
          details:
            process.env.NODE_ENV === "development" ? dbError.stack : undefined,
        },
        { status: 500 }
      );
    }

    // Get user ID from clerk session
    const { userId } = auth();
    console.log("Query API: User ID:", userId || "Not authenticated");

    // Parse request body
    let query;
    try {
      const body = await req.json();
      query = body.query;
      console.log("Query API: Received query:", query);
    } catch (parseError) {
      console.error("Query API: Error parsing request body:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          message: parseError.message,
        },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 }
      );
    }

    // Get all documents
    console.log(
      `Query API: Fetching documents ${
        userId ? "for user: " + userId : "for demo"
      }`
    );
    let documents;
    try {
      // If user is authenticated, get their documents
      // Otherwise, get sample documents without userId (for demo)
      const queryFilter = userId ? { userId } : { userId: { $exists: false } };
      documents = await Document.find(queryFilter);
      console.log(`Query API: Found ${documents.length} documents`);
    } catch (fetchError) {
      console.error("Query API: Error fetching documents:", fetchError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch documents",
          message: fetchError.message,
          details:
            process.env.NODE_ENV === "development"
              ? fetchError.stack
              : undefined,
        },
        { status: 500 }
      );
    }

    if (documents.length === 0) {
      const message = userId
        ? "I couldn't find any documents in your collection. Try adding some documents first!"
        : "I couldn't find any documents. Please sign in to query your documents or add some documents first.";

      return NextResponse.json({
        success: true,
        response: message,
        sources: [],
      });
    }

    // Simple search and relevance scoring function
    // We still do this to find the most relevant documents to send to Gemini
    const searchResults = documents.map((doc) => {
      // Calculate simple relevance score based on term frequency
      const docText = (doc.name + " " + doc.content).toLowerCase();
      const queryTerms = query.toLowerCase().split(/\s+/);

      let relevanceScore = 0;
      queryTerms.forEach((term) => {
        // Count occurrences of the term in the document
        const regex = new RegExp(term, "gi");
        const matches = docText.match(regex);
        if (matches) {
          relevanceScore += matches.length;
        }
      });

      return {
        id: doc._id.toString(),
        name: doc.name,
        content: doc.content,
        relevance: relevanceScore,
      };
    });

    // Sort by relevance and take top results
    const topResults = searchResults
      .filter((res) => res.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);

    if (topResults.length === 0) {
      return NextResponse.json({
        success: true,
        response:
          "I couldn't find any documents matching your query. Try a different search term.",
        sources: [],
      });
    }

    // Normalize relevance scores to percentages
    const maxRelevance = Math.max(...topResults.map((res) => res.relevance));
    const normalizedResults = topResults.map((res) => ({
      ...res,
      relevance: Math.round((res.relevance / maxRelevance) * 100),
    }));

    // Format documents for Gemini
    const documentsContext = normalizedResults
      .map(
        (doc, index) => `Document ${index + 1}: ${doc.name}\n${doc.content}\n`
      )
      .join("\n");

    // Create system prompt with instructions
    const systemPrompt = `You are an AI assistant that helps users find information in their documents.
The user query is: "${query}"

Here are the most relevant documents found in their collection:

${documentsContext}

Answer the user's query based ONLY on the information in these documents. 
If the documents don't contain relevant information to answer the query, be honest and say that you don't have enough information.
Always cite your sources by mentioning which document(s) you got the information from.
Format your response in a clear, helpful way using markdown formatting when appropriate.`;

    // Use Gemini to generate a response
    console.log("Query API: Sending request to Gemini 1.5 Flash");
    let geminiResponse;
    try {
      // Get the generative model (Gemini 1.5 Flash)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Generate content
      const result = await model.generateContent(systemPrompt);
      geminiResponse = result.response.text();
      console.log("Query API: Received response from Gemini");
    } catch (aiError) {
      console.error("Query API: Error generating AI response:", aiError);

      // Fallback to our simple response format if Gemini fails
      let fallbackResponse = `I found some information related to "${query}" in your documents:\n\n`;

      normalizedResults.forEach((res, index) => {
        // Extract a snippet from the content
        let snippet = res.content;
        if (snippet.length > 300) {
          snippet = snippet.substring(0, 300) + "...";
        }

        fallbackResponse += `${index + 1}. From "${res.name}":\n${snippet}\n\n`;
      });

      fallbackResponse +=
        "(Note: AI response generation failed, showing basic document matches instead.)";

      return NextResponse.json({
        success: true,
        response: fallbackResponse,
        sources: normalizedResults.map((res) => ({
          id: res.id,
          name: res.name,
          relevance: res.relevance,
        })),
        error: `AI generation error: ${aiError.message}`,
      });
    }

    console.log(
      "Query API: Sending response with",
      normalizedResults.length,
      "sources"
    );
    return NextResponse.json({
      success: true,
      response: geminiResponse,
      sources: normalizedResults.map((res) => ({
        id: res.id,
        name: res.name,
        relevance: res.relevance,
      })),
    });
  } catch (error) {
    console.error("Query API: Unhandled error:", error.message);
    console.error("Query API: Error stack:", error.stack);
    console.error("Query API: Error name:", error.name);
    console.error("Query API: Error code:", error.code);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process query",
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
      { status: 500 }
    );
  }
}
