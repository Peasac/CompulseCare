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

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Fetch from API
      // const response = await fetch("/api/targets?userId=user123");
      // const data = await response.json();
      // setTargets(data.targets);

      // MOCK DATA
      const mockTargets: Target[] = [
        {
          id: "t1",
          title: "No checking rituals",
          description: "Complete the day without checking locks/stove",
          type: "daily",
          progress: 85,
          goal: 1,
          current: 0,
          completed: false,
          deadline: "Today, 11:59 PM",
        },
        {
          id: "t2",
          title: "Journal 3 times",
          description: "Log compulsions as they happen",
          type: "daily",
          progress: 67,
          goal: 3,
          current: 2,
          completed: false,
          deadline: "Today, 11:59 PM",
        },
        {
          id: "t3",
          title: "Practice breathing",
          description: "Use breathing exercises when anxious",
          type: "daily",
          progress: 100,
          goal: 2,
          current: 2,
          completed: true,
        },
        {
          id: "t4",
          title: "Reduce checking by 30%",
          description: "Compared to last week's average",
          type: "weekly",
          progress: 70,
          goal: 30,
          current: 21,
          completed: false,
          deadline: "Sunday, 11:59 PM",
        },
        {
          id: "t5",
          title: "7-day streak",
          description: "Use CompulseCare every day",
          type: "weekly",
          progress: 71,
          goal: 7,
          current: 5,
          completed: false,
          deadline: "Sunday, 11:59 PM",
        },
      ];

      setTargets(mockTargets);
    } catch (error) {
      console.error("Failed to fetch targets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTarget = async (targetId: string) => {
    try {
      // TODO: Send PATCH to API
      // await fetch(`/api/targets/${targetId}`, {
      //   method: "PATCH",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ completed: true }),
      // });

      // Update local state
      setTargets((prev) =>
        prev.map((target) =>
          target.id === targetId
            ? { ...target, completed: true, progress: 100, current: target.goal }
            : target
        )
      );
    } catch (error) {
      console.error("Failed to complete target:", error);
      alert("Failed to mark target as complete. Please try again.");
    }
  };

  const dailyTargets = targets.filter((t) => t.type === "daily");
  const weeklyTargets = targets.filter((t) => t.type === "weekly");
  
  const completedDaily = dailyTargets.filter((t) => t.completed).length;
  const completedWeekly = weeklyTargets.filter((t) => t.completed).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Page Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
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
                <h1 className="text-xl font-bold text-gray-800">Targets</h1>
                <p className="text-sm text-gray-500">Track your daily & weekly goals</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert("Add target feature coming soon!")}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-[#2563EB]/10 to-white">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-[#2563EB]" />
              <span className="text-sm font-medium text-gray-600">Daily</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {completedDaily}/{dailyTargets.length}
            </p>
            <p className="text-xs text-gray-500">completed today</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-[#06B6D4]/10 to-white">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-[#06B6D4]" />
              <span className="text-sm font-medium text-gray-600">Weekly</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {completedWeekly}/{weeklyTargets.length}
            </p>
            <p className="text-xs text-gray-500">completed this week</p>
          </Card>
        </div>

        {/* Tabs for Daily/Weekly */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "daily" | "weekly")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="daily">Daily Targets</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Targets</TabsTrigger>
          </TabsList>

          {/* Daily Targets */}
          <TabsContent value="daily" className="space-y-4">
            {dailyTargets.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">No daily targets set yet.</p>
                <Button
                  onClick={() => alert("Add target feature coming soon!")}
                  className="mt-4 bg-[#2563EB] hover:bg-[#1D4ED8]"
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
              <Card className="p-8 text-center">
                <p className="text-gray-500">No weekly targets set yet.</p>
                <Button
                  onClick={() => alert("Add target feature coming soon!")}
                  className="mt-4 bg-[#06B6D4] hover:bg-[#0891B2] text-white"
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
    </div>
  );
};

export default TargetsPage;

// Commit message: feat: create TargetsPage with daily/weekly targets and progress tracking
