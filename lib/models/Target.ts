/**
 * Target Model - Daily and weekly goals
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ITarget extends Document {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly';
  targetType: 'exposure' | 'reduction' | 'mindfulness';
  goal: number; // target count or duration
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TargetSchema = new Schema<ITarget>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['daily', 'weekly'],
      default: 'daily',
    },
    targetType: {
      type: String,
      required: true,
      enum: ['exposure', 'reduction', 'mindfulness'],
      default: 'reduction',
    },
    goal: {
      type: Number,
      required: true,
      min: 1,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
TargetSchema.index({ userId: 1, type: 1, createdAt: -1 });

export default mongoose.models.Target || mongoose.model<ITarget>('Target', TargetSchema);
