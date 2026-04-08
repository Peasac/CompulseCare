"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Flame, Calendar, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface MoodEntry {
  id: string;
  emoji: string;
  intensity: number; // 1-10
  note?: string;
  timestamp: string;
}

const MOOD_OPTIONS = [
  { emoji: "🌟", label: "Happy", color: "bg-success/10 hover:bg-success/20 border-success/30" },
  { emoji: "🫧", label: "Calm", color: "bg-info/10 hover:bg-info/20 border-info/30" },
  { emoji: "😶", label: "Neutral", color: "bg-section hover:bg-containerBg border-border" },
  { emoji: "😵‍💫", label: "Anxious", color: "bg-warning/10 hover:bg-warning/20 border-warning/30" },
  { emoji: "💔", label: "Sad", color: "bg-primary/10 hover:bg-primary/20 border-primary/30" },
  { emoji: "💢", label: "Frustrated", color: "bg-warning/10 hover:bg-warning/20 border-warning/30" },
  { emoji: "😮‍💨", label: "Stressed", color: "bg-panic/10 hover:bg-panic/20 border-panic/30" },
  { emoji: "🛌", label: "Tired", color: "bg-card hover:bg-section border-border" },
];

/**
 * MoodTrackerPage - Track mood with emoji + intensity slider
 * Mobile-first design with quick logging
 * Features: emoji selection, intensity slider, optional note, history
 */
const MoodTrackerPage = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState([5]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchMoodHistory();
    }
  }, [user]);

  const fetchMoodHistory = async () => {
    if (!user) return;

    setIsLoadingHistory(true);

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/mood?userId=${user.id}&limit=10`, { headers });
      if (response.ok) {
        const data = await response.json();
        setMoodHistory(data.entries || []);
      } else {
        throw new Error("Failed to fetch mood history");
      }
    } catch (error) {
      console.error("Failed to fetch mood history:", error);
      setMoodHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMood) {
      toast({
        title: "Mood required",
        description: "Please select a mood",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save moods",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/mood", {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId: user.id,
          emoji: selectedMood,
          intensity: intensity[0],
          note: note.trim() || undefined,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const newEntry = await response.json();

        // Reset form
        setSelectedMood(null);
        setIntensity([5]);
        setNote("");

        // Add to history
        setMoodHistory((prev) => [newEntry, ...prev]);

        toast({
          title: "Mood logged",
          description: "Your mood has been recorded",
        });
      } else {
        throw new Error("Failed to log mood");
      }
    } catch (error) {
      console.error("Mood submission error:", error);
      toast({
        title: "Failed to save",
        description: "Failed to log mood. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              aria-label="Go back"
              className="hover:bg-containerBg rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Mood Tracker</h1>
              <p className="text-sm text-muted-foreground">How are you feeling?</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-8">
        {/* SECTION 1: Mood Selection */}
        <Card className="p-6 shadow-soft bg-card border-border">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">Select your mood</h2>
            <p className="text-sm text-muted-foreground">Tap to select</p>
          </div>

          {/* Emoji Selection Grid */}
          <div className="grid grid-cols-4 gap-3">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood.emoji}
                onClick={() => setSelectedMood(mood.emoji)}
                className={`
                  ${mood.color} border
                  ${selectedMood === mood.emoji
                    ? "ring-2 ring-primary ring-offset-2 scale-105 shadow-md bg-card"
                    : "shadow-sm"}
                  rounded-2xl p-4 flex flex-col items-center gap-2 
                  transition-all duration-300 ease-out
                  hover:scale-105 hover:shadow-md
                  group
                `}
                aria-label={mood.label}
              >
                <span className={`text-3xl transition-transform duration-300 ${selectedMood === mood.emoji ? "animate-bounce" : "group-hover:scale-110"}`}>
                  {mood.emoji}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* SECTION 2: Intensity & Notes (appears after selection) */}
        {selectedMood && (
          <div className="animate-fade-in space-y-6">
            <Card className="p-6 shadow-soft bg-card border-border">
              <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
                <Flame className="w-4 h-4 text-warning" />
                Intensity Level
              </h3>

              {/* Intensity Slider */}
              <div className="mb-8 px-2">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-foreground">{intensity[0]}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Level</span>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {intensity[0] <= 3 ? "Mild" : intensity[0] <= 7 ? "Moderate" : "Intense"}
                  </div>
                </div>

                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  min={1}
                  max={10}
                  step={1}
                  className="py-4"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Optional Note */}
              <div>
                <label htmlFor="moodNote" className="block text-sm font-semibold text-foreground mb-3">
                  Check-in Note <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                </label>
                <Textarea
                  id="moodNote"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={200}
                  placeholder="What's going on right now? Triggers, thoughts, or wins..."
                  className="resize-none h-24 bg-section border-border focus:bg-card transition-colors"
                />
                <div className="flex justify-end mt-2">
                  <span className="text-xs text-muted-foreground">{note.length}/200</span>
                </div>
              </div>
            </Card>

            {/* SECTION 3: Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-background h-12 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Entry
                </>
              )}
            </Button>
          </div>
        )}

        {/* SECTION 4: Mood History */}
        <div className="pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recent History
            </h2>
            <Button variant="ghost" size="sm" className="text-xs text-info hover:bg-info/10">
              View All
            </Button>
          </div>

          {isLoadingHistory ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-info" />
            </div>
          ) : moodHistory.length === 0 ? (
            <div className="text-center py-12 bg-section rounded-xl border border-dashed border-border">
              <div className="text-4xl mb-3 grayscale opacity-50">📅</div>
              <p className="text-muted-foreground text-sm font-medium">No mood logs yet.</p>
              <p className="text-muted-foreground text-xs mt-1">Start tracking to see trends!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {moodHistory.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="relative pl-6 pb-6 last:pb-0 border-l border-border ml-3"
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-info border-2 border-background shadow-sm ring-1 ring-info/20 z-10"></div>

                  <Card className="p-4 shadow-sm hover:shadow-md transition-shadow bg-card border-border ml-2">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 bg-section rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-inner">
                        {entry.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Intensity {entry.intensity}/10
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Intensity Bar */}
                        <div className="h-1.5 w-full bg-section rounded-full mb-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${entry.intensity <= 3 ? 'bg-success' : entry.intensity <= 7 ? 'bg-warning' : 'bg-panic'
                              }`}
                            style={{ width: `${(entry.intensity / 10) * 100}%` }}
                          />
                        </div>

                        {entry.note && (
                          <p className="text-sm text-foreground leading-relaxed bg-containerBg p-2 rounded-lg border border-border/50">
                            "{entry.note}"
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MoodTrackerPage;
