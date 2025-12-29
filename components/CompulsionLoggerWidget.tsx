"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, List } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const [activity, setActivity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [anxietyLevel, setAnxietyLevel] = useState("5");
  const [todayTotal, setTodayTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch today's total time and recent entries
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    if (!user) return;
    try {
      const response = await fetch(`/api/journal?userId=${user.id}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        const today = new Date().toDateString();
        const todayEntries = data.entries.filter((e: any) => {
          return new Date(e.createdAt).toDateString() === today;
        });
        const total = todayEntries.reduce((sum: number, e: any) => sum + (e.timeSpent || 0), 0);
        setTodayTotal(total);
        setRecentEntries(todayEntries.slice(0, 3)); // Show last 3 today's entries
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }

  const handleSubmit = async () => {
    if (!activity || !selectedCategory) return;
    setSaving(true);

    try {
      const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);

      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
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

      const savedEntry = await response.json();
      const newEntry = savedEntry.entry;

      setTodayTotal((prev) => prev + totalMinutes);

      setRecentEntries((prev) => {
        const updated = [newEntry, ...prev];
        return updated.slice(0, 3);
      });

      // Notify parent if needed
      const entry: CompulsionEntry = {
        activity,
        category: selectedCategory,
        hours: parseInt(hours) || 0,
        minutes: parseInt(minutes) || 0,
      };
      onLogSubmit?.(entry);

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reset form
      setActivity("");
      setSelectedCategory(null);
      setHours("");
      setMinutes("");
      setAnxietyLevel("5");
    } catch (error) {
      console.error('Error:', error);
      alert("Failed to save entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="relative p-6 bg-white shadow-soft border-gray-100 hover-lift overflow-hidden group">
      {/* Calm Success Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3 animate-soft-pulse">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-800 font-medium text-lg">Logged.</p>
          <p className="text-gray-500 text-sm">You showed up for yourself.</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-full">
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="font-medium text-base text-gray-700">Quick Logger</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/logger")}
          className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 text-xs rounded-full px-3 transition-colors"
        >
          <List className="w-3.5 h-3.5 mr-1" />
          History
        </Button>
      </div>

      {/* Activity Input */}
      <div className="mb-5">
        <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-wider">
          What happened?
        </label>
        <Input
          autoFocus={true}
          placeholder="e.g., Checked door locks..."
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          className="text-sm bg-gray-50/50 border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 focus:bg-white placeholder:text-gray-400 transition-all duration-300 rounded-xl"
        />
      </div>

      {/* Category Pills */}
      <div className="mb-5">
        <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-wider">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant="outline"
              className={`cursor-pointer transition-all duration-300 px-3 py-1.5 rounded-full font-medium ${selectedCategory === cat
                  ? "bg-blue-500 border-blue-500 text-white shadow-md transform scale-105"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Time Spent */}
      <div className="mb-6">
        <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-wider">
          Time Spent
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min="0"
              className="text-sm bg-gray-50/50 border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all duration-300 rounded-xl pr-12"
            />
            <span className="absolute right-3 top-2.5 text-xs text-gray-400 pointer-events-none">hrs</span>
          </div>
          <div className="relative">
            <Input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              min="0"
              max="59"
              className="text-sm bg-gray-50/50 border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all duration-300 rounded-xl pr-12"
            />
            <span className="absolute right-3 top-2.5 text-xs text-gray-400 pointer-events-none">min</span>
          </div>
        </div>
      </div>

      {/* Log Button */}
      <Button
        onClick={handleSubmit}
        className={`w-full h-11 transition-all duration-300 rounded-xl font-medium ${!activity || !selectedCategory || saving
            ? "bg-gray-100 text-gray-400"
            : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          }`}
        disabled={!activity || !selectedCategory || saving}
      >
        {saving ? "Saving..." : "Log Entry"}
      </Button>

      {/* Today's Total */}
      <div className="mt-6 p-4 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center justify-between group-hover:bg-blue-50/30 transition-colors duration-500">
        <p className="text-xs text-gray-500 font-medium">Daily Total</p>
        <p className="text-xl font-bold text-gray-700 group-hover:text-blue-700 transition-colors">{todayTotal}<span className="text-sm font-normal text-gray-400 ml-1">min</span></p>
      </div>

      {/* Recent Entries - Today only */}
      {recentEntries.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recent Today</p>
          {recentEntries.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-100 transition-colors"
            >
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-xs font-semibold text-gray-700 truncate">{entry.compulsion}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  <span className="text-[10px] text-gray-500">
                    {entry.triggers?.[0] || 'Other'}
                  </span>
                </div>
              </div>
              <span className="px-2 py-1 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 border border-gray-100">
                {entry.timeSpent}m
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
