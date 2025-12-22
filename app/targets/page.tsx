"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import TargetCard from "@/components/TargetCard";
import { ArrowLeft, Plus, Loader2, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Target {
  id: string;
  title: string;
  description?: string;
  type: "daily" | "weekly";
  progress: number;
  goal: number;
  current: number;
  completed: boolean;
  pinned?: boolean;
  deadline?: string;
}

/**
 * TargetsPage - Daily and weekly targets management
 * Mobile-first design with progress tracking
 * Features: mark targets complete, view progress, add new targets
 */
const TargetsPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
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
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTargets();
    }
  }, [user]);

  // Auto-generate targets when user has none
  useEffect(() => {
    if (!isLoading && user && targets.length > 0) {
      autoGenerateTargetsIfNeeded();
    }
  }, [targets, isLoading, user]);

  const autoGenerateTargetsIfNeeded = async () => {
    if (!user) return;

    const today = new Date().toDateString();
    const lastAutoGenDate = localStorage.getItem(`lastAutoGen_${user.id}`);
    
    // Only auto-generate once per day
    if (lastAutoGenDate === today) return;

    const dailyTargets = targets.filter(t => t.type === 'daily' && !t.completed);
    const weeklyTargets = targets.filter(t => t.type === 'weekly' && !t.completed);

    // Auto-generate if less than 3 targets
    if (dailyTargets.length < 3) {
      await autoGenerateTargets('daily', 3 - dailyTargets.length);
    }
    
    // Check if it's Monday (start of week) for weekly targets
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 1 && weeklyTargets.length < 3) { // Monday = 1
      await autoGenerateTargets('weekly', 3 - weeklyTargets.length);
    }

    localStorage.setItem(`lastAutoGen_${user.id}`, today);
  };

  const autoGenerateTargets = async (type: 'daily' | 'weekly', count: number) => {
    if (!user) return;

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      // Get AI suggestions
      const suggestResponse = await fetch(`/api/targets/suggest?userId=${user.id}&type=${type}`, {
        method: "POST",
        headers,
      });
      
      if (!suggestResponse.ok) return;
      
      const data = await suggestResponse.json();
      const suggestions = (data.suggestions || []).slice(0, count);

      // Auto-add suggestions with pinned=true (all auto-generated targets are pinned)
      for (const suggestion of suggestions) {
        const response = await fetch("/api/targets", {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId: user.id,
            title: suggestion.title,
            description: suggestion.description,
            type: suggestion.type,
            goal: suggestion.goal,
            completed: false,
            pinned: true, // Auto-generated = always pinned
          }),
        });
        
        if (!response.ok) {
          console.error("Failed to create auto-generated target");
        }
      }

      // Refresh targets list
      await fetchTargets();
      
    } catch (error) {
      console.error("Failed to auto-generate targets:", error);
    }
  };

  const fetchTargets = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/targets?userId=${user.id}`, { headers });
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
          pinned: t.pinned || false,
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
    if (!target || !user) return;

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch("/api/targets", {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId: user.id,
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

  const handleDeleteTarget = async (targetId: string) => {
    if (!user) return;

    // Optimistically remove from UI
    const deletedTarget = targets.find(t => t.id === targetId);
    setTargets((prev) => prev.filter((t) => t.id !== targetId));

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/targets/${targetId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to delete target");
      }
    } catch (error) {
      console.error("Failed to delete target:", error);
      // Restore on error
      if (deletedTarget) {
        setTargets((prev) => [...prev, deletedTarget]);
      }
      alert("Failed to delete target. Please try again.");
    }
  };

  const handlePinTarget = async (targetId: string, pinned: boolean) => {
    if (!user) return;

    // Optimistically update UI
    const target = targets.find(t => t.id === targetId);
    setTargets((prev) =>
      prev.map((t) => (t.id === targetId ? { ...t, pinned } : t))
    );

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/targets/pin/${targetId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ pinned }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to pin target");
      }
    } catch (error: any) {
      console.error("Failed to pin target:", error);
      // Revert on error
      setTargets((prev) =>
        prev.map((t) => (t.id === targetId ? { ...t, pinned: !pinned } : t))
      );
      alert(error.message || "Failed to update pin status. Please try again.");
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

  const handleGetSuggestions = async (type?: 'daily' | 'weekly') => {
    if (!user) return;
    
    setLoadingSuggestions(true);
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const typeParam = type ? `&type=${type}` : '';
      const response = await fetch(`/api/targets/suggest?userId=${user.id}${typeParam}`, {
        method: "POST",
        headers,
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

  const handleAddSuggestedTarget = async (suggestion: any, silent = false) => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // In silent mode (auto-generation), always pin
      // In manual mode, check if under limit
      let shouldPin = silent;
      if (!silent) {
        const sameTypeTargets = targets.filter(t => t.type === suggestion.type && t.pinned);
        const maxPinned = suggestion.type === 'daily' ? 3 : 3; // Both are now 3
        shouldPin = sameTypeTargets.length < maxPinned;
      }
      
      const response = await fetch("/api/targets", {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId: user.id,
          title: suggestion.title,
          description: suggestion.description,
          type: suggestion.type,
          goal: suggestion.goal,
          completed: false,
          pinned: shouldPin, // Auto-pin if silent mode or under limit
        }),
      });

      if (response.ok) {
        if (!silent) {
          await fetchTargets();
          setSuggestions((prev) => prev.filter((s) => s.title !== suggestion.title));
        }
      }
    } catch (error) {
      console.error("Failed to add target:", error);
      if (!silent) {
        alert("Failed to add target. Please try again.");
      }
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
            {dailyTargets.length > 0 && (
              <div className="mt-2 bg-muted h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(completedDaily / dailyTargets.length) * 100}%` }}
                />
              </div>
            )}
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
            {weeklyTargets.length > 0 && (
              <div className="mt-2 bg-muted h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success transition-all duration-300"
                  style={{ width: `${(completedWeekly / weeklyTargets.length) * 100}%` }}
                />
              </div>
            )}
          </Card>
        </div>

        {/* Motivational Progress Card */}
        {(dailyTargets.length > 0 || weeklyTargets.length > 0) && (
          <Card className="p-5 mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {completedDaily + completedWeekly === dailyTargets.length + weeklyTargets.length 
                  ? "🎉" 
                  : completedDaily + completedWeekly > 0 
                    ? "💪" 
                    : "🎯"}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-900 mb-1">
                  {completedDaily + completedWeekly === dailyTargets.length + weeklyTargets.length
                    ? "Amazing work! All targets completed!"
                    : completedDaily + completedWeekly > 0
                      ? "Great progress! Keep going!"
                      : "Ready to start? Pick a target to begin!"}
                </h3>
                <p className="text-xs text-green-700">
                  {completedDaily + completedWeekly === dailyTargets.length + weeklyTargets.length
                    ? "You've completed all your targets. Consider setting new ones to maintain momentum."
                    : completedDaily + completedWeekly > 0
                      ? `You've completed ${completedDaily + completedWeekly} out of ${dailyTargets.length + weeklyTargets.length} targets. Every step forward counts!`
                      : "Start with one small target. Progress happens one step at a time."}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs for Daily/Weekly */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "daily" | "weekly")}>
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted">
            <TabsTrigger value="daily">Daily Targets</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Targets</TabsTrigger>
          </TabsList>

          {/* Daily Targets */}
          <TabsContent value="daily" className="space-y-4">
            {/* AI Suggestions Button for Daily */}
            <Button
              variant="default"
              size="sm"
              onClick={() => handleGetSuggestions('daily')}
              disabled={loadingSuggestions}
              className="w-full gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 mb-4"
            >
              {loadingSuggestions ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing patterns...
                </>
              ) : (
                <>
                  ✨ Get Daily AI Suggestions
                </>
              )}
            </Button>
            
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
                  onDelete={handleDeleteTarget}
                  onPin={handlePinTarget}
                />
              ))
            )}
          </TabsContent>

          {/* Weekly Targets */}
          <TabsContent value="weekly" className="space-y-4">
            {/* AI Suggestions Button for Weekly */}
            <Button
              variant="default"
              size="sm"
              onClick={() => handleGetSuggestions('weekly')}
              disabled={loadingSuggestions}
              className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 mb-4"
            >
              {loadingSuggestions ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing patterns...
                </>
              ) : (
                <>
                  ✨ Get Weekly AI Suggestions
                </>
              )}
            </Button>
            
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
                  onDelete={handleDeleteTarget}
                  onPin={handlePinTarget}
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
