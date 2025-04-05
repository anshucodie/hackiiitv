"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

async function fetchSharedDocument(token) {
  try {
    const response = await fetch(`/api/documents/share?token=${token}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch shared document");
    }

    const data = await response.json();
    return data.document;
  } catch (error) {
    console.error("Error fetching shared document:", error);
    throw error;
  }
}

async function downloadSharedDocument(documentId, documentName) {
  try {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download document");
    }

    const data = await response.json();

    // In a real implementation, you'd convert content to PDF
    // For now, we'll simulate a download by creating a text file
    const blob = new Blob([data.content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `${documentName}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);

    return data;
  } catch (error) {
    console.error("Error downloading document:", error);
    throw error;
  }
}

export default function SharedDocument({ params }) {
  const { token } = params;
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getDocument = async () => {
      try {
        setLoading(true);
        const doc = await fetchSharedDocument(token);
        setDocument(doc);
        setError(null);
      } catch (error) {
        console.error("Error fetching document:", error);
        setError("This shared document is unavailable or has expired.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      getDocument();
    }
  }, [token]);

  const handleDownload = async () => {
    if (!document) return;

    try {
      await downloadSharedDocument(document._id, document.name);
    } catch (error) {
      alert(`Failed to download document: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading shared document...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="bg-red-100 p-4 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
              <div className="mt-6">
                <Link
                  href="/"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  Return to homepage
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-indigo-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-white truncate">
                    Shared Document: {document.name}
                  </h1>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-sm text-gray-500">
                      Shared on:{" "}
                      {formatDate(
                        document.shareExpiry
                          ? new Date(document.shareExpiry).setDate(
                              new Date(document.shareExpiry).getDate() - 7
                            )
                          : document.createdAt
                      )}
                    </p>
                    {document.shareExpiry && (
                      <p className="text-sm text-red-500">
                        Expires on: {formatDate(document.shareExpiry)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Document
                  </button>
                </div>

                <div className="mt-6">
                  <h2 className="text-lg font-medium text-gray-900">
                    Document Preview
                  </h2>
                  <div className="mt-2 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                      {document.content.length > 1000
                        ? document.content.substring(0, 1000) +
                          "...\n\n(Download the full document to view all content)"
                        : document.content}
                    </pre>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
