"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Calendar } from "lucide-react";

interface Target {
  id: string;
  title: string;
  description?: string;
  type: "daily" | "weekly";
  progress: number; // 0-100
  goal: number;
  current: number;
  completed: boolean;
  deadline?: string;
}

interface TargetCardProps {
  target: Target;
  onComplete?: (id: string) => void;
  compact?: boolean;
}

/**
 * TargetCard - Display and track daily/weekly targets
 * Shows progress, completion status, and allows marking complete
 */
const TargetCard = ({ target, onComplete, compact = false }: TargetCardProps) => {
  const { id, title, description, type, progress, goal, current, completed, deadline } = target;

  const handleComplete = () => {
    if (onComplete && !completed) {
      onComplete(id);
    }
  };

  return (
    <Card 
      className={`
        ${compact ? 'p-4' : 'p-5'} 
        shadow-md 
        hover:shadow-lg 
        transition-all
        ${completed ? 'bg-green-50 border-green-200' : 'bg-white'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'} text-gray-800`}>
              {title}
            </h3>
            <Badge 
              variant="outline" 
              className={`text-xs ${
                type === "daily" 
                  ? "border-[#2563EB] text-[#2563EB]" 
                  : "border-[#06B6D4] text-[#06B6D4]"
              }`}
            >
              {type}
            </Badge>
          </div>
          {description && !compact && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
        
        {completed ? (
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleComplete}
            className="flex-shrink-0 hover:bg-green-100"
            aria-label="Mark as complete"
          >
            <Circle className="w-6 h-6 text-gray-400" />
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {!completed && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span className="font-medium">
              {current} / {goal}
            </span>
          </div>
          <Progress 
            value={progress} 
            className="h-2"
          />
        </div>
      )}

      {/* Deadline */}
      {deadline && !completed && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>{deadline}</span>
        </div>
      )}

      {/* Completed Badge */}
      {completed && (
        <div className="mt-2">
          <Badge className="bg-green-600 text-white hover:bg-green-700">
            ✓ Completed
          </Badge>
        </div>
      )}
    </Card>
  );
};

export default TargetCard;

// Commit message: feat: create TargetCard component with progress tracking and completion
