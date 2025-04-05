"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

// Message type constants
const MESSAGE_TYPE = {
  USER: "user",
  AI: "ai",
  LOADING: "loading",
};

export default function Query() {
  const { isSignedIn, user } = useUser();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [demoDocsLoaded, setDemoDocsLoaded] = useState(false);
  const [arrowDirection, setArrowDirection] = useState("right");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Update arrow direction based on input value
  useEffect(() => {
    if (inputValue.trim() !== "") {
      setArrowDirection("up");
    } else {
      setArrowDirection("right");
    }
  }, [inputValue]);

  // Handle loading demo documents
  const handleLoadDemoDocuments = async () => {
    setIsDemoLoading(true);
    try {
      const response = await fetch("/api/seed");
      const data = await response.json();

      if (data.success) {
        setDemoDocsLoaded(true);
        setMessages([
          {
            type: MESSAGE_TYPE.AI,
            content: `Demo documents loaded successfully! You can now ask questions about:\n\n${data.documents
              .map((doc) => `- ${doc.name}`)
              .join(
                "\n"
              )}\n\nTry asking something like "What's in the research notes?" or "Tell me about the project proposal."`,
          },
        ]);
      } else {
        setMessages([
          {
            type: MESSAGE_TYPE.AI,
            content:
              "Sorry, I couldn't load the demo documents. Please try again later.",
            error: true,
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading demo documents:", error);
      setMessages([
        {
          type: MESSAGE_TYPE.AI,
          content:
            "Sorry, I couldn't load the demo documents. Please try again later.",
          error: true,
        },
      ]);
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    // Set arrow direction back to right when sending
    setArrowDirection("right");

    const userMessage = inputValue.trim();
    setInputValue("");

    // Add user message to the chat
    setMessages((prev) => [
      ...prev,
      { type: MESSAGE_TYPE.USER, content: userMessage },
      { type: MESSAGE_TYPE.LOADING, content: "" },
    ]);

    setIsLoading(true);

    try {
      console.log("Sending query to API:", userMessage);

      // Send the query to the API
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userMessage }),
      });

      console.log("API response status:", response.status);

      // Get the response text first for debugging
      const responseText = await response.text();
      console.log("Raw API response:", responseText);

      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse API response as JSON:", parseError);
        throw new Error(`Server returned invalid JSON: ${responseText}`);
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || "Unknown error";
        console.error("API error response:", data);
        throw new Error(errorMessage);
      }

      // Replace the loading message with the AI response
      setMessages((prev) => {
        const newMessages = [...prev];
        // Find the loading message and replace it
        const loadingIndex = newMessages.findIndex(
          (msg) => msg.type === MESSAGE_TYPE.LOADING
        );

        if (loadingIndex !== -1) {
          newMessages[loadingIndex] = {
            type: MESSAGE_TYPE.AI,
            content: data.response,
            sources: data.sources || [],
            error: data.error,
          };
        }

        return newMessages;
      });
    } catch (error) {
      console.error("Error fetching response:", error);

      // Replace loading message with error
      setMessages((prev) => {
        const newMessages = [...prev];
        const loadingIndex = newMessages.findIndex(
          (msg) => msg.type === MESSAGE_TYPE.LOADING
        );

        if (loadingIndex !== -1) {
          newMessages[loadingIndex] = {
            type: MESSAGE_TYPE.AI,
            content: `Sorry, I couldn't process your request: ${error.message}. Please try again.`,
            error: true,
          };
        }

        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 border border-[#cfd490] rounded-xl h-[calc(100vh-28px)] flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl text-black font-bold flex items-center ml-2">
            Query Your Documents
          </h1>
        </div>

        {!isSignedIn && !demoDocsLoaded && (
          <button
            onClick={handleLoadDemoDocuments}
            disabled={isDemoLoading}
            className={`px-4 py-2 rounded-lg ${
              isDemoLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#cfd490] hover:bg-[#bfc380]"
            } text-black font-medium`}
          >
            {isDemoLoading ? "Loading..." : "Load Demo Documents"}
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden border border-[#cfd490] mb-4">
        <div className="overflow-y-auto h-full p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mb-4 text-[#cfd490]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <p className="text-lg">Ask me anything about your documents!</p>
              <p className="text-sm mt-2">
                I can search through your documents and provide insights based
                on their content, powered by Gemini 1.5 Flash AI.
              </p>
              {!isSignedIn && !demoDocsLoaded && (
                <p className="text-sm mt-4 text-orange-500">
                  You are not signed in. Click "Load Demo Documents" to try the
                  query feature with sample documents.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.type === MESSAGE_TYPE.USER
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-lg px-4 py-3 max-w-[80%] ${
                      message.type === MESSAGE_TYPE.USER
                        ? "bg-[#cfd490] text-black"
                        : message.type === MESSAGE_TYPE.LOADING
                        ? "bg-gray-100"
                        : message.error
                        ? "bg-red-50 text-red-800"
                        : "bg-gray-100 text-black"
                    }`}
                  >
                    {message.type === MESSAGE_TYPE.LOADING ? (
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    ) : (
                      <div>
                        <div className="prose prose-sm max-w-none">
                          {message.error ? (
                            <p className="whitespace-pre-wrap text-red-800">
                              {message.content}
                            </p>
                          ) : (
                            <div
                              className="markdown-content"
                              dangerouslySetInnerHTML={{
                                __html: formatMarkdown(message.content),
                              }}
                            />
                          )}
                        </div>
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 font-semibold">
                              Sources:
                            </p>
                            <ul className="text-xs text-gray-500 mt-1">
                              {message.sources.map((source, idx) => (
                                <li key={idx} className="mb-1">
                                  {source.name} - {source.relevance}% relevance
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-[#cfd490]">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your documents..."
            className="flex-1 border border-gray-300 rounded-l-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#cfd490]"
            disabled={isLoading || (!isSignedIn && !demoDocsLoaded)}
          />
          <button
            type="submit"
            disabled={
              isLoading ||
              !inputValue.trim() ||
              (!isSignedIn && !demoDocsLoaded)
            }
            className={`py-3 px-6 rounded-r-lg text-white ${
              isLoading ||
              !inputValue.trim() ||
              (!isSignedIn && !demoDocsLoaded)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#cfd490] hover:bg-[#bfc380] text-black"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6.5 w-5 transform transition-transform duration-300 ${
                arrowDirection === "up" ? "-rotate-90" : ""
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

// Function to format markdown to HTML
function formatMarkdown(text) {
  // Very simple markdown conversion
  // Headers
  let html = text
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")

    // Bold and italic
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")

    // Lists
    .replace(/^\s*-\s*(.*)/gim, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n)+/gim, "<ul>$&</ul>")
    .replace(/^\s*\d+\.\s*(.*)/gim, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n)+/gim, "<ol>$&</ol>")

    // Links
    .replace(
      /\[(.*?)\]\((.*?)\)/gim,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )

    // Code blocks
    .replace(/```([\s\S]*?)```/gim, "<pre><code>$1</code></pre>")
    .replace(/`([^`]+)`/gim, "<code>$1</code>")

    // Paragraphs and line breaks
    .replace(/\n\n/gim, "</p><p>")
    .replace(/\n/gim, "<br>");

  // Wrap with paragraph tags if not already wrapped
  if (!html.startsWith("<h") && !html.startsWith("<p>")) {
    html = "<p>" + html + "</p>";
  }

  return html;
}
