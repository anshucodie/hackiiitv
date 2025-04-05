"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Template options for legal documents
const DOCUMENT_TEMPLATES = [
  {
    id: "nda",
    name: "Non-Disclosure Agreement",
    icon: "📝",
    description: "Protect your confidential information",
  },
  {
    id: "employment",
    name: "Employment Contract",
    icon: "👔",
    description: "Standard employment terms and conditions",
  },
  {
    id: "services",
    name: "Service Agreement",
    icon: "🔧",
    description: "Define scope of services and payment terms",
  },
  {
    id: "lease",
    name: "Lease Agreement",
    icon: "🏢",
    description: "Property rental terms and conditions",
  },
  {
    id: "partnership",
    name: "Partnership Agreement",
    icon: "🤝",
    description: "Terms for business partnerships",
  },
];

// Mock function to generate document content based on template
const getTemplateContent = (templateId) => {
  switch (templateId) {
    case "nda":
      return `
NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement (the "Agreement") is made and effective on [DATE],

BETWEEN: [PARTY A NAME], a company organized and existing under the laws of [JURISDICTION], with its head office located at [ADDRESS] ("Disclosing Party"),

AND: [PARTY B NAME], a company organized and existing under the laws of [JURISDICTION], with its head office located at [ADDRESS] ("Receiving Party").

1. PURPOSE
The Disclosing Party wishes to disclose certain confidential information to the Receiving Party for the purpose of [PURPOSE OF DISCLOSURE].

2. CONFIDENTIAL INFORMATION
"Confidential Information" means any information disclosed by the Disclosing Party to the Receiving Party, either directly or indirectly, in writing, orally or by inspection of tangible objects, including without limitation documents, business plans, source code, software, documentation, financial analysis, marketing plans, customer names, customer list, customer data.
      `;
    case "employment":
      return `
EMPLOYMENT AGREEMENT

This Employment Agreement (the "Agreement") is made and effective on [DATE],

BETWEEN: [EMPLOYER NAME], a company organized and existing under the laws of [JURISDICTION], with its head office located at [ADDRESS] ("Employer"),

AND: [EMPLOYEE NAME], an individual residing at [ADDRESS] ("Employee").

1. POSITION AND DUTIES
Employer hereby employs Employee as [POSITION] and Employee hereby accepts such employment, on the terms and conditions set forth herein. Employee shall perform duties as are customarily performed by one holding such position in similar businesses.

2. TERM
The term of this Agreement shall begin on [START DATE] and shall continue until terminated as provided herein.
      `;
    default:
      return "Select a template to view and edit content.";
  }
};

// Function to save document to MongoDB
async function saveDocumentToMongoDB(documentData) {
  try {
    console.log("Saving document data:", documentData);
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(documentData),
    });

    // Get the response body as text first for debugging
    const responseText = await response.text();
    console.log("Raw response:", responseText);

    // Parse the response text as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      throw new Error(`Server returned invalid JSON: ${responseText}`);
    }

    if (!response.ok) {
      const errorMessage = responseData?.message || "Failed to save document";
      console.error("Error response:", responseData);
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    console.error("Error saving document:", error);
    throw error;
  }
}

// Function to fetch documents from MongoDB
async function fetchDocuments() {
  try {
    const response = await fetch("/api/documents", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch documents");
    }

    const data = await response.json();
    return data.documents || [];
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
}

// Function to toggle favorite status
async function toggleFavorite(documentId, currentStatus) {
  try {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isFavorite: !currentStatus,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update favorite status");
    }

    const data = await response.json();
    return data.document;
  } catch (error) {
    console.error("Error toggling favorite status:", error);
    throw error;
  }
}

// Function to download document
async function downloadDocument(documentId, documentName) {
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

// Function to share document
async function shareDocument(documentId) {
  try {
    const response = await fetch("/api/documents/share", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentId,
        expiresIn: 7, // Expires in 7 days
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to share document");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sharing document:", error);
    throw error;
  }
}

// Function to delete document
async function deleteDocument(documentId) {
  try {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete document");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
}

export default function Documents() {
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [documentContent, setDocumentContent] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedDocumentForShare, setSelectedDocumentForShare] =
    useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Fetch documents on component mount
  useEffect(() => {
    const getDocuments = async () => {
      setIsLoading(true);
      try {
        const docs = await fetchDocuments();
        setDocuments(docs);
      } catch (error) {
        console.error("Error loading documents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getDocuments();
  }, []);

  // Handle template selection
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setDocumentContent(getTemplateContent(template.id));
    setDocumentName(`${template.name} - ${new Date().toLocaleDateString()}`);
    setIsEditing(true);
  };

  // Handle saving the document
  const handleSaveDocument = async () => {
    if (!documentContent || !documentName) return;

    setIsSaving(true);
    try {
      // In a real implementation, we would convert to PDF here
      // For now, we'll just save the text content
      const documentData = {
        name: documentName,
        content: documentContent,
        templateId: selectedTemplate.id,
        createdAt: new Date(),
        size: `${(documentContent.length / 1024).toFixed(2)} KB`, // Mock file size
        fileType: "pdf",
      };

      console.log("Attempting to save document:", documentData);
      const result = await saveDocumentToMongoDB(documentData);

      if (result.success) {
        console.log("Document saved successfully:", result.document);
        // Add the new document to the list
        setDocuments((prevDocs) => [result.document, ...prevDocs]);

        setShowModal(false);
        setIsEditing(false);
        setSelectedTemplate(null);
        setDocumentContent("");
        setDocumentName("");
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error in handleSaveDocument:", error);
      alert(
        `Failed to save document: ${error.message || "Unknown error occurred"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle document download
  const handleDownload = async (documentId, documentName) => {
    try {
      await downloadDocument(documentId, documentName);
    } catch (error) {
      alert(`Failed to download document: ${error.message}`);
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (documentId, currentStatus) => {
    try {
      const updatedDoc = await toggleFavorite(documentId, currentStatus);
      // Update document in list
      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc._id === documentId ? { ...doc, isFavorite: !currentStatus } : doc
        )
      );
    } catch (error) {
      alert(`Failed to update favorite status: ${error.message}`);
    }
  };

  // Handle share
  const handleShare = async (document) => {
    setSelectedDocumentForShare(document);
    setShareModalOpen(true);
    setShareUrl("");
  };

  // Generate share link
  const handleGenerateShareLink = async () => {
    if (!selectedDocumentForShare) return;

    setIsSharing(true);
    try {
      const result = await shareDocument(selectedDocumentForShare._id);
      setShareUrl(result.shareUrl);
    } catch (error) {
      alert(`Failed to share document: ${error.message}`);
    } finally {
      setIsSharing(false);
    }
  };

  // Copy share link to clipboard
  const handleCopyShareLink = () => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        alert("Share link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  };

  // Handle delete
  const handleDelete = async (document) => {
    setDocumentToDelete(document);
    setConfirmDeleteModalOpen(true);
  };

  // Confirm delete document
  const confirmDelete = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDocument(documentToDelete._id);
      // Remove document from list
      setDocuments((prevDocs) =>
        prevDocs.filter((doc) => doc._id !== documentToDelete._id)
      );
      setConfirmDeleteModalOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      alert(`Failed to delete document: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between">
        <h1 className="text-3xl text-black font-bold mb-4 ">
          Here are all your documents!
        </h1>
        <div
          className="text-3xl h-10 p-2 font-thin text-black flex items-center gap-2 border-1 rounded-[20px] border-black cursor-pointer hover:bg-gray-100"
          onClick={() => setShowModal(true)}
        >
          <img src="/plus3.svg" alt="plus" className="w-7 h-7 " />
          <span className="text-lg">Add Document</span>
        </div>
      </div>

      {/* Documents Table */}
      <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  File Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date Created
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Size
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Download
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Favorite
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Share
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Delete
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No documents found. Click "Add Document" to create your
                    first document.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {doc.name}
                          </div>
                          {doc.isShared && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              Shared
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(doc.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doc.size}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => handleDownload(doc._id, doc.name)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
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
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        className={
                          doc.isFavorite
                            ? "text-yellow-500 hover:text-yellow-700"
                            : "text-gray-400 hover:text-yellow-500"
                        }
                        onClick={() =>
                          handleToggleFavorite(doc._id, doc.isFavorite)
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill={doc.isFavorite ? "currentColor" : "none"}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => handleShare(doc)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                          />
                        </svg>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDelete(doc)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Template Selection Modal */}
      {showModal && !isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Select a Document Template</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {DOCUMENT_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">{template.icon}</div>
                    <div>
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <p className="text-sm text-gray-600">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Document Editing Modal */}
      {showModal && isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl h-5/6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold">Edit Document</h2>
                <p className="text-sm text-gray-600">
                  Template: {selectedTemplate?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to cancel? All changes will be lost."
                    )
                  ) {
                    setIsEditing(false);
                    setShowModal(false);
                  }
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label
                htmlFor="document-name"
                className="block text-sm font-medium text-gray-700"
              >
                Document Name
              </label>
              <input
                type="text"
                id="document-name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter document name"
              />
            </div>

            <div className="flex-grow overflow-hidden">
              <label
                htmlFor="document-content"
                className="block text-sm font-medium text-gray-700"
              >
                Document Content
              </label>
              <textarea
                id="document-content"
                value={documentContent}
                onChange={(e) => setDocumentContent(e.target.value)}
                className="mt-1 block w-full h-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm resize-none"
                placeholder="Edit document content here..."
              />
            </div>

            <div className="flex justify-end mt-4 space-x-3">
              <button
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to cancel? All changes will be lost."
                    )
                  ) {
                    setIsEditing(false);
                    setShowModal(false);
                  }
                }}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDocument}
                disabled={isSaving || !documentContent || !documentName}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  isSaving || !documentContent || !documentName
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                }`}
              >
                {isSaving ? "Saving..." : "Save as PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && selectedDocumentForShare && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Share Document</h2>
              <button
                onClick={() => {
                  setShareModalOpen(false);
                  setSelectedDocumentForShare(null);
                  setShareUrl("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600">
                Share "{selectedDocumentForShare.name}" with others. They will
                be able to view and download this document.
              </p>
            </div>

            {shareUrl ? (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Link (Valid for 7 days)
                </label>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-grow border border-gray-300 rounded-l-md shadow-sm py-2 px-3 bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopyShareLink}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleGenerateShareLink}
                  disabled={isSharing}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSharing ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    "Generate Share Link"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteModalOpen && documentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Delete Document
              </h2>
              <button
                onClick={() => {
                  setConfirmDeleteModalOpen(false);
                  setDocumentToDelete(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center bg-red-100 rounded-full w-16 h-16 mx-auto mb-4">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <p className="text-gray-700 text-center mb-2">
                Are you sure you want to delete this document?
              </p>
              <p className="text-gray-500 text-center text-sm">
                <span className="font-semibold">{documentToDelete.name}</span>
              </p>
              <p className="text-red-600 text-center text-xs mt-4">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {
                  setConfirmDeleteModalOpen(false);
                  setDocumentToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className={`px-4 py-2 border border-transparent rounded-md text-white ${
                  isDeleting
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                }`}
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Delete Document"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
