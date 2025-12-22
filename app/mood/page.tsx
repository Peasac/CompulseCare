"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/Navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
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
  { emoji: "😊", label: "Happy", color: "bg-green-100 hover:bg-green-200" },
  { emoji: "😌", label: "Calm", color: "bg-blue-100 hover:bg-blue-200" },
  { emoji: "😐", label: "Neutral", color: "bg-gray-100 hover:bg-gray-200" },
  { emoji: "😟", label: "Anxious", color: "bg-yellow-100 hover:bg-yellow-200" },
  { emoji: "😢", label: "Sad", color: "bg-purple-100 hover:bg-purple-200" },
  { emoji: "😤", label: "Frustrated", color: "bg-orange-100 hover:bg-orange-200" },
  { emoji: "😰", label: "Stressed", color: "bg-red-100 hover:bg-red-200" },
  { emoji: "😴", label: "Tired", color: "bg-indigo-100 hover:bg-indigo-200" },
];

/**
 * MoodTrackerPage - Track mood with emoji + intensity slider
 * Mobile-first design with quick logging
 * Features: emoji selection, intensity slider, optional note, history
 */
const MoodTrackerPage = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
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
      alert("Please select a mood");
      return;
    }

    if (!user) {
      alert("Please log in to save moods");
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
        
        alert("Mood logged successfully!");
      } else {
        throw new Error("Failed to log mood");
      }
    } catch (error) {
      console.error("Mood submission error:", error);
      alert("Failed to log mood. Please try again.");
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
            >
              <ArrowLeft className="w-5 h-5" />
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
        <Card className="p-6 shadow-lg">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">How are you feeling?</h2>
            <p className="text-sm text-gray-500">Select the mood that best describes your current state</p>
          </div>

          {/* Emoji Selection Grid */}
          <div className="grid grid-cols-4 gap-3">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood.emoji}
                onClick={() => setSelectedMood(mood.emoji)}
                className={`
                  ${mood.color}
                  ${selectedMood === mood.emoji ? "ring-4 ring-[#2563EB] scale-105 shadow-lg" : "shadow-sm"}
                  rounded-xl p-4 flex flex-col items-center gap-2 
                  transition-all duration-200
                  hover:scale-105 hover:shadow-md
                `}
                aria-label={mood.label}
              >
                <span className="text-3xl">{mood.emoji}</span>
                <span className="text-xs font-medium text-gray-700">
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* SECTION 2: Intensity & Notes (appears after selection) */}
        {selectedMood && (
          <Card className="p-6 shadow-lg animate-fadeIn">
            <h3 className="text-base font-semibold text-gray-800 mb-5">Tell us more</h3>

            {/* Intensity Slider */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                How intense is this feeling?
              </label>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm text-gray-500 min-w-[3rem]">Low</span>
                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 min-w-[3rem] text-right">High</span>
              </div>
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <span className="text-4xl font-bold text-[#2563EB]">{intensity[0]}</span>
                <span className="text-gray-500 text-lg">/10</span>
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label htmlFor="moodNote" className="block text-sm font-medium text-gray-700 mb-2">
                Add a note (optional)
              </label>
              <Textarea
                id="moodNote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                placeholder="What's on your mind? What might have contributed to this mood?"
                className="resize-none h-24"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{note.length}/200</p>
            </div>
          </Card>
        )}

        {/* SECTION 3: Submit Button (prominent when ready) */}
        {selectedMood && (
          <div className="animate-fadeIn">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-14 text-base font-semibold shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Mood Entry
                </>
              )}
            </Button>
          </div>
        )}

        {/* SECTION 4: Mood History */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Entries
            </h2>
            <span className="text-xs text-gray-500">{moodHistory.length} total</span>
          </div>

          {isLoadingHistory ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
            </div>
          ) : moodHistory.length === 0 ? (
            <Card className="p-10 text-center bg-muted/20">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-gray-500 text-sm">No entries yet. Log your first mood above to start tracking!</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {moodHistory.map((entry) => (
                <Card key={entry.id} className="p-5 shadow-sm hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-[#2563EB]">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <span className="text-5xl">{entry.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-semibold text-gray-800">
                            {entry.intensity}/10
                          </span>
                          <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#2563EB] rounded-full transition-all"
                              style={{ width: `${(entry.intensity / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="text-sm text-gray-600 leading-relaxed">{entry.note}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MoodTrackerPage;

// Commit message: feat: create MoodTrackerPage with emoji selection and intensity slider
