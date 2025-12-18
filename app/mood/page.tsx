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
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState([5]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    fetchMoodHistory();
  }, []);

  const fetchMoodHistory = async () => {
    setIsLoadingHistory(true);
    
    try {
      // TODO: Fetch from API
      // const response = await fetch("/api/mood?userId=user123&limit=10");
      // const data = await response.json();
      // setMoodHistory(data.entries);

      // MOCK DATA
      const mockHistory: MoodEntry[] = [
        {
          id: "m1",
          emoji: "😌",
          intensity: 7,
          note: "Finished a breathing exercise, feeling better",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "m2",
          emoji: "😟",
          intensity: 4,
          note: "Morning anxiety about work",
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "m3",
          emoji: "😊",
          intensity: 8,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setMoodHistory(mockHistory);
    } catch (error) {
      console.error("Failed to fetch mood history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMood) {
      alert("Please select a mood");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user123", // TODO: Get from auth context
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

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Mood Logger */}
        <Card className="p-6 mb-8 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Log Your Mood
          </h2>

          {/* Emoji Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select your mood <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.emoji}
                  onClick={() => setSelectedMood(mood.emoji)}
                  className={`
                    ${mood.color}
                    ${selectedMood === mood.emoji ? "ring-4 ring-[#2563EB] scale-105" : ""}
                    rounded-xl p-4 flex flex-col items-center gap-2 
                    transition-all cursor-pointer
                    hover:scale-105
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
          </div>

          {/* Intensity Slider */}
          {selectedMood && (
            <div className="mb-6 animate-fadeIn">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Intensity
              </label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 min-w-[3rem]">Low</span>
                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 min-w-[3rem] text-right">High</span>
              </div>
              <div className="text-center mt-2">
                <span className="text-4xl font-bold text-[#2563EB]">{intensity[0]}</span>
                <span className="text-gray-500 text-sm">/10</span>
              </div>
            </div>
          )}

          {/* Optional Note */}
          {selectedMood && (
            <div className="mb-6 animate-fadeIn">
              <label htmlFor="moodNote" className="block text-sm font-medium text-gray-700 mb-2">
                Add a note (optional)
              </label>
              <Textarea
                id="moodNote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                placeholder="What's on your mind?"
                className="resize-none h-20"
              />
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedMood}
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-12 text-base font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Log Mood
              </>
            )}
          </Button>
        </Card>

        {/* Mood History */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Moods
          </h2>

          {isLoadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
            </div>
          ) : moodHistory.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No mood entries yet. Log your first mood above!</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {moodHistory.map((entry) => (
                <Card key={entry.id} className="p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{entry.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800">
                          Intensity: {entry.intensity}/10
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="text-sm text-gray-600">{entry.note}</p>
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
