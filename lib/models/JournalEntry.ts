/**
 * JournalEntry Model - Compulsion logging
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IJournalEntry extends Document {
  _id: Types.ObjectId;
  userId: string;
  compulsion: string;
  triggers: string[];
  timeSpent: number; // minutes
  anxietyLevel?: number; // 1-10
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    compulsion: {
      type: String,
      required: true,
      trim: true,
    },
    triggers: {
      type: [String],
      default: [],
    },
    timeSpent: {
      type: Number,
      required: true,
      min: 0,
    },
    anxietyLevel: {
      type: Number,
      min: 1,
      max: 10,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
JournalEntrySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.JournalEntry || mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);
