"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface JournalEntry {
  id: string;
  triggers: string[];
  note: string;
  timeSpent: number; // in minutes
  timestamp: string;
  mood?: string;
}

interface JournalCardProps {
  entry: JournalEntry;
  compact?: boolean;
}

/**
 * JournalCard - Display component for journal entries
 * Shows triggers, note, time spent, and timestamp
 * Mobile-optimized with optional compact mode
 */
const JournalCard = ({ entry, compact = false }: JournalCardProps) => {
  const { triggers, note, timeSpent, timestamp, mood } = entry;

  // Safely format timestamp - handle invalid dates
  const formatTimestamp = () => {
    if (!timestamp) return "Recently";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Recently";
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  return (
    <Card className={`${compact ? 'p-4' : 'p-5'} shadow-soft hover:shadow-soft-lg transition-calm bg-white border-gray-100`}>
      {/* Header with timestamp */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{formatTimestamp()}</span>
        </div>
        {mood && (
          <span className="text-xl" aria-label={`Mood: ${mood}`}>
            {mood}
          </span>
        )}
      </div>

      {/* Trigger pills */}
      {triggers && triggers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {triggers.map((trigger, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20"
            >
              {trigger}
            </Badge>
          ))}
        </div>
      )}

      {/* Note text */}
      {note && (
        <p className={`text-gray-700 ${compact ? 'text-sm' : 'text-base'} leading-relaxed mb-3`}>
          {note}
        </p>
      )}

      {/* Time spent */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Clock className="w-4 h-4" />
        <span>{timeSpent} minute{timeSpent !== 1 ? 's' : ''} spent</span>
      </div>
    </Card>
  );
};

export default JournalCard;

// Commit message: feat: create JournalCard component for displaying micro-journal entries
