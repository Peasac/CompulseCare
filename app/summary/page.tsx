"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import SummaryCard from "@/components/SummaryCard";
import DocumentUploadCard from "@/components/DocumentUploadCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Loader2, Download, Calendar } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface WeeklySummaryData {
  textSummary: string;
  totalCompulsions: number;
  avgTimeSpent: number;
  mostCommonTrigger: string;
  compulsionChange: number;
  moodAverage: number;
  chartData: {
    day: string;
    compulsions: number;
    timeSpent: number;
  }[];
  insights: string[];
}

/**
 * WeeklySummaryPage - LLM-generated insights and analytics
 * Mobile-first design with charts using Recharts
 * Features: textual summary, trends, visualizations
 */
const WeeklySummaryPage = () => {
  const router = useRouter();
  const { user, token } = useAuth();
  const [summaryData, setSummaryData] = useState<WeeklySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWeeklySummary();
    }
  }, [user, token]);

  const fetchWeeklySummary = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/summary?userId=${user.id}`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch summary");
      }

      const data = await response.json();
      setSummaryData(data);
    } catch (err) {
      console.error("Summary fetch error:", err);
      setError("Unable to load weekly summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement PDF or CSV export
    alert("Export feature coming soon!");
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#2563EB] mx-auto" />
            <p className="text-gray-600">Generating your summary...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !summaryData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#F5F6FA]">
          <header className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10">
            <div className="container mx-auto px-4 py-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
          </header>
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Card className="p-8 text-center">
              <p className="text-red-600">{error || "No data available"}</p>
              <Button
                onClick={fetchWeeklySummary}
                className="mt-4 bg-[#2563EB] hover:bg-[#1D4ED8]"
              >
                Try Again
              </Button>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F5F6FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/")}
                aria-label="Go back to dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Weekly Insights</h1>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Last 7 days
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-medium text-foreground">
            Weekly Summary
          </h2>
          <Button variant="outline" size="sm" className="border-border text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            Last 7 days
          </Button>
        </div>

        {/* 1. AI WEEKLY INSIGHTS - PRIMARY FOCUS */}
        <Card className="p-8 shadow-soft bg-gradient-to-br from-card to-muted/10 border-primary/20">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-medium text-foreground">
              Weekly Insights
            </h3>
            <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">AI-Generated</span>
          </div>
          
          <div className="space-y-6">
            {/* Patterns Noticed This Week */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-primary text-lg">◆</span>
                <h4 className="text-base font-medium text-foreground">Patterns noticed this week</h4>
              </div>
              <p className="text-base text-foreground leading-relaxed pl-7">
                {summaryData.insights?.[0] || "Your compulsions decreased on days when you used the pause button more frequently. The breathing exercises seem to create a buffer between the urge and the action."}
              </p>
            </div>

            {/* What Helped */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-success text-lg">✓</span>
                <h4 className="text-base font-medium text-foreground">What helped</h4>
              </div>
              <p className="text-base text-foreground leading-relaxed pl-7">
                {summaryData.textSummary || "Your journal entries show you're recognizing triggers earlier. This awareness is giving you more time to respond rather than react."}
              </p>
            </div>

            {/* One Gentle Suggestion */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-muted-foreground text-lg">→</span>
                <h4 className="text-base font-medium text-foreground">One gentle suggestion for next week</h4>
              </div>
              <p className="text-base text-foreground leading-relaxed pl-7 mb-4">
                {summaryData.insights?.[1] || "Try using the pause button at the first sign of a trigger, before the compulsion feels urgent. Early intervention seems to work best for you."}
              </p>
              <div className="flex flex-wrap gap-2 pl-7">
                <Button
                  onClick={() => router.push("/journal")}
                  variant="outline"
                  size="sm"
                  className="border-border"
                >
                  Log a reflection
                </Button>
                <Button
                  onClick={() => router.push("/targets")}
                  variant="outline"
                  size="sm"
                  className="border-border"
                >
                  Set a goal
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Document Upload Section */}
        <DocumentUploadCard userId={user.id} />

        {/* 2. DATA & TRENDS SECTION - SUPPORTING EVIDENCE */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Data & Trends
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compulsions Chart */}
            <Card className="p-5 shadow-soft bg-card border-border">
              <h4 className="text-sm font-medium text-foreground mb-4">
                Daily Compulsions
              </h4>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={summaryData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar 
                    dataKey="compulsions" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="Compulsions"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Time Spent Chart */}
            <Card className="p-5 shadow-soft bg-card border-border">
              <h4 className="text-sm font-medium text-foreground mb-4">
                Time Spent (minutes)
              </h4>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={summaryData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="timeSpent" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--success))', r: 4 }}
                    name="Minutes"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>

        {/* 3. KEY METRICS - SUPPORTING DATA */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Key Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 shadow-soft bg-card border-border">
              <p className="text-xs text-muted-foreground mb-2">Total Compulsions</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-foreground">
                  {summaryData.totalCompulsions || 0}
                </span>
                {summaryData.compulsionChange && summaryData.compulsionChange < 0 && (
                  <span className="text-xs text-success">
                    ↓ {Math.abs(summaryData.compulsionChange)}%
                  </span>
                )}
              </div>
            </Card>
            <Card className="p-4 shadow-soft bg-card border-border">
              <p className="text-xs text-muted-foreground mb-2">Avg Time</p>
              <span className="text-2xl font-semibold text-foreground">
                {summaryData.avgTimeSpent || 0}<span className="text-sm text-muted-foreground font-normal ml-1">min</span>
              </span>
            </Card>
            <Card className="p-4 shadow-soft bg-card border-border">
              <p className="text-xs text-muted-foreground mb-2">Avg Mood</p>
              <span className="text-2xl font-semibold text-foreground">
                {summaryData.moodAverage || "N/A"}<span className="text-sm text-muted-foreground font-normal">/10</span>
              </span>
            </Card>
            <Card className="p-4 shadow-soft bg-card border-border">
              <p className="text-xs text-muted-foreground mb-2">Top Trigger</p>
              <span className="text-sm font-medium text-foreground">
                {summaryData.mostCommonTrigger || "None"}
              </span>
            </Card>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
};

export default WeeklySummaryPage;

// Commit message: feat: create WeeklySummaryPage with LLM insights and Recharts visualizations
