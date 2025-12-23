"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import JournalCard from "@/components/JournalCard";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

interface JournalEntry {
  id: string;
  triggers: string[];
  note: string;
  timeSpent: number;
  timestamp: string;
  mood?: string;
}

const TRIGGER_OPTIONS = [
  "Checking",
  "Counting",
  "Cleaning",
  "Arranging",
  "Reassurance seeking",
  "Intrusive thoughts",
  "Avoidance",
  "Mental rituals",
  "Other",
];

/**
 * JournalPage - Micro-journaling for compulsions and triggers
 * Mobile-first design with 1-3 tap interactions
 * Features: trigger pills, 140-char note, time spent tracking
 */
const JournalPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPanic = searchParams.get("from") === "panic";
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [timeSpent, setTimeSpent] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const charLimit = 140;

  // Pre-select triggers if coming from panic mode
  useEffect(() => {
    if (fromPanic) {
      setSelectedTriggers(["Intrusive thoughts"]);
      setNote("Experienced panic moment");
    }
  }, [fromPanic]);

  // Fetch recent journal entries
  useEffect(() => {
    fetchRecentEntries();
  }, []);

  const fetchRecentEntries = async () => {
    try {
      const response = await fetch(`/api/journal?userId=${user.id}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setRecentEntries(data.entries || []);
      }
    } catch (error) {
      console.error("Failed to load journal entries:", error);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger)
        ? prev.filter((t) => t !== trigger)
        : [...prev, trigger]
    );
  };

  const handleSubmit = async () => {
    if (selectedTriggers.length === 0) {
      toast({
        title: "Trigger required",
        description: "Please select at least one trigger",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id, // TODO: Get from auth context
          triggers: selectedTriggers,
          note: note.trim(),
          timeSpent,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const newEntry = await response.json();
        
        // Reset form
        setSelectedTriggers([]);
        setNote("");
        setTimeSpent(5);
        
        // Add new entry to recent list
        setRecentEntries((prev) => [newEntry, ...prev]);
        
        // Success feedback
        toast({
          title: "Entry saved",
          description: "Your journal entry has been recorded",
        });
      } else {
        throw new Error("Failed to save entry");
      }
    } catch (error) {
      console.error("Journal submission error:", error);
      toast({
        title: "Save failed",
        description: "Failed to save entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxNoteLength = 140;

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
              <h1 className="text-xl font-bold text-gray-800">Compulsion Journal</h1>
              <p className="text-sm text-gray-500">Quick micro-journaling (max {charLimit} chars)</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Journal Entry Form */}
        <Card className="p-6 mb-8 shadow-soft bg-white border-gray-100 hover-lift">
          <h2 className="text-base font-medium text-gray-700 mb-5">
            New Entry
          </h2>

          {/* Trigger Selection */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
              What happened? <span className="text-pink-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TRIGGER_OPTIONS.map((trigger) => (
                <Badge
                  key={trigger}
                  variant={selectedTriggers.includes(trigger) ? "default" : "outline"}
                  className={`cursor-pointer transition-calm font-medium ${
                    selectedTriggers.includes(trigger)
                      ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                  onClick={() => toggleTrigger(trigger)}
                >
                  {trigger}
                </Badge>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div className="mb-6">
            <label htmlFor="note" className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Quick note (optional)
            </label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={charLimit}
              placeholder="How did you feel? What helped?"
              className="resize-none h-24 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-300 focus:ring-blue-200 transition-calm"
            />
            <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
              <span>Keep it brief – just what matters</span>
              <span className={note.length > 120 ? "text-orange-500 font-medium" : "text-gray-400"}>
                {note.length}/{charLimit}
              </span>
            </div>
          </div>

          {/* Time Spent */}
          <div className="mb-6">
            <label htmlFor="timeSpent" className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Time spent (minutes)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                id="timeSpent"
                min="1"
                max="60"
                step="1"
                value={timeSpent}
                onChange={(e) => setTimeSpent(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-base font-medium text-gray-700 min-w-[3rem] text-right">
                {timeSpent}m
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedTriggers.length === 0}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 text-base font-medium transition-calm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Save Entry
              </>
            )}
          </Button>
        </Card>

        {/* Recent Entries */}
        <div>
          <h2 className="text-base font-medium text-gray-700 mb-4">
            Recent Entries
          </h2>

          {isLoadingEntries ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
            </div>
          ) : recentEntries.length === 0 ? (
            <Card className="p-8 text-center bg-white border-gray-200">
              <p className="text-gray-500">No entries yet. Start journaling above!</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentEntries.map((entry) => (
                <JournalCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default JournalPage;

// Commit message: feat: create mobile-first JournalPage with micro-journaling form and recent entries list
