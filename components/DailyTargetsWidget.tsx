"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface DailyTarget {
  _id: string;
  title: string;
  type: "daily" | "weekly" | "exposure" | "reduction" | "mindfulness";
  description: string;
  completed: boolean;
  pinned?: boolean;
}

export default function DailyTargetsWidget() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<DailyTarget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchTargets() {
      try {
        const token = localStorage.getItem("token");
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/targets?userId=${user.id}`, { headers });
        if (response.ok) {
          const data = await response.json();
          const allTargets = data.targets || [];
          console.log(`[DailyTargetsWidget] Total targets:`, allTargets.length);
          console.log(`[DailyTargetsWidget] Daily pinned:`, allTargets.filter((t: any) => t.type === "daily" && t.pinned).length);
          setTargets(allTargets);
        }
      } catch (error) {
        console.error("Failed to fetch targets:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTargets();
  }, [user]);

  const handleToggle = async (targetId: string) => {
    const target = targets.find((t) => t._id === targetId);
    if (!target || !user) return;

    const newCompletedState = !target.completed;

    // Optimistically update UI
    setTargets((prev) =>
      prev.map((t) => (t._id === targetId ? { ...t, completed: newCompletedState } : t))
    );

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/targets/${targetId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          completed: newCompletedState,
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

  const dailyTargets = targets.filter(t => t.type === "daily" && t.pinned).slice(0, 3);
  const progress = dailyTargets.length > 0
    ? Math.round((dailyTargets.filter(t => t.completed).length / dailyTargets.length) * 100)
    : 0;

  return (
    <Card className="p-6 bg-white shadow-soft border-gray-100 transition-all duration-300 hover:shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-base text-gray-800">Daily Targets</h3>
        </div>
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
          {dailyTargets.filter(t => t.completed).length}/{dailyTargets.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-gray-100 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {loading ? (
        <div className="space-y-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : dailyTargets.length === 0 ? (
        <div className="text-center py-8 text-gray-400 flex-1 flex flex-col items-center justify-center">
          <p className="text-sm">No targets set yet</p>
          <Link href="/targets" className="text-xs text-blue-500 hover:text-blue-600 hover:underline mt-2 font-medium">
            Create your first target
          </Link>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Targets List - Max 3 daily */}
          <div className="space-y-3 flex-1">
            {dailyTargets.map((target) => (
              <div
                key={target._id}
                onClick={() => handleToggle(target._id)}
                className={`group cursor-pointer p-3 rounded-xl border transition-all duration-300 ${target.completed
                    ? "bg-gray-50/50 border-transparent opacity-60 hover:opacity-100"
                    : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 transition-colors duration-300 ${target.completed ? "text-green-500" : "text-gray-300 group-hover:text-blue-400"}`}>
                    {target.completed ? (
                      <CheckCircle2 className="w-5 h-5 fill-green-50" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium transition-all duration-300 ${target.completed
                          ? "line-through text-gray-400"
                          : "text-gray-700"
                        }`}
                    >
                      {target.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 border-0 ${target.completed ? 'bg-gray-100 text-gray-400 shadow-none' : getTypeColor(target.type)
                          }`}
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
            className="block mt-4 text-center text-xs font-semibold text-gray-400 hover:text-blue-500 transition-colors uppercase tracking-wide"
          >
            Manage Targets →
          </Link>
        </div>
      )}
    </Card>
  );
}
