import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardList } from "lucide-react";

interface CheckInQuestion {
  id: string;
  question: string;
  category: string;
  minLabel: string;
  maxLabel: string;
}

const STANDARD_QUESTIONS: CheckInQuestion[] = [
  {
    id: "anxiety",
    question: "How would you rate your overall anxiety level today?",
    category: "anxiety",
    minLabel: "Very calm",
    maxLabel: "Very anxious",
  },
  {
    id: "compulsion-urge",
    question: "How strong were your compulsive urges today?",
    category: "compulsion",
    minLabel: "No urges",
    maxLabel: "Very strong urges",
  },
  {
    id: "control",
    question: "How much control did you feel over your responses today?",
    category: "control",
    minLabel: "No control",
    maxLabel: "Full control",
  },
  {
    id: "functioning",
    question: "How well were you able to function in daily activities today?",
    category: "functioning",
    minLabel: "Not at all",
    maxLabel: "Very well",
  },
  {
    id: "sleep",
    question: "How would you rate your sleep quality last night?",
    category: "sleep",
    minLabel: "Very poor",
    maxLabel: "Excellent",
  },
];

export default function CheckInModal({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [responses, setResponses] = useState<{ [key: string]: number }>({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [checkingToday, setCheckingToday] = useState(true);

  // Check if user already checked in today
  useEffect(() => {
    if (open && userId) {
      checkTodayCheckIn();
    }
  }, [open, userId]);

  const checkTodayCheckIn = async () => {
    setCheckingToday(true);
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/checkin?userId=${userId}&limit=1`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data.checkIns && data.checkIns.length > 0) {
          const lastCheckIn = new Date(data.checkIns[0].createdAt);
          const today = new Date();
          
          // Check if last check-in was today (same day)
          const isToday = lastCheckIn.getDate() === today.getDate() &&
                         lastCheckIn.getMonth() === today.getMonth() &&
                         lastCheckIn.getFullYear() === today.getFullYear();
          
          setAlreadyCheckedIn(isToday);
        } else {
          setAlreadyCheckedIn(false);
        }
      }
    } catch (error) {
      console.error("Error checking today's check-in:", error);
      setAlreadyCheckedIn(false);
    } finally {
      setCheckingToday(false);
    }
  };

  const handleSliderChange = (questionId: string, value: number[]) => {
    setResponses((prev) => ({ ...prev, [questionId]: value[0] }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const responsesArray = STANDARD_QUESTIONS.map((q) => ({
        question: q.question,
        response: responses[q.id] || 5, // Default to middle if not set
        category: q.category,
      }));

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId,
          responses: responsesArray,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setMessage("Check-in submitted successfully!");
        // Reset form
        setResponses({});
        setNotes("");
        setTimeout(() => {
          setOpen(false);
          setMessage("");
        }, 1500);
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to submit check-in");
      }
    } catch (error) {
      console.error("Error submitting check-in:", error);
      setMessage("Failed to submit check-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <ClipboardList className="mr-2 h-4 w-4" />
          Daily Check-In
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Daily Check-In</DialogTitle>
          <DialogDescription>
            Reflect on your day with these quick questions. Your responses help track patterns over time.
          </DialogDescription>
        </DialogHeader>

        {checkingToday ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Checking today's check-in...</p>
          </div>
        ) : alreadyCheckedIn ? (
          <div className="py-8 text-center space-y-4">
            <div className="text-green-600 text-lg">✓</div>
            <div>
              <p className="font-medium text-gray-900">You've already checked in today!</p>
              <p className="text-sm text-gray-600 mt-2">Come back tomorrow for your next check-in.</p>
            </div>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
          {STANDARD_QUESTIONS.map((question) => (
            <div key={question.id} className="space-y-2">
              <Label className="text-sm font-medium">{question.question}</Label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground min-w-[80px]">
                  {question.minLabel}
                </span>
                <Slider
                  value={[responses[question.id] || 5]}
                  onValueChange={(value) => handleSliderChange(question.id, value)}
                  min={0}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground min-w-[80px] text-right">
                  {question.maxLabel}
                </span>
              </div>
              <div className="text-center text-sm font-medium">
                {responses[question.id] !== undefined ? responses[question.id] : 5}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any additional thoughts or context about your day..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {message && (
            <div
              className={`text-sm ${
                message.includes("success") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </div>
          )}

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit Check-In"}
          </Button>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
