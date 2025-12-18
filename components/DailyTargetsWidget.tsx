"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Target, CheckCircle2, Circle } from "lucide-react";

interface DailyTarget {
  id: string;
  title: string;
  type: "exposure" | "reduction" | "mindfulness";
  duration: string;
  completed: boolean;
}

export default function DailyTargetsWidget() {
  const [targets, setTargets] = useState<DailyTarget[]>([
    {
      id: "1",
      title: "Touch doorknob without washing hands",
      type: "exposure",
      duration: "10 min",
      completed: false,
    },
    {
      id: "2",
      title: "Limit checking to 2 times",
      type: "reduction",
      duration: "All day",
      completed: true,
    },
    {
      id: "3",
      title: "10-minute meditation",
      type: "mindfulness",
      duration: "10 min",
      completed: false,
    },
  ]);

  const handleToggle = (targetId: string) => {
    setTargets((prev) =>
      prev.map((t) => (t.id === targetId ? { ...t, completed: !t.completed } : t))
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "exposure":
        return "bg-panic/30 text-panic-foreground border-panic/50";
      case "reduction":
        return "bg-primary/10 text-primary border-primary/30";
      case "mindfulness":
        return "bg-success/20 text-success-foreground border-success/40";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <Card className="p-6 bg-card shadow-soft border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-base text-foreground">Daily Targets</h3>
        </div>
      </div>

      {/* Targets List - Max 3 */}
      <div className="space-y-3">
        {targets.slice(0, 3).map((target) => (
          <div
            key={target.id}
            className="p-3 rounded-md border border-border bg-card hover:bg-muted/30 transition-calm"
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => handleToggle(target.id)}
                className="mt-0.5 text-muted-foreground hover:text-foreground transition-calm"
              >
                {target.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    target.completed ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {target.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`text-xs font-normal ${getTypeColor(target.type)}`}
                  >
                    {target.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{target.duration}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Link */}
      <Link
        href="/targets"
        className="block mt-4 text-center text-sm text-muted-foreground hover:text-foreground transition-calm"
      >
        View all targets →
      </Link>
    </Card>
  );
}
