"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Target, Flame } from "lucide-react";

interface DailyTarget {
  id: string;
  title: string;
  type: "exposure" | "reduction" | "mindfulness";
  duration: string;
  streak: number;
  completed: boolean;
}

export default function DailyTargetsWidget() {
  const [targets, setTargets] = useState<DailyTarget[]>([
    {
      id: "1",
      title: "Touch doorknob without washing hands for 10 min",
      type: "exposure",
      duration: "3 days",
      streak: 0,
      completed: false,
    },
    {
      id: "2",
      title: "Limit checking to 2 times",
      type: "reduction",
      duration: "7 days",
      streak: 7,
      completed: true,
    },
    {
      id: "3",
      title: "10-minute meditation",
      type: "mindfulness",
      duration: "14 days",
      streak: 14,
      completed: false,
    },
  ]);

  const totalStreak = 7; // Mock overall streak

  const handleToggle = (targetId: string) => {
    setTargets((prev) =>
      prev.map((t) => (t.id === targetId ? { ...t, completed: !t.completed } : t))
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "exposure":
        return "bg-pink-100 text-pink-700";
      case "reduction":
        return "bg-blue-100 text-blue-700";
      case "mindfulness":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Card className="p-6 bg-white shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-lg text-gray-800">Daily Targets</h3>
        </div>
        <Button variant="ghost" size="icon">
          <span className="text-lg">📥</span>
        </Button>
      </div>

      {/* Targets List */}
      <div className="space-y-3 mb-6">
        {targets.map((target) => (
          <div
            key={target.id}
            className={`p-4 rounded-lg border transition-all ${
              target.completed
                ? "bg-blue-50 border-blue-200 opacity-75"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={target.completed}
                onCheckedChange={() => handleToggle(target.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    target.completed ? "line-through text-gray-500" : "text-gray-900"
                  }`}
                >
                  {target.title}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getTypeColor(target.type)}`}
                  >
                    {target.type}
                  </Badge>
                  {target.streak > 0 && (
                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                      <Flame className="w-3 h-3 mr-1" />
                      {target.streak} days
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500">⏱️ {target.duration}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Streak Badge */}
      <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-center">
          <p className="text-sm font-medium text-gray-700">🎉 7-day streak! Keep going!</p>
        </div>
      </div>
    </Card>
  );
}

// Import Button if not already imported
import { Button } from "@/components/ui/button";
