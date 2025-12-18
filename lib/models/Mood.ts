/**
 * Mood Model - Emotional state tracking
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IMood extends Document {
  _id: string;
  userId: string;
  mood: string; // emoji or text representation
  intensity: number; // 1-10
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MoodSchema = new Schema<IMood>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    mood: {
      type: String,
      required: true,
      trim: true,
    },
    intensity: {
      type: Number,
      required: true,
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
MoodSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Mood || mongoose.model<IMood>('Mood', MoodSchema);
