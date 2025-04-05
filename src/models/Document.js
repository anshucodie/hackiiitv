import { Schema, model, models } from "mongoose";

const DocumentSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  templateId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: String,
    required: false, // This will be populated with the user ID when available
  },
  size: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    default: "pdf",
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  // Expiry date field
  expiryDate: {
    type: Date,
    required: false,
  },
  // Sharing fields
  isShared: {
    type: Boolean,
    default: false,
  },
  shareToken: {
    type: String,
    index: true,
    sparse: true,
  },
  shareExpiry: {
    type: Date,
  },
  downloads: {
    type: Number,
    default: 0,
  },
  lastDownloaded: {
    type: Date,
  },
});

// Use existing model or create a new one
const Document = models.Document || model("Document", DocumentSchema);

export default Document;
