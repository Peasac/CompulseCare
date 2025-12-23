"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompulsionLoggerWidget from "@/components/CompulsionLoggerWidget";
import DailyTargetsWidget from "@/components/DailyTargetsWidget";
import WeeklyTargetsWidget from "@/components/WeeklyTargetsWidget";
import CheckInModal from "@/components/CheckInModal";
import { useAuth } from "@/contexts/AuthContext";

/**
 * DashboardPage - Main landing page with centered Pause & Breathe button
 * 3-column layout: Compulsion Logger | PAUSE Button | Daily Targets
 * Analytics, Summary, and Mood sections below
 */

interface DashboardData {
  progress: {
    avgAnxiety: number;
    totalCompulsions: number;
    compulsionChange: number;
    pauseSessions: number;
  };
  aiSnapshot: {
    sessions: number;
    completion: number;
    avgAnxiety: number;
    journals: number;
    insight: string;
  };
  mood: {
    current: {
      emoji: string;
      label: string;
      intensity: number;
    } | null;
    weeklyStrip: Array<{
      emoji: string;
      label: string;
      day: string;
    }>;
    stats: {
      streak: number;
      avgThisWeek: number;
      totalEntries: number;
    };
    correlationHint: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    
    async function fetchDashboard() {
      try {
        setLoading(true);
        console.log('[Dashboard] Fetching for userId:', user.id);
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/dashboard?userId=${user.id}`, {
          headers,
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const data = await response.json();
        console.log('[Dashboard] Received data:', data);
        setDashboardData(data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [user, token]);

  const handlePauseClick = () => {
    router.push("/panic");
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      {/* Header */}
      <Header userName={user.name || undefined} showExport={true} userId={user.id} />

      {/* Main Content - 3 Column Layout with Large Center Button */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column - Compulsion Logger + Check-In */}
          <div className="lg:col-span-1 space-y-4">
            <CompulsionLoggerWidget />
            <CheckInModal userId={user.id} />
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push("/checkin")}
            >
              View Check-In History
            </Button>
          </div>

          {/* Center Column - Panic Button */}
          <div className="lg:col-span-1 flex flex-col items-center justify-start">
            <div className="sticky top-8 w-full max-w-md">
              <button
                onClick={handlePauseClick}
                className="relative w-full aspect-square max-w-[380px] mx-auto rounded-full bg-gradient-to-br from-pink-200 via-rose-200 to-pink-300 shadow-soft-lg hover:shadow-xl transition-calm hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-pink-200/50 group animate-breathe"
              >
                {/* Subtle glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 blur-2xl opacity-40 group-hover:opacity-60 transition-fade" />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
                  {/* <div className="mb-6">
                    <svg className="w-16 h-16 text-pink-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div> */}
                  <h2 className="text-3xl md:text-4xl font-semibold text-pink-800 mb-2">
                    Panic
                  </h2>
                  {/* <p className="text-pink-700/80 text-center text-sm md:text-base">
                    I need help now
                  </p> */}
                </div>
              </button>
            </div>
          </div>

          {/* Right Column - Daily Targets */}
          <div className="lg:col-span-1 space-y-4">
            <DailyTargetsWidget />
            <WeeklyTargetsWidget />
          </div>
        </div>

        {/* Analytics + Weekly Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Analytics Card - Preview Only */}
          <Card className="p-6 bg-card shadow-soft border-border hover-lift cursor-pointer" onClick={() => router.push("/summary")}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-base text-foreground">Your Progress</h3>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Details →
              </Button>
            </div>

            {loading ? (
              <div className="space-y-5">
                <div className="h-16 bg-muted/20 rounded-md animate-pulse" />
                <div className="h-16 bg-muted/20 rounded-md animate-pulse" />
                <div className="h-16 bg-muted/20 rounded-md animate-pulse" />
              </div>
            ) : error || !dashboardData ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Failed to load progress</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Avg Anxiety */}
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                  <span className="text-sm text-muted-foreground">Avg Anxiety</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold text-foreground">
                      {dashboardData.progress.avgAnxiety || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">/10</span>
                  </div>
                </div>

                {/* Total Compulsions */}
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                  <span className="text-sm text-muted-foreground">Total Compulsions</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold text-foreground">
                      {dashboardData.progress.totalCompulsions}
                    </span>
                    {dashboardData.progress.compulsionChange !== 0 && (
                      <span className={`text-xs ${dashboardData.progress.compulsionChange < 0 ? 'text-success' : 'text-destructive'}`}>
                        {dashboardData.progress.compulsionChange > 0 ? '↑' : '↓'} {Math.abs(dashboardData.progress.compulsionChange)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Pause Sessions */}
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                  <span className="text-sm text-muted-foreground">Pause Sessions</span>
                  <span className="text-xl font-semibold text-foreground">
                    {dashboardData.progress.pauseSessions}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* AI Snapshot Card */}
          <Card className="p-6 bg-card shadow-soft border-primary/10 hover-lift cursor-pointer" onClick={() => router.push("/summary")}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-base text-foreground">AI Snapshot</h3>
                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">AI</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Details →
              </Button>
            </div>

            {loading ? (
              <div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-muted/30 rounded-md animate-pulse" />
                  ))}
                </div>
                <div className="h-20 bg-primary/5 rounded-md animate-pulse" />
              </div>
            ) : error || !dashboardData ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Failed to load insights</p>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-muted/30 rounded-md border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Sessions</p>
                    <span className="text-lg font-semibold text-foreground">
                      {dashboardData.aiSnapshot.sessions}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Completion</p>
                    <span className="text-lg font-semibold text-foreground">
                      {dashboardData.aiSnapshot.completion}%
                    </span>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Avg Anxiety</p>
                    <span className="text-lg font-semibold text-foreground">
                      {dashboardData.aiSnapshot.avgAnxiety}/10
                    </span>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Journals</p>
                    <span className="text-lg font-semibold text-foreground">
                      {dashboardData.aiSnapshot.journals}
                    </span>
                  </div>
                </div>

                {/* AI-Generated Pattern Insight */}
                <div className="p-3 bg-primary/5 rounded-md border border-primary/10">
                  <p className="text-sm text-foreground leading-relaxed">
                    {dashboardData.aiSnapshot.insight}
                  </p>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Mood Tracker Section - Passive Display Only */}
        <Card className="p-6 bg-white shadow-soft border-gray-100 mt-8 hover-lift cursor-pointer" onClick={() => router.push("/mood")}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">😊</span>
              <h3 className="font-medium text-base text-gray-700">Emotional Check-In</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              Track →
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-20 bg-muted/20 rounded-lg animate-pulse" />
              <div className="h-16 bg-muted/20 rounded-lg animate-pulse" />
            </div>
          ) : error || !dashboardData ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Failed to load mood data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Mood Display - Compact */}
              {dashboardData.mood.current ? (
                <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{dashboardData.mood.current.emoji}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{dashboardData.mood.current.label}</p>
                        <p className="text-xs text-gray-500">Current mood</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-semibold text-gray-800">
                        {dashboardData.mood.current.intensity}
                      </span>
                      <span className="text-xs text-gray-500">/10</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-muted/20 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">No mood logged today</p>
                </div>
              )}

              {/* Weekly Mood Strip - Compact */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">This Week</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {dashboardData.mood.weeklyStrip.map((mood, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-md border border-gray-100 hover:bg-gray-100 transition-calm"
                    >
                      <span className="text-2xl mb-1">{mood.emoji}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{mood.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mood Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-gray-50 rounded-md border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Streak</p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">
                    {dashboardData.mood.stats.streak}d
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded-md border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Avg</p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">
                    {dashboardData.mood.stats.avgThisWeek}
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded-md border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Logged</p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">
                    {dashboardData.mood.stats.totalEntries}
                  </p>
                </div>
              </div>

              {/* Correlation Hint */}
              {dashboardData.mood.correlationHint && (
                <div className="p-2 bg-blue-50/50 rounded-md border border-blue-100">
                  <p className="text-xs text-gray-600">{dashboardData.mood.correlationHint}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
