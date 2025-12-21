/**
 * PanicEvent Model - Panic button usage tracking
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPanicEvent extends Document {
  _id: Types.ObjectId;
  userId: string;
  duration: number; // seconds spent in breathing exercise
  completed: boolean; // whether user completed the breathing
  reflection?: string; // optional user reflection
  reflectionResponse?: string; // AI-generated reflection response
  createdAt: Date;
  updatedAt: Date;
}

const PanicEventSchema = new Schema<IPanicEvent>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    reflection: {
      type: String,
      trim: true,
    },
    reflectionResponse: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
PanicEventSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.PanicEvent || mongoose.model<IPanicEvent>('PanicEvent', PanicEventSchema);
