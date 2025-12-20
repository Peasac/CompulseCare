"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, List } from "lucide-react";

interface CompulsionLoggerProps {
  onLogSubmit?: (entry: CompulsionEntry) => void;
}

interface CompulsionEntry {
  activity: string;
  category: string;
  hours: number;
  minutes: number;
}

const CATEGORIES = ["Checking", "Cleaning", "Organizing", "Counting", "Other"];

export default function CompulsionLoggerWidget({ onLogSubmit }: CompulsionLoggerProps) {
  const router = useRouter();
  const [activity, setActivity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [anxietyLevel, setAnxietyLevel] = useState("5");
  const [todayTotal, setTodayTotal] = useState(0);
  const [saving, setSaving] = useState(false);

  // Fetch today's total time
  useEffect(() => {
    async function fetchTodayTotal() {
      try {
        const response = await fetch("/api/journal?userId=user123&limit=100");
        if (response.ok) {
          const data = await response.json();
          const today = new Date().toDateString();
          const todayEntries = data.entries.filter((e: any) => {
            return new Date(e.createdAt).toDateString() === today;
          });
          const total = todayEntries.reduce((sum: number, e: any) => sum + (e.timeSpent || 0), 0);
          setTodayTotal(total);
        }
      } catch (error) {
        console.error("Failed to fetch today's total:", error);
      }
    }

    fetchTodayTotal();
  }, []);

  const handleSubmit = async () => {
    if (!activity || !selectedCategory) return;

    setSaving(true);

    try {
      const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);

      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user123",
          compulsion: activity,
          triggers: [selectedCategory],
          timeSpent: totalMinutes,
          anxietyLevel: parseInt(anxietyLevel),
          notes: "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save entry");
      }

      // Update today's total
      setTodayTotal((prev) => prev + totalMinutes);

      // Notify parent if needed
      const entry: CompulsionEntry = {
        activity,
        category: selectedCategory,
        hours: parseInt(hours) || 0,
        minutes: parseInt(minutes) || 0,
      };
      onLogSubmit?.(entry);

      // Reset form
      setActivity("");
      setSelectedCategory(null);
      setHours("");
      setMinutes("");
      setAnxietyLevel("5");
    } catch (error) {
      console.error("Failed to save compulsion:", error);
      alert("Failed to save entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 bg-white shadow-soft border-gray-100 hover-lift">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-blue-400" />
          <h3 className="font-medium text-base text-gray-700">Quick Logger</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push("/logger")}
          className="text-gray-400 hover:text-gray-600 text-xs"
        >
          <List className="w-3.5 h-3.5 mr-1" />
          All logs
        </Button>
      </div>

      {/* Activity Input */}
      <div className="mb-5">
        <label className="text-xs font-medium text-gray-500 mb-2 block uppercase tracking-wide">
          What happened?
        </label>
        <Input
          placeholder="e.g., Checked door locks..."
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          className="text-sm bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-200 placeholder:text-gray-400 transition-calm"
        />
      </div>

      {/* Category Pills */}
      <div className="mb-5">
        <label className="text-xs font-medium text-gray-500 mb-2 block uppercase tracking-wide">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant="outline"
              className={`cursor-pointer transition-calm font-medium ${
                selectedCategory === cat
                  ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Time Spent */}
      <div className="mb-5">
        <label className="text-xs font-medium text-gray-500 mb-2 block uppercase tracking-wide">
          Time Spent
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder="0 hours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            min="0"
            className="text-sm bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-calm placeholder:text-gray-400"
          />
          <Input
            type="number"
            placeholder="0 minutes"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            min="0"
            max="59"
            className="text-sm bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-calm placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Log Button */}
      <Button
        onClick={handleSubmit}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white transition-calm disabled:opacity-50"
        disabled={!activity || !selectedCategory || saving}
      >
        {saving ? "Saving..." : "Save Entry"}
      </Button>

      {/* Today's Total */}
      <div className="mt-6 p-4 bg-blue-50/30 rounded-lg border border-blue-100">
        <p className="text-xs text-gray-500 text-center uppercase tracking-wide">Today's Total</p>
        <p className="text-2xl font-semibold text-center mt-1 text-gray-700">{todayTotal}m</p>
      </div>
    </Card>
  );
}      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <div className="mt-4 space-y-2">
          {recentEntries.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-calm"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{entry.activity}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                    {entry.category}
                  </Badge>
                  <span className="text-xs text-gray-400">{entry.timestamp}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">{entry.time}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500 transition-calm">
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
