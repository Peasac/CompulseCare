import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CompulsionLog {
  id: string;
  activity: string;
  timeSpent: number; // in minutes
  date: string;
  category: "checking" | "cleaning" | "organizing" | "counting" | "other";
}

const categories = [
  { value: "checking", label: "Checking", color: "bg-panic/20" },
  { value: "cleaning", label: "Cleaning", color: "bg-primary/20" },
  { value: "organizing", label: "Organizing", color: "bg-secondary/20" },
  { value: "counting", label: "Counting", color: "bg-success/20" },
  { value: "other", label: "Other", color: "bg-muted" },
] as const;

const CompulsionLogger = () => {
  const [logs, setLogs] = useState<CompulsionLog[]>([
    {
      id: "1",
      activity: "Checked door locks",
      timeSpent: 15,
      date: new Date().toISOString(),
      category: "checking",
    },
    {
      id: "2",
      activity: "Washed hands repeatedly",
      timeSpent: 25,
      date: new Date(Date.now() - 86400000).toISOString(),
      category: "cleaning",
    },
  ]);

  const [newActivity, setNewActivity] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CompulsionLog["category"]>("checking");

  const handleAddLog = () => {
    if (!newActivity.trim()) {
      toast.error("Please enter an activity name");
      return;
    }

    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);

    if (totalMinutes === 0) {
      toast.error("Please enter time spent");
      return;
    }

    const newLog: CompulsionLog = {
      id: Date.now().toString(),
      activity: newActivity,
      timeSpent: totalMinutes,
      date: new Date().toISOString(),
      category: selectedCategory,
    };

    setLogs([newLog, ...logs]);
    setNewActivity("");
    setHours("");
    setMinutes("");
    toast.success("Compulsion logged successfully!");
  };

  const handleDelete = (id: string) => {
    setLogs(logs.filter((log) => log.id !== id));
    toast.success("Log deleted");
  };

  const handleExport = () => {
    toast.success("Compulsion logs export started!");
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const getTodayTotal = () => {
    const today = new Date().toDateString();
    return logs
      .filter((log) => new Date(log.date).toDateString() === today)
      .reduce((sum, log) => sum + log.timeSpent, 0);
  };

  return (
    <Card className="p-6 shadow-card animate-fade-slide-in backdrop-blur-sm bg-card/95">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Compulsion Logger</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* Add New Log */}
      <div className="space-y-3 mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div>
          <label className="text-sm font-medium mb-2 block">Activity/Compulsion</label>
          <Input
            placeholder="e.g., Checked door locks, Washed hands..."
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            className="bg-background"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Badge
                key={cat.value}
                variant="outline"
                className={`cursor-pointer transition-smooth ${
                  selectedCategory === cat.value ? cat.color : "hover:bg-muted"
                }`}
                onClick={() => setSelectedCategory(cat.value as CompulsionLog["category"])}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Time Spent</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Hours"
                min="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Minutes"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleAddLog} className="w-full">
          Log Compulsion
        </Button>
      </div>

      {/* Today's Total */}
      <div className="mb-4 p-3 bg-secondary/10 rounded-lg text-center border border-secondary/20">
        <p className="text-sm text-muted-foreground">Today's Total Time</p>
        <p className="text-2xl font-bold text-foreground">{formatTime(getTodayTotal())}</p>
      </div>

      {/* Logs List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No logs yet. Start tracking!</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-3 border border-border rounded-lg hover:bg-muted/20 transition-smooth"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-sm">{log.activity}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={categories.find((c) => c.value === log.category)?.color}
                    >
                      {categories.find((c) => c.value === log.category)?.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(log.date)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10">
                    {formatTime(log.timeSpent)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(log.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default CompulsionLogger;
