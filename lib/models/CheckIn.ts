/**
 * CheckIn Model - Self-reported symptom check-in questionnaire
 * Stores responses for longitudinal tracking without clinical labels
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICheckIn extends Document {
  _id: Types.ObjectId;
  userId: string;
  responses: {
    question: string;
    response: number; // Numeric score (e.g., 1-10)
    category: string; // e.g., 'anxiety', 'compulsion-urge', 'sleep', 'functioning'
  }[];
  totalScore: number; // Sum of all responses
  notes?: string; // Optional user notes
  createdAt: Date;
  updatedAt: Date;
}

const CheckInSchema = new Schema<ICheckIn>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    responses: [
      {
        question: {
          type: String,
          required: true,
        },
        response: {
          type: Number,
          required: true,
          min: 0,
          max: 10,
        },
        category: {
          type: String,
          required: true,
        },
      },
    ],
    totalScore: {
      type: Number,
      required: true,
      min: 0,
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
CheckInSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.CheckIn || mongoose.model<ICheckIn>('CheckIn', CheckInSchema);
