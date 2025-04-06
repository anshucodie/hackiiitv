import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI with error handling
const getGenAI = () => {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }

  return new GoogleGenerativeAI(apiKey);
};

// Add a timeout to the fetch request
const fetchWithTimeout = async (promise, timeout = 8000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeout)
    ),
  ]);
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

    // Check if this is a template generation request (which might be longer)
    const isTemplateGeneration =
      prompt.toLowerCase().includes("generate") &&
      prompt.toLowerCase().includes("template");

    // Use a simplified prompt for template generation to reduce complexity
    let fullPrompt;
    if (isTemplateGeneration) {
      // Shorter, more direct prompt for template generation
      fullPrompt = `Create a brief template for: ${prompt}
      
Keep it under 2000 characters and focus on the most essential elements only.
Include placeholders like [NAME], [DATE], etc. where appropriate.
Provide only the template content without additional explanations.`;
    } else {
      // Standard editing prompt
      fullPrompt = `Please edit the following document according to this instruction: "${prompt}"
    
Document content:
${content}

Please provide only the edited document content without any explanations or additional text.`;
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

    // Use a faster model for template generation to avoid timeouts on Vercel
    const modelName = isTemplateGeneration
      ? "gemini-1.5-flash"
      : "gemini-1.5-pro";
    console.log(
      `Using model: ${modelName} for ${
        isTemplateGeneration ? "template generation" : "document editing"
      }`
    );

    // Initialize the model with appropriate settings
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens: isTemplateGeneration ? 1024 : 2048,
        temperature: isTemplateGeneration ? 0.3 : 0.7,
      },
    });

    try {
      // Generate content with timeout to prevent Vercel function timeout
      const generationPromise = model.generateContent(fullPrompt);
      const result = await fetchWithTimeout(generationPromise, 8000);

      const response = await result.response;
      const editedContent = response.text();

      return NextResponse.json({
        success: true,
        editedContent,
      });
    } catch (aiError) {
      console.error("Gemini API error:", aiError);

      // If it's a timeout error, return a more user-friendly response
      if (aiError.message === "Request timed out") {
        return NextResponse.json(
          {
            success: false,
            error:
              "The template generation timed out. Please try a simpler template description.",
            timeoutError: true,
          },
          { status: 504 }
        );
      }

      // For other AI errors
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
