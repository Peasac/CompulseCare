"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Circle, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface WeeklyTarget {
  _id: string;
  title: string;
  type: "daily" | "weekly" | "exposure" | "reduction" | "mindfulness";
  description: string;
  completed: boolean;
  pinned?: boolean;
}

export default function WeeklyTargetsWidget() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<WeeklyTarget[]>([]);
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
          // Only show pinned weekly targets
          const weeklyTargets = (data.targets || [])
            .filter((t: WeeklyTarget) => t.type === "weekly" && t.pinned)
            .slice(0, 3);
          setTargets(weeklyTargets);
        }
      } catch (error) {
        console.error("Failed to fetch weekly targets:", error);
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
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "reduction":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "mindfulness":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "weekly":
        return "bg-purple-100 text-purple-700 border-purple-300";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const weeklyTargets = targets.filter(t => t.type === "weekly" && t.pinned).slice(0, 3);
  const progress = weeklyTargets.length > 0
    ? Math.round((weeklyTargets.filter(t => t.completed).length / weeklyTargets.length) * 100)
    : 0;

  return (
    <Card className="p-6 bg-white shadow-soft border-gray-100 transition-all duration-300 hover:shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-base text-gray-800">Weekly Targets</h3>
        </div>
        <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
          {weeklyTargets.filter(t => t.completed).length}/{weeklyTargets.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-gray-100 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {loading ? (
        <div className="space-y-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : weeklyTargets.length === 0 ? (
        <div className="text-center py-8 text-gray-400 flex-1 flex flex-col items-center justify-center">
          <p className="text-sm">No weekly targets</p>
          <Link href="/targets" className="text-xs text-purple-500 hover:text-purple-600 hover:underline mt-2 font-medium">
            Set goals for the week
          </Link>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Targets List - Max 3 weekly */}
          <div className="space-y-3 flex-1">
            {weeklyTargets.map((target) => (
              <div
                key={target._id}
                onClick={() => handleToggle(target._id)}
                className={`group cursor-pointer p-3 rounded-xl border transition-all duration-300 ${target.completed
                    ? "bg-gray-50/50 border-transparent opacity-60 hover:opacity-100"
                    : "bg-white border-gray-100 hover:border-purple-200 hover:shadow-sm"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 transition-colors duration-300 ${target.completed ? "text-green-500" : "text-gray-300 group-hover:text-purple-400"}`}>
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
                        weekly
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
            className="block mt-4 text-center text-xs font-semibold text-gray-400 hover:text-purple-500 transition-colors uppercase tracking-wide"
          >
            Manage Targets →
          </Link>
        </div>
      )}
    </Card>
  );
}
