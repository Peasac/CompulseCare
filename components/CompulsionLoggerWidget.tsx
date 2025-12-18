"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, List, TrendingUp } from "lucide-react";

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
  const [todayTotal, setTodayTotal] = useState(15); // Mock data
  const [recentEntries, setRecentEntries] = useState([
    { activity: "Checked door locks", category: "Checking", time: "15m", timestamp: "Today" },
  ]);

  const handleSubmit = () => {
    if (!activity || !selectedCategory) return;

    const entry: CompulsionEntry = {
      activity,
      category: selectedCategory,
      hours: parseInt(hours) || 0,
      minutes: parseInt(minutes) || 0,
    };

    // TODO: Call API to save entry
    console.log("Logging compulsion:", entry);
    onLogSubmit?.(entry);

    // Reset form
    setActivity("");
    setSelectedCategory(null);
    setHours("");
    setMinutes("");
  };

  return (
    <Card className="p-6 bg-white shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-lg text-gray-800">Compulsion Logger</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push("/logger")}
            className="text-blue-600 hover:text-blue-700"
          >
            <List className="w-4 h-4 mr-1" />
            View All
          </Button>
        </div>
      </div>

      {/* Activity Input */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Activity/Compulsion
        </label>
        <Input
          placeholder="e.g., Checked door locks, Washed hands..."
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          className="text-sm bg-gray-100 border-gray-200 placeholder:text-gray-400"
        />
      </div>

      {/* Category Pills */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant="outline"
              className={`cursor-pointer transition-colors border-gray-300 text-gray-700 ${
                selectedCategory === cat
                  ? "bg-gray-100 hover:bg-gray-200"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Time Spent */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Time Spent
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Hours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            min="0"
            className="text-sm bg-gray-100 border-gray-200"
          />
          <Input
            type="number"
            placeholder="Minutes"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            min="0"
            max="59"
            className="text-sm bg-gray-100 border-gray-200"
          />
        </div>
      </div>

      {/* Log Button */}
      <Button
        onClick={handleSubmit}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        disabled={!activity || !selectedCategory}
      >
        Log Compulsion
      </Button>

      {/* Today's Total */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 text-center">Today's Total Time</p>
        <p className="text-3xl font-bold text-center mt-1 text-gray-800">{todayTotal}m</p>
      </div>

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <div className="mt-4 space-y-2">
          {recentEntries.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{entry.activity}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                    {entry.category}
                  </Badge>
                  <span className="text-xs text-gray-500">{entry.timestamp}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">{entry.time}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
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
