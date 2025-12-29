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
  { emoji: "🌟", label: "Happy", color: "bg-green-100/50 hover:bg-green-100 border-green-200" },
  { emoji: "🫧", label: "Calm", color: "bg-blue-100/50 hover:bg-blue-100 border-blue-200" },
  { emoji: "😶", label: "Neutral", color: "bg-gray-100/50 hover:bg-gray-100 border-gray-200" },
  { emoji: "😵‍💫", label: "Anxious", color: "bg-yellow-100/50 hover:bg-yellow-100 border-yellow-200" },
  { emoji: "💔", label: "Sad", color: "bg-purple-100/50 hover:bg-purple-100 border-purple-200" },
  { emoji: "💢", label: "Frustrated", color: "bg-orange-100/50 hover:bg-orange-100 border-orange-200" },
  { emoji: "😮‍💨", label: "Stressed", color: "bg-red-100/50 hover:bg-red-100 border-red-200" },
  { emoji: "🛌", label: "Tired", color: "bg-indigo-100/50 hover:bg-indigo-100 border-indigo-200" },
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
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Page Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              aria-label="Go back"
              className="hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Mood Tracker</h1>
              <p className="text-sm text-gray-500">How are you feeling?</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-8">
        {/* SECTION 1: Mood Selection */}
        <Card className="p-6 shadow-soft bg-white border-gray-100">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Select your mood</h2>
            <p className="text-sm text-gray-500">Tap to select</p>
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
                    ? "ring-2 ring-blue-400 ring-offset-2 scale-105 shadow-md bg-white"
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
                <span className="text-xs font-semibold text-gray-700">
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* SECTION 2: Intensity & Notes (appears after selection) */}
        {selectedMood && (
          <div className="animate-fade-in space-y-6">
            <Card className="p-6 shadow-soft bg-white border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Intensity Level
              </h3>

              {/* Intensity Slider */}
              <div className="mb-8 px-2">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-gray-800">{intensity[0]}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Level</span>
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
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
                <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium uppercase tracking-wide">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Optional Note */}
              <div>
                <label htmlFor="moodNote" className="block text-sm font-semibold text-gray-700 mb-3">
                  Check-in Note <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
                <Textarea
                  id="moodNote"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={200}
                  placeholder="What's going on right now? Triggers, thoughts, or wins..."
                  className="resize-none h-24 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
                <div className="flex justify-end mt-2">
                  <span className="text-xs text-gray-400">{note.length}/200</span>
                </div>
              </div>
            </Card>

            {/* SECTION 3: Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all duration-300"
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
        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              Recent History
            </h2>
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:bg-blue-50">
              View All
            </Button>
          </div>

          {isLoadingHistory ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : moodHistory.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <div className="text-4xl mb-3 grayscale opacity-50">📅</div>
              <p className="text-gray-500 text-sm font-medium">No mood logs yet.</p>
              <p className="text-gray-400 text-xs mt-1">Start tracking to see trends!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {moodHistory.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="relative pl-6 pb-6 last:pb-0 border-l border-gray-200 ml-3"
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-200 border-2 border-white shadow-sm ring-1 ring-blue-50 z-10"></div>

                  <Card className="p-4 shadow-sm hover:shadow-md transition-shadow bg-white border-gray-100 ml-2">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 bg-gray-50 rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-inner">
                        {entry.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Intensity {entry.intensity}/10
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Intensity Bar */}
                        <div className="h-1.5 w-full bg-gray-100 rounded-full mb-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${entry.intensity <= 3 ? 'bg-blue-400' : entry.intensity <= 7 ? 'bg-orange-400' : 'bg-red-400'
                              }`}
                            style={{ width: `${(entry.intensity / 10) * 100}%` }}
                          />
                        </div>

                        {entry.note && (
                          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/50 p-2 rounded-lg border border-gray-100/50">
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
