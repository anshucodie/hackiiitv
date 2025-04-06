"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { ChartColumn, History, Plus, File } from "../../../components/icons";

// Initialize Gemini AI
const initGenAI = () => {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    return new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  }
  return null;
};

function isExpiringSoon(dateStr) {
  const now = new Date();
  const expiry = new Date(dateStr);
  const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
  return diffDays <= 14; // within 14 days
}

// Function to calculate time remaining until expiry
function calculateTimeRemaining(expiryDate) {
  if (!expiryDate) return Infinity;

  const now = new Date();
  const expiry = new Date(expiryDate);
  return expiry - now; // milliseconds until expiry
}

// Function to format time remaining
function formatTimeRemaining(expiryDate) {
  if (!expiryDate) return "No expiry date";

  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry - now;

  // If already expired
  if (diffMs < 0) return "Expired";

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  if (diffDays > 30) {
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} remaining`;
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} remaining`;
  } else {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} remaining`;
  }
}

// Function to fetch documents from MongoDB
async function fetchDocuments() {
  try {
    console.log("Attempting to fetch documents...");
    const response = await fetch("/api/documents", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add cache: 'no-store' to prevent caching issues
      cache: "no-store",
    });

    // Get the raw response text for better debugging
    const responseText = await response.text();
    console.log("Raw API response:", responseText);

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse API response as JSON:", parseError);
      throw new Error(`Invalid API response: ${responseText}`);
    }

    // Check for API errors
    if (!response.ok) {
      const errorMessage =
        data?.error || data?.message || "Failed to fetch documents";
      console.error("API error response:", data);
      throw new Error(errorMessage);
    }

    return data.documents || [];
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
}

// Function to trigger document scanning for expiry dates
async function scanDocumentsForExpiry() {
  try {
    console.log("Calling API to scan documents for expiry dates");
    const response = await fetch("/api/documents/expiry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("API Error:", data);
      throw new Error(data.error || data.message || "Failed to scan documents");
    }

    console.log("Scan response:", data);
    return data;
  } catch (error) {
    console.error("Error scanning documents:", error);
    throw error;
  }
}

// Function to set dummy expiry dates for testing (when Gemini API not available)
const setDummyExpiryDates = async () => {
  setIsScanning(true);
  setScanError(null);

  try {
    // Get all documents
    const docs = await fetchDocuments();
    if (docs.length === 0) {
      setScanError("No documents found to set expiry dates");
      return;
    }

    console.log(`Setting dummy expiry dates for ${docs.length} documents`);
    let successCount = 0;

    // Set future expiry dates (randomly distributed within next 30 days)
    for (const doc of docs) {
      try {
        // Create a random expiry date 1-30 days in the future
        const daysToAdd = Math.floor(Math.random() * 30) + 1;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + daysToAdd);

        const response = await fetch(`/api/documents/${doc._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expiryDate: expiryDate.toISOString(),
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          console.error(`Failed to update document ${doc._id}`);
        }
      } catch (error) {
        console.error(`Error updating document ${doc._id}:`, error);
      }
    }

    // Update last scan time
    const now = new Date();
    setLastScan(now);
    localStorage.setItem("lastDocumentScan", now.toISOString());

    // Reload documents and update expiring docs
    console.log(`Successfully set expiry dates for ${successCount} documents`);
    const updatedDocs = await fetchDocuments();

    // Filter and sort by expiry date
    const expiringDocs = updatedDocs
      .filter((doc) => doc.expiryDate)
      .filter((doc) => isExpiringSoon(doc.expiryDate))
      .map((doc) => ({
        id: doc._id,
        title: doc.name,
        expiresOn: doc.expiryDate,
        timeRemaining: calculateTimeRemaining(doc.expiryDate),
      }))
      .sort((a, b) => a.timeRemaining - b.timeRemaining);

    setSoonExpiringDocs(expiringDocs);
  } catch (error) {
    console.error("Error setting dummy expiry dates:", error);
    setScanError(error.message || "Failed to set dummy expiry dates");
  } finally {
    setIsScanning(false);
  }
};

// Function to check API health
async function checkApiHealth() {
  try {
    console.log("Checking API health...");
    const response = await fetch("/api/health", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `API health check failed with status: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      ok: true,
      message: data.message || "API is healthy",
      mongodb: data.mongodb,
    };
  } catch (error) {
    console.error("API health check failed:", error);
    return {
      ok: false,
      message: error.message || "API health check failed",
    };
  }
}

// Fallback documents when API fails
const MOCK_DOCUMENTS = [
  {
    _id: "mock-doc-1",
    name: "Sample Contract",
    content: "This is a sample contract...",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    size: "24 KB",
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
  },
  {
    _id: "mock-doc-2",
    name: "Example Agreement",
    content: "This is an example agreement...",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    size: "18 KB",
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
  },
  {
    _id: "mock-doc-3",
    name: "Demo Document",
    content: "This is a demo document...",
    createdAt: new Date().toISOString(), // today
    size: "12 KB",
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
  },
];

export default function DashboardHome() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [documents, setDocuments] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [pending, setPending] = useState(0); // Could be updated with actual pending signatures count
  const [soonExpiringDocs, setSoonExpiringDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);
  const [useMockData, setUseMockData] = useState(false); // Flag to use mock data

  // Check API health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      if (isLoaded && isSignedIn) {
        const health = await checkApiHealth();
        setApiHealth(health);

        if (!health.ok || health.mongodb === false) {
          setFetchError(`API connection issue: ${health.message}`);
        }
      }
    };

    checkHealth();
  }, [isLoaded, isSignedIn]);

  // Function to load documents from API or mock data
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      if (useMockData) {
        console.log("Using mock data as fallback");
        // Use mock data directly
        const docs = MOCK_DOCUMENTS;

        // Set all documents
        setDocuments(docs);
        setTotalDocs(docs.length);

        // Sort by createdAt and set recent docs
        const sorted = [...docs].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        const recent = sorted.slice(0, 3).map((doc) => ({
          id: doc._id,
          name: doc.name,
          date: formatRelativeTime(doc.createdAt),
        }));

        setRecentDocs(recent);

        // Get documents with expiry dates
        const expiringDocs = docs
          .filter((doc) => doc.expiryDate)
          .filter((doc) => isExpiringSoon(doc.expiryDate))
          .map((doc) => ({
            id: doc._id,
            title: doc.name,
            expiresOn: doc.expiryDate,
            timeRemaining: calculateTimeRemaining(doc.expiryDate),
          }))
          .sort((a, b) => a.timeRemaining - b.timeRemaining);

        setSoonExpiringDocs(expiringDocs);

        setFetchError(null);
        setIsLoading(false);
        return;
      }

      // Check API health first
      const healthResponse = await fetch("/api/health");
      const healthData = await healthResponse.json();
      setApiHealth(healthData);

      // If MongoDB is not connected, suggest using mock data
      if (!healthData.mongodb) {
        setFetchError("Database connection issue. Please try using demo data.");
        setIsLoading(false);
        return;
      }

      // If we reach here, attempt to fetch real documents
      const response = await fetchDocuments();

      if (!Array.isArray(response)) {
        throw new Error("API returned unexpected data format");
      }

      const docs = response;

      setDocuments(docs);
      setTotalDocs(docs.length);

      // Sort by createdAt and set recent docs
      const sorted = [...docs].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      const recent = sorted.slice(0, 3).map((doc) => ({
        id: doc._id,
        name: doc.name,
        date: formatRelativeTime(doc.createdAt),
      }));

      setRecentDocs(recent);

      // Get documents with expiry dates
      const expiringDocs = docs
        .filter((doc) => doc.expiryDate)
        .filter((doc) => isExpiringSoon(doc.expiryDate))
        .map((doc) => ({
          id: doc._id,
          title: doc.name,
          expiresOn: doc.expiryDate,
          timeRemaining: calculateTimeRemaining(doc.expiryDate),
        }))
        .sort((a, b) => a.timeRemaining - b.timeRemaining);

      setSoonExpiringDocs(expiringDocs);

      // If no expiry dates found or it's been more than a day since last scan, trigger a scan
      const storedLastScan = localStorage.getItem("lastDocumentScan");
      if (
        docs.length > 0 &&
        (expiringDocs.length === 0 ||
          !storedLastScan ||
          new Date() - new Date(storedLastScan) > 24 * 60 * 60 * 1000)
      ) {
        scanDocuments();
      } else if (storedLastScan) {
        setLastScan(new Date(storedLastScan));
      }

      setFetchError(null);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading documents:", error);
      setFetchError(error.message || "Failed to load documents");

      // Set empty data
      setDocuments([]);
      setTotalDocs(0);
      setRecentDocs([]);
      setSoonExpiringDocs([]);

      setIsLoading(false);
    }
  }, [useMockData]);

  // Load documents when component mounts or when useMockData changes
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadDocuments();
    }
  }, [isLoaded, isSignedIn, loadDocuments, useMockData]);

  // Function to trigger document scanning
  const scanDocuments = async () => {
    if (isScanning) return;

    setIsScanning(true);
    setScanError(null);

    try {
      await scanDocumentsForExpiry();

      // Update last scan time
      const now = new Date();
      setLastScan(now);
      localStorage.setItem("lastDocumentScan", now.toISOString());

      // Reload documents to get updated expiry dates
      const docs = await fetchDocuments();

      // Update expiring docs
      const expiringDocs = docs
        .filter((doc) => doc.expiryDate)
        .filter((doc) => isExpiringSoon(doc.expiryDate))
        .map((doc) => ({
          id: doc._id,
          title: doc.name,
          expiresOn: doc.expiryDate,
          timeRemaining: calculateTimeRemaining(doc.expiryDate),
        }))
        // Sort by time remaining (ascending)
        .sort((a, b) => a.timeRemaining - b.timeRemaining);

      setSoonExpiringDocs(expiringDocs);
    } catch (error) {
      console.error("Error scanning documents:", error);
      setScanError(error.message || "Failed to scan documents");
    } finally {
      setIsScanning(false);
    }
  };

  // Format relative time (e.g., "2 days ago")
  function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) {
      return date.toLocaleDateString();
    } else if (diffDays > 0) {
      return diffDays === 1 ? "yesterday" : `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    } else if (diffMins > 0) {
      return diffMins === 1 ? "1 minute ago" : `${diffMins} minutes ago`;
    } else {
      return "just now";
    }
  }

  // Navigate to documents page
  const goToDocuments = () => {
    router.push("/documents");
  };

  // Return early with error display if document fetching fails
  if (fetchError && !isLoading) {
    return (
      <div className="min-h-screen h-screen w-full bg-[#f3f5ec] px-10 py-8">
        <h1 className="text-3xl font-bold text-[#181818] mb-2">
          Welcome back, {user?.firstName || "there"}!
        </h1>

        <div className="bg-red-50 border-l-4 border-red-500 p-6 my-8 rounded-lg shadow-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">
                Failed to load your documents
              </h3>
              <div className="mt-2 text-red-700">
                <p>{fetchError}</p>
                {apiHealth && !apiHealth.ok && (
                  <p className="mt-2 text-sm">
                    API Status: {apiHealth.message}
                  </p>
                )}
                {apiHealth && apiHealth.mongodb === false && (
                  <p className="mt-2 text-sm">
                    MongoDB connection failed. Please check your database
                    configuration.
                  </p>
                )}
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => setUseMockData(true)}
                  className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                >
                  Use Demo Data
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#fdfdfd] border-l-4 border-[#C5C69A] px-6 py-4 mt-10 rounded-xl shadow text-sm text-gray-700">
          <p>
            <strong>Troubleshooting tips:</strong>
          </p>
          <ul className="mt-2 list-disc list-inside">
            <li>Check your internet connection</li>
            <li>Make sure MongoDB connection is properly configured</li>
            <li>Verify that you have access to the documents</li>
            <li>
              Check if the MONGODB_URI environment variable is set correctly
            </li>
            <li>Try using demo data to test the UI functionality</li>
          </ul>
        </div>
      </div>
    );
  }

  // Get user's first name from their profile
  const userName = user?.firstName || user?.fullName?.split(" ")[0] || "there";

  return (
    <div className="h-[100%] w-full bg-[#f3f5ec] px-10 py-8 rounded-xl shadow-md overflow-hidden border border-[#cfd490]">
      <h1 className="text-3xl font-bold text-[#181818] mb-2">
        Welcome back, {userName}!
      </h1>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 mt-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={goToDocuments}
          className="bg-[#181818] text-white py-2 px-6 rounded-3xl flex flex-row gap-3 hover:cursor-pointer hover:bg-[#cfd490] hover:text-black transition-all duration-300"
        >
          <Plus /> New Document
        </motion.button>

        {/* Scan Documents Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={scanDocuments}
          disabled={isScanning}
          className="bg-[#181818] text-white py-2 px-6 rounded-3xl flex flex-row gap-3 disabled:opacity-50 hover:cursor-pointer hover:bg-[#cfd490] hover:text-black transition-all duration-300"
        >
          {isScanning ? "Scanning..." : "Scan Documents"}
        </motion.button>
      </div>

      <p className="text-gray-700 text-sm mb-8">
        Here's a quick overview of your workspace:
        {lastScan && (
          <span className="ml-2 text-xs text-gray-500">
            Last scan: {formatRelativeTime(lastScan)}
          </span>
        )}
      </p>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-transparent shadow rounded-3xl p-5 border-2 border-[#cfd490] px-4 py-4"
        >
          <div className="flex flex-row gap-2 ">
            <ChartColumn />
            <h2 className="font-semibold text-lg mb-2"> Your Stats</h2>
          </div>

          <ul className="text-sm text-gray-800 space-y-1">
            <li>
              Total Documents: <strong>{totalDocs}</strong>
            </li>
            <li>
              Pending Signatures: <strong>{pending}</strong>
            </li>
            <li>
              Documents Expiring Soon:{" "}
              <strong>{soonExpiringDocs.length}</strong>
            </li>
          </ul>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-transparent shadow rounded-3xl p-5 md:col-span-2 border-2 border-[#cfd490] px-4 py-4"
        >
          <div className="flex flex-row gap-2">
            <History />
            <h2 className="font-semibold text-lg mb-2">Recent Activity</h2>
          </div>
          {isLoading ? (
            <p className="text-gray-500 italic">Loading recent documents...</p>
          ) : recentDocs.length > 0 ? (
            <ul className="text-sm text-gray-800 space-y-2">
              {recentDocs.map((doc, index) => (
                <li key={index} className="flex justify-between">
                  <span>{doc.name}</span>
                  <span className="text-gray-500 italic">{doc.date}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No recent activity found.</p>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="py-6 border-2 border-[#cfd490] px-4 shadow rounded-3xl"
      >
        <h2 className="text-2xl font-bold mb-8">Soon Expiring Documents</h2>

        {scanError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Error scanning documents: {scanError}
                </p>
                <p className="mt-2 text-xs text-red-600">
                  Please check if the API key is properly configured.
                </p>
                <div className="mt-3">
                  <button
                    onClick={setDummyExpiryDates}
                    disabled={isScanning}
                    className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded hover:bg-red-200 transition disabled:opacity-50"
                  >
                    {isScanning ? "Setting..." : "Set Demo Expiry Dates"}
                  </button>
                  <span className="ml-2 text-xs text-red-600">
                    (For testing without Gemini API)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-gray-500 italic">Loading documents...</p>
        ) : isScanning ? (
          <p className="text-gray-500 italic">
            Scanning documents for expiry dates...
          </p>
        ) : soonExpiringDocs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {soonExpiringDocs.map((doc, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-[#fefefe] border-l-4 border-red-500 shadow p-4 py-6 rounded-lg hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold">{doc.title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Expires on:{" "}
                  <span className="font-medium">
                    {new Date(doc.expiresOn).toLocaleDateString()}
                  </span>
                </p>
                <p className="text-xs font-bold text-red-500">
                  {formatTimeRemaining(doc.expiresOn)}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 italic mb-4">
              No documents expiring soon.
            </p>
            <button
              onClick={scanDocuments}
              disabled={isScanning}
              className="px-4 py-2 bg-[#181818] text-white rounded-3xl text-sm hover:bg-black transition disabled:opacity-50"
            >
              {isScanning ? "Scanning..." : "Scan Documents Now"}
            </button>
          </div>
        )}
      </motion.div>

      {/* Tip / FAQ Box */}
      <div className="bg-[#fdfdfd] border-l-4 border-[#C5C69A] px-6 py-4 mt-10 rounded-xl shadow text-sm text-gray-700">
        💡 <strong>Tip:</strong> Use templates to save time. You can also create
        and save your own!
      </div>
    </div>
  );
}
