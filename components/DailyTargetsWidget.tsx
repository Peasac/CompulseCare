"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle2, Circle } from "lucide-react";

interface DailyTarget {
  _id: string;
  title: string;
  type: "daily" | "weekly" | "exposure" | "reduction" | "mindfulness";
  description: string;
  completed: boolean;
}

export default function DailyTargetsWidget() {
  const [targets, setTargets] = useState<DailyTarget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTargets() {
      try {
        const response = await fetch("/api/targets?userId=user123");
        if (response.ok) {
          const data = await response.json();
          setTargets(data.targets || []);
        }
      } catch (error) {
        console.error("Failed to fetch targets:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTargets();
  }, []);

  const handleToggle = async (targetId: string) => {
    const target = targets.find((t) => t._id === targetId);
    if (!target) return;

    // Optimistically update UI
    setTargets((prev) =>
      prev.map((t) => (t._id === targetId ? { ...t, completed: !t.completed } : t))
    );

    try {
      const response = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user123",
          title: target.title,
          description: target.description,
          type: target.type,
          completed: !target.completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update target");
      }
    } catch (error) {
      console.error("Failed to toggle target:", error);
      // Revert optimistic update on error
      setTargets((prev) =>
        prev.map((t) => (t._id === targetId ? { ...t, completed: target.completed } : t))
      );
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "exposure":
        return "bg-panic/30 text-panic-foreground border-panic/50";
      case "reduction":
        return "bg-primary/10 text-primary border-primary/30";
      case "mindfulness":
        return "bg-success/20 text-success-foreground border-success/40";
      case "daily":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "weekly":
        return "bg-purple-100 text-purple-700 border-purple-300";
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

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted/20 rounded-md animate-pulse" />
          ))}
        </div>
      ) : targets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No targets set yet</p>
          <Link href="/targets" className="text-xs text-primary hover:underline mt-2 block">
            Create your first target
          </Link>
        </div>
      ) : (
        <>
          {/* Targets List - Max 3 */}
          <div className="space-y-3">
            {targets.slice(0, 3).map((target) => (
              <div
                key={target._id}
                className="p-3 rounded-md border border-border bg-card hover:bg-muted/30 transition-calm"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(target._id)}
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
        </>
      )}
    </Card>
  );
}
