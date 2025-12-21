"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import TargetCard from "@/components/TargetCard";
import { ArrowLeft, Plus, Loader2, Trophy } from "lucide-react";

interface Target {
  id: string;
  title: string;
  description?: string;
  type: "daily" | "weekly";
  progress: number;
  goal: number;
  current: number;
  completed: boolean;
  deadline?: string;
}

/**
 * TargetsPage - Daily and weekly targets management
 * Mobile-first design with progress tracking
 * Features: mark targets complete, view progress, add new targets
 */
const TargetsPage = () => {
  const router = useRouter();
  const [targets, setTargets] = useState<Target[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [newTarget, setNewTarget] = useState({
    title: "",
    description: "",
    type: "daily" as "daily" | "weekly",
    goal: 1,
  });

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/targets?userId=user123");
      if (response.ok) {
        const data = await response.json();
        // Transform API data to match component expectations
        const transformedTargets: Target[] = (data.targets || []).map((t: any) => ({
          id: t._id || t.id,
          title: t.title,
          description: t.description,
          type: t.type,
          progress: t.completed ? 100 : 0,
          goal: t.goal || 1,
          current: t.completed ? (t.goal || 1) : 0,
          completed: t.completed,
          deadline: t.type === "daily" ? "Today, 11:59 PM" : "Sunday, 11:59 PM",
        }));
        setTargets(transformedTargets);
      } else {
        throw new Error("Failed to fetch targets");
      }
    } catch (error) {
      console.error("Failed to fetch targets:", error);
      setTargets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTarget = async (targetId: string) => {
    const target = targets.find((t) => t.id === targetId);
    if (!target) return;

    try {
      const response = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user123",
          title: target.title,
          description: target.description,
          type: target.type,
          goal: target.goal,
          completed: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete target");
      }

      // Update local state
      setTargets((prev) =>
        prev.map((t) =>
          t.id === targetId
            ? { ...t, completed: true, progress: 100, current: t.goal }
            : t
        )
      );
    } catch (error) {
      console.error("Failed to complete target:", error);
      alert("Failed to mark target as complete. Please try again.");
    }
  };

  const handleAddTarget = () => {
    if (!newTarget.title.trim()) return;

    const target: Target = {
      id: `t${Date.now()}`,
      title: newTarget.title,
      description: newTarget.description,
      type: newTarget.type,
      progress: 0,
      goal: newTarget.goal,
      current: 0,
      completed: false,
      deadline: newTarget.type === "daily" ? "Today, 11:59 PM" : "Sunday, 11:59 PM",
    };

    setTargets((prev) => [...prev, target]);
    setShowAddModal(false);
    setNewTarget({
      title: "",
      description: "",
      type: "daily",
      goal: 1,
    });
  };

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch("/api/targets/suggest?userId=user123", {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } else {
        throw new Error("Failed to get suggestions");
      }
    } catch (error) {
      console.error("Failed to get suggestions:", error);
      alert("Failed to generate suggestions. Please try again.");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddSuggestedTarget = async (suggestion: any) => {
    try {
      const response = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user123",
          title: suggestion.title,
          description: suggestion.description,
          type: suggestion.type,
          goal: suggestion.goal,
          completed: false,
        }),
      });

      if (response.ok) {
        await fetchTargets();
        setSuggestions((prev) => prev.filter((s) => s.title !== suggestion.title));
      }
    } catch (error) {
      console.error("Failed to add target:", error);
      alert("Failed to add target. Please try again.");
    }
  };

  const dailyTargets = targets.filter((t) => t.type === "daily");
  const weeklyTargets = targets.filter((t) => t.type === "weekly");
  
  const completedDaily = dailyTargets.filter((t) => t.completed).length;
  const completedWeekly = weeklyTargets.filter((t) => t.completed).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <header className="bg-card border-b border-border shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
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
                <h1 className="text-xl font-medium text-foreground">Targets</h1>
                <p className="text-sm text-muted-foreground">Track your daily & weekly goals</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="gap-2 border-border"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>

          {/* AI Suggestions Button */}
          <div className="mt-3">
            <Button
              variant="default"
              size="sm"
              onClick={handleGetSuggestions}
              disabled={loadingSuggestions}
              className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loadingSuggestions ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing patterns...
                </>
              ) : (
                <>
                  ✨ Get AI Target Suggestions
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* AI Suggestions Section */}
        {showSuggestions && suggestions.length > 0 && (
          <Card className="p-4 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-purple-900">🎯 AI Suggested Targets</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(false)}
                className="text-purple-600 hover:text-purple-700"
              >
                ✕
              </Button>
            </div>
            <div className="space-y-3">
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-lg border border-purple-200 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{suggestion.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                      <p className="text-xs text-purple-600 mt-2 italic">
                        💡 {suggestion.reasoning}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddSuggestedTarget(suggestion)}
                      className="shrink-0 text-xs"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-card border-border shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Daily</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {completedDaily}/{dailyTargets.length}
            </p>
            <p className="text-xs text-muted-foreground">completed today</p>
          </Card>

          <Card className="p-4 bg-card border-border shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-success" />
              <span className="text-sm font-medium text-muted-foreground">Weekly</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {completedWeekly}/{weeklyTargets.length}
            </p>
            <p className="text-xs text-muted-foreground">completed this week</p>
          </Card>
        </div>

        {/* Tabs for Daily/Weekly */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "daily" | "weekly")}>
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted">
            <TabsTrigger value="daily">Daily Targets</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Targets</TabsTrigger>
          </TabsList>

          {/* Daily Targets */}
          <TabsContent value="daily" className="space-y-4">
            {dailyTargets.length === 0 ? (
              <Card className="p-8 text-center bg-card border-border">
                <p className="text-muted-foreground">No daily targets set yet.</p>
                <Button
                  onClick={() => {
                    setNewTarget({ ...newTarget, type: "daily" });
                    setShowAddModal(true);
                  }}
                  className="mt-4 bg-primary hover:bg-primary/90"
                >
                  Create Your First Target
                </Button>
              </Card>
            ) : (
              dailyTargets.map((target) => (
                <TargetCard
                  key={target.id}
                  target={target}
                  onComplete={handleCompleteTarget}
                />
              ))
            )}
          </TabsContent>

          {/* Weekly Targets */}
          <TabsContent value="weekly" className="space-y-4">
            {weeklyTargets.length === 0 ? (
              <Card className="p-8 text-center bg-card border-border">
                <p className="text-muted-foreground">No weekly targets set yet.</p>
                <Button
                  onClick={() => {
                    setNewTarget({ ...newTarget, type: "weekly" });
                    setShowAddModal(true);
                  }}
                  className="mt-4 bg-success hover:bg-success/90 text-success-foreground"
                >
                  Create Your First Target
                </Button>
              </Card>
            ) : (
              weeklyTargets.map((target) => (
                <TargetCard
                  key={target.id}
                  target={target}
                  onComplete={handleCompleteTarget}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Target Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-md p-6 shadow-soft-lg bg-card border-border">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Create New Target
            </h3>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                  Target Title
                </label>
                <input
                  type="text"
                  value={newTarget.title}
                  onChange={(e) => setNewTarget({ ...newTarget, title: e.target.value })}
                  placeholder="e.g., Limit checking to 2 times"
                  className="w-full p-3 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-calm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newTarget.description}
                  onChange={(e) => setNewTarget({ ...newTarget, description: e.target.value })}
                  placeholder="Add more details..."
                  className="w-full p-3 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-calm"
                  rows={2}
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                  Target Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewTarget({ ...newTarget, type: "daily" })}
                    className={`flex-1 p-3 text-sm rounded-md border transition-calm ${
                      newTarget.type === "daily"
                        ? "bg-primary/10 border-primary text-primary font-medium"
                        : "bg-card border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setNewTarget({ ...newTarget, type: "weekly" })}
                    className={`flex-1 p-3 text-sm rounded-md border transition-calm ${
                      newTarget.type === "weekly"
                        ? "bg-success/10 border-success text-success-foreground font-medium"
                        : "bg-card border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Weekly
                  </button>
                </div>
              </div>

              {/* Goal */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                  Goal (times to complete)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newTarget.goal}
                  onChange={(e) => setNewTarget({ ...newTarget, goal: parseInt(e.target.value) || 1 })}
                  className="w-full p-3 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-calm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowAddModal(false)}
                variant="outline"
                className="flex-1 border-border"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddTarget}
                disabled={!newTarget.title.trim()}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Create Target
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TargetsPage;

// Commit message: feat: create TargetsPage with daily/weekly targets and progress tracking
