import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Download, Smile } from "lucide-react";
import { toast } from "sonner";

const moodEmojis = [
  { emoji: "😰", label: "Very Anxious" },
  { emoji: "😟", label: "Anxious" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😊", label: "Calm" },
  { emoji: "😄", label: "Very Calm" },
];

const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [intensity, setIntensity] = useState([5]);

  const handleSaveMood = () => {
    if (selectedMood === null) {
      toast.error("Please select a mood");
      return;
    }
    toast.success("Mood logged successfully!");
    setSelectedMood(null);
    setIntensity([5]);
  };

  const handleExport = () => {
    toast.success("Mood data export started!");
  };

  return (
    <Card className="p-6 shadow-card animate-fade-slide-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Smile className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Mood Tracker</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Mood Input */}
        <div>
          <label className="text-sm font-medium mb-3 block">How are you feeling right now?</label>
          <div className="flex gap-2 mb-4">
            {moodEmojis.map((mood, index) => (
              <Button
                key={index}
                variant={selectedMood === index ? "default" : "outline"}
                size="lg"
                className="text-3xl p-3 transition-bounce"
                onClick={() => setSelectedMood(index)}
              >
                {mood.emoji}
              </Button>
            ))}
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">
              Intensity: {intensity[0]}/10
            </label>
            <Slider
              value={intensity}
              onValueChange={setIntensity}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          <Button onClick={handleSaveMood} className="w-full">
            Log Mood
          </Button>
        </div>

        {/* Mood Stats */}
        <div>
          <h3 className="text-sm font-medium mb-3">This Week's Mood</h3>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg ${
                  i < 5
                    ? "bg-success/30"
                    : i < 6
                    ? "bg-primary/30"
                    : "bg-panic/30"
                }`}
                title={`Day ${i + 1}`}
              />
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Average Mood</span>
              <Badge>😊 Calm</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Most Frequent</span>
              <Badge>😐 Neutral</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Current Streak</span>
              <Badge className="bg-success/20">5 days</Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MoodTracker;
