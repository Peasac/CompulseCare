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
import PanicButton from "@/components/PanicButton";
import CheckInStrip from "@/components/CheckInStrip";
import DailyInsightBanner from "@/components/DailyInsightBanner";
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
  const [targetView, setTargetView] = useState<'daily' | 'weekly'>('daily');

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
          {/* Left Column - Compulsion Logger Only */}
          <div className="lg:col-span-1 space-y-4">
            <CompulsionLoggerWidget />
          </div>

          {/* Center Column - Panic Button */}
          <div className="lg:col-span-1 flex flex-col items-center justify-start py-4">
            <div className="sticky top-8 w-full max-w-md flex flex-col items-center">
              <PanicButton onPanicClick={handlePauseClick} />
            </div>
          </div>

          {/* Right Column - Targets with Segmented Toggle */}
          <div className="lg:col-span-1 space-y-4">
            {/* Segmented Toggle - Reduced Visual Noise */}
            <div className="flex bg-gray-100/50 p-1 rounded-xl w-full max-w-[280px] mx-auto mb-2 border border-gray-200/50">
              <button
                onClick={() => setTargetView('daily')}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all duration-300 ${targetView === 'daily'
                  ? 'bg-white text-gray-800 shadow-sm transform scale-105'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTargetView('weekly')}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all duration-300 ${targetView === 'weekly'
                  ? 'bg-white text-gray-800 shadow-sm transform scale-105'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Weekly
              </button>
            </div>

            {/* Conditionally Render Widget with Fade Effect */}
            <div className="animate-fade-in">
              {targetView === 'daily' ? (
                <DailyTargetsWidget />
              ) : (
                <WeeklyTargetsWidget />
              )}
            </div>

            {/* Check-In Section (New Compact Strip) */}
            <div className="mt-4">
              <CheckInStrip
                streak={dashboardData?.mood?.stats?.streak ?? 0}
                onCheckIn={() => document.getElementById("check-in-trigger")?.click()}
                onHistoryClick={() => router.push("/checkin")}
              />
              {/* Hidden trigger for modal - simplified integration */}
              <div className="hidden">
                <CheckInModal userId={user.id} />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Insight Banner */}
        <DailyInsightBanner
          insight={dashboardData?.aiSnapshot?.insight}
          loading={loading}
        />

        {/* Analytics + Weekly Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
          {/* Analytics Card */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-soft border-white/50 hover-lift cursor-pointer group" onClick={() => router.push("/summary")}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-base text-gray-700 group-hover:text-primary transition-colors">Your Progress</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-primary text-xs bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100"
              >
                Details →
              </Button>
            </div>

            {loading ? (
              <div className="space-y-5">
                <div className="h-16 bg-gray-100/50 rounded-xl animate-pulse" />
                <div className="h-16 bg-gray-100/50 rounded-xl animate-pulse" />
                <div className="h-16 bg-gray-100/50 rounded-xl animate-pulse" />
              </div>
            ) : error || !dashboardData ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Failed to load progress</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Avg Anxiety */}
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:bg-white transition-calm">
                  <span className="text-sm text-gray-500 font-medium">Avg Anxiety</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold text-gray-800">
                      {dashboardData.progress.avgAnxiety || 0}
                    </span>
                    <span className="text-xs text-gray-400">/10</span>
                  </div>
                </div>

                {/* Total Compulsions */}
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:bg-white transition-calm">
                  <span className="text-sm text-gray-500 font-medium">Total Compulsions</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold text-gray-800">
                      {dashboardData.progress.totalCompulsions}
                    </span>
                    {dashboardData.progress.compulsionChange !== 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${dashboardData.progress.compulsionChange < 0 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                        {dashboardData.progress.compulsionChange > 0 ? '↑' : '↓'} {Math.abs(dashboardData.progress.compulsionChange)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Pause Sessions */}
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:bg-white transition-calm">
                  <span className="text-sm text-gray-500 font-medium">Pause Sessions</span>
                  <span className="text-xl font-semibold text-gray-800">
                    {dashboardData.progress.pauseSessions}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* AI Snapshot Card */}
          <Card className="p-6 bg-gradient-to-br from-white to-blue-50/30 shadow-soft border-blue-100/50 hover-lift cursor-pointer group" onClick={() => router.push("/summary")}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-base text-gray-700 group-hover:text-primary transition-colors">What we noticed this week</h3>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-full border border-blue-100">AI</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-primary text-xs bg-white/50 hover:bg-white border border-transparent hover:border-blue-100"
              >
                Details →
              </Button>
            </div>

            {loading ? (
              <div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 bg-gray-100/50 rounded-xl animate-pulse" />
                  ))}
                </div>
                <div className="h-24 bg-blue-50/50 rounded-xl animate-pulse" />
              </div>
            ) : error || !dashboardData ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Failed to load insights</p>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-4 bg-white/60 rounded-xl border border-gray-100 hover:border-blue-100 transition-calm">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Sessions</p>
                    <span className="text-xl font-semibold text-gray-800">
                      {dashboardData.aiSnapshot.sessions}
                    </span>
                  </div>
                  <div className="p-4 bg-white/60 rounded-xl border border-gray-100 hover:border-blue-100 transition-calm">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Completion</p>
                    <span className="text-xl font-semibold text-gray-800">
                      {dashboardData.aiSnapshot.completion}%
                    </span>
                  </div>
                  <div className="p-4 bg-white/60 rounded-xl border border-gray-100 hover:border-blue-100 transition-calm">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Avg Anxiety</p>
                    <span className="text-xl font-semibold text-gray-800">
                      {dashboardData.aiSnapshot.avgAnxiety}<span className="text-sm text-gray-400 font-normal">/10</span>
                    </span>
                  </div>
                  <div className="p-4 bg-white/60 rounded-xl border border-gray-100 hover:border-blue-100 transition-calm">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Journals</p>
                    <span className="text-xl font-semibold text-gray-800">
                      {dashboardData.aiSnapshot.journals}
                    </span>
                  </div>
                </div>

                {/* AI-Generated Pattern Insight */}
                <div className="relative p-5 bg-blue-50/40 rounded-xl border border-blue-100">
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-medium text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-100 shadow-sm">High Confidence</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-xl mt-0.5">💡</span>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium pt-1 animate-fade-in">
                      {dashboardData.aiSnapshot.insight.split('.')[0]}.
                    </p>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Mood Tracker Section - Passive Display Only */}
        <Card className="p-6 bg-white shadow-soft border-gray-100 mt-8 hover-lift cursor-pointer" onClick={() => router.push("/mood")}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌟</span>
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
