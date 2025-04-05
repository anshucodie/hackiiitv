import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI with error handling
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }

  return new GoogleGenerativeAI(apiKey);
};

export async function POST(req) {
  try {
    // Parse request body
    const { content, prompt } = await req.json();

    if (!content || !prompt) {
      return NextResponse.json(
        { success: false, error: "Content and prompt are required" },
        { status: 400 }
      );
    }

    // Initialize the Gemini AI
    let genAI;
    try {
      genAI = getGenAI();
    } catch (error) {
      console.error("Error initializing Gemini AI:", error);
      return NextResponse.json(
        {
          success: false,
          error: `Error initializing Gemini AI: ${error.message}`,
        },
        { status: 500 }
      );
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Prepare the prompt
    const fullPrompt = `Please edit the following document according to this instruction: "${prompt}"
    
Document content:
${content}

Please provide only the edited document content without any explanations or additional text.`;

    try {
      // Generate content
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const editedContent = response.text();

      return NextResponse.json({
        success: true,
        editedContent,
      });
    } catch (aiError) {
      console.error("Gemini API error:", aiError);
      return NextResponse.json(
        {
          success: false,
          error: `Gemini API error: ${aiError.message || "Unknown AI error"}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error editing document with Gemini:", error);
    return NextResponse.json(
      { success: false, error: `Failed to edit document: ${error.message}` },
      { status: 500 }
    );
  }
}
