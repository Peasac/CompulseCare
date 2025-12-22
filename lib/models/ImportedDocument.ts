/**
 * ImportedDocument Model - OCR-extracted documents
 * Stores uploaded documents, OCR text, and optional summaries
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IImportedDocument extends Document {
  _id: Types.ObjectId;
  userId: string;
  fileName: string;
  fileType: string; // 'pdf' | 'image'
  ocrText: string; // Extracted text from OCR
  summary?: string; // Optional LLM-generated summary for readability
  uploadDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ImportedDocumentSchema = new Schema<IImportedDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: ['pdf', 'image'],
    },
    ocrText: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
ImportedDocumentSchema.index({ userId: 1, uploadDate: -1 });

export default mongoose.models.ImportedDocument || mongoose.model<IImportedDocument>('ImportedDocument', ImportedDocumentSchema);
