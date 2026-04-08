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
    <Card className="relative p-6 bg-card shadow-soft border-border hover-lift overflow-hidden group">
      {/* Calm Success Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 bg-card/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mb-3 animate-soft-pulse">
            <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-foreground font-medium text-lg">Logged.</p>
          <p className="text-muted-foreground text-sm">You showed up for yourself.</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-medium text-base text-foreground">Quick Logger</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/logger")}
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 text-xs rounded-full px-3 transition-colors"
        >
          <List className="w-3.5 h-3.5 mr-1" />
          History
        </Button>
      </div>

      {/* Activity Input */}
      <div className="mb-5">
        <label className="text-[10px] font-bold text-muted-foreground mb-2 block uppercase tracking-wider">
          What happened?
        </label>
        <Input
          autoFocus={true}
          placeholder="e.g., Checked door locks..."
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          className="text-sm bg-section border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/20 focus:bg-card placeholder:text-muted-foreground transition-all duration-300 rounded-xl"
        />
      </div>

      {/* Category Pills */}
      <div className="mb-5">
        <label className="text-[10px] font-bold text-muted-foreground mb-2 block uppercase tracking-wider">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant="outline"
              className={`cursor-pointer transition-all duration-300 px-3 py-1.5 rounded-full font-medium ${selectedCategory === cat
                  ? "bg-primary border-primary text-background shadow-md transform scale-105"
                  : "bg-card border-border text-muted-foreground hover:border-border hover:bg-muted"
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
        <label className="text-[10px] font-bold text-muted-foreground mb-2 block uppercase tracking-wider">
          Time Spent
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min="0"
              className="text-sm bg-section border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/20 focus:bg-card transition-all duration-300 rounded-xl pr-12"
            />
            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground pointer-events-none">hrs</span>
          </div>
          <div className="relative">
            <Input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              min="0"
              max="59"
              className="text-sm bg-section border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/20 focus:bg-card transition-all duration-300 rounded-xl pr-12"
            />
            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground pointer-events-none">min</span>
          </div>
        </div>
      </div>

      {/* Log Button */}
      <Button
        onClick={handleSubmit}
        className={`w-full h-11 transition-all duration-300 rounded-xl font-medium ${!activity || !selectedCategory || saving
            ? "bg-muted text-muted-foreground"
            : "bg-primary hover:bg-primary/90 text-background shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          }`}
        disabled={!activity || !selectedCategory || saving}
      >
        {saving ? "Saving..." : "Log Entry"}
      </Button>

      {/* Today's Total */}
      <div className="mt-6 p-4 bg-section rounded-xl border border-border flex items-center justify-between group-hover:bg-primary/10 transition-colors duration-500">
        <p className="text-xs text-muted-foreground font-medium">Daily Total</p>
        <p className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{todayTotal}<span className="text-sm font-normal text-muted-foreground ml-1">min</span></p>
      </div>

      {/* Recent Entries - Today only */}
      {recentEntries.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recent Today</p>
          {recentEntries.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-xs font-semibold text-foreground truncate">{entry.compulsion}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span className="text-[10px] text-muted-foreground">
                    {entry.triggers?.[0] || 'Other'}
                  </span>
                </div>
              </div>
              <span className="px-2 py-1 bg-muted rounded-lg text-xs font-semibold text-muted-foreground border border-border">
                {entry.timeSpent}m
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
