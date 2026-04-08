"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Calendar, Trash2, Pin } from "lucide-react";

interface Target {
  id: string;
  title: string;
  description?: string;
  type: "daily" | "weekly";
  progress: number; // 0-100
  goal: number;
  current: number;
  completed: boolean;
  pinned?: boolean;
  deadline?: string;
}

interface TargetCardProps {
  target: Target;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string, pinned: boolean) => void;
  compact?: boolean;
}

/**
 * TargetCard - Display and track daily/weekly targets
 * Shows progress, completion status, and allows marking complete
 */
const TargetCard = ({ target, onComplete, onDelete, onPin, compact = false }: TargetCardProps) => {
  const { id, title, description, type, progress, goal, current, completed, pinned, deadline } = target;

  const handleComplete = () => {
    if (onComplete && !completed) {
      onComplete(id);
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm(`Delete "${title}"?`)) {
      onDelete(id);
    }
  };

  const handlePin = () => {
    if (onPin) {
      onPin(id, !pinned);
    }
  };

  return (
    <Card 
      className={`
        ${compact ? 'p-4' : 'p-5'} 
        shadow-soft 
        hover:shadow-soft-lg 
        transition-all border
        ${completed ? 'bg-success/10 border-success/30' : 'bg-card border-border'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'} text-foreground`}>
              {title}
            </h3>
            <Badge 
              variant="outline" 
              className={`text-xs ${
                type === "daily" 
                  ? "border-primary text-primary" 
                  : "border-info text-info"
              }`}
            >
              {type}
            </Badge>
          </div>
          {description && !compact && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {completed ? (
            <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleComplete}
              className="flex-shrink-0 hover:bg-success/20 hover:text-success"
              aria-label="Mark as complete"
            >
              <Circle className="w-6 h-6 text-muted-foreground" />
            </Button>
          )}
          {onPin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePin}
              className={`flex-shrink-0 ${pinned ? 'bg-primary/20 hover:bg-primary/30' : 'hover:bg-muted'}`}
              aria-label={pinned ? "Remove from dashboard" : "Show on dashboard"}
              title={pinned ? "Remove from dashboard" : "Show on dashboard"}
            >
              <Pin className={`w-4 h-4 ${pinned ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="flex-shrink-0 hover:bg-panic/10 hover:text-panic"
              aria-label="Delete target"
            >
              <Trash2 className="w-4 h-4 text-panic" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {!completed && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{deadline}</span>
        </div>
      )}

      {/* Completed Badge */}
      {completed && (
        <div className="mt-2">
          <Badge className="bg-success text-background hover:bg-success/90">
            ✓ Completed
          </Badge>
        </div>
      )}
    </Card>
  );
};

export default TargetCard;

// Commit message: feat: create TargetCard component with progress tracking and completion
