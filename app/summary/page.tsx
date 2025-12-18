"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import SummaryCard from "@/components/SummaryCard";
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
  const [summaryData, setSummaryData] = useState<WeeklySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeeklySummary();
  }, []);

  const fetchWeeklySummary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/summary?userId=user123");
      
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#2563EB] mx-auto" />
          <p className="text-gray-600">Generating your summary...</p>
        </div>
      </div>
    );
  }

  if (error || !summaryData) {
    return (
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
    );
  }

  return (
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
        {/* LLM-Generated Summary */}
        <Card className="p-6 md:p-8 shadow-soft bg-white border-l-4 border-blue-300 hover-lift">
          <h2 className="text-xl font-medium text-gray-700 mb-4">
            Your Progress This Week
          </h2>
          <p className="text-gray-600 leading-relaxed text-base">
            {summaryData.textSummary}
          </p>
        </Card>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Activity Overview */}
          <Card className="p-6 shadow-soft bg-white border-gray-100 hover-lift">
            <h3 className="text-base font-medium text-gray-700 mb-5">
              Activity Overview
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-lg">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Total compulsions</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-gray-700">
                    {summaryData.totalCompulsions || 0}
                  </span>
                  {summaryData.compulsionChange && summaryData.compulsionChange < 0 && (
                    <span className="text-xs text-emerald-600">
                      ↓ {Math.abs(summaryData.compulsionChange)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-lg">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Avg. time spent</span>
                <span className="text-xl font-semibold text-gray-700">
                  {summaryData.avgTimeSpent || 0} <span className="text-sm text-gray-400 font-normal">min</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-lg">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Most common</span>
                <span className="text-sm font-medium text-gray-700">
                  {summaryData.mostCommonTrigger || "N/A"}
                </span>
              </div>
            </div>
          </Card>

          {/* Insights */}
          <Card className="p-6 shadow-soft bg-white border-gray-100 hover-lift">
            <h3 className="text-base font-medium text-gray-700 mb-5">
              AI Insights
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-lg">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Average mood</span>
                <span className="text-xl font-semibold text-gray-700">
                  {summaryData.moodAverage || "N/A"} <span className="text-sm text-gray-400 font-normal">/10</span>
                </span>
              </div>
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 opacity-70">💡</span>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {summaryData.insights?.[0] || "Keep tracking to get personalized insights."}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section - More subtle */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compulsions Chart */}
          <Card className="p-5 shadow-soft bg-gray-50/30 border-gray-100">
            <h3 className="text-sm font-medium text-gray-600 mb-4 uppercase tracking-wide">
              Daily Compulsions
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={summaryData.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="day" 
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="compulsions" 
                  fill="#3B82F6" 
                  radius={[8, 8, 0, 0]}
                  name="Compulsions"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Time Spent Chart */}
          <Card className="p-5 shadow-soft bg-gray-50/30 border-gray-100">
            <h3 className="text-sm font-medium text-gray-600 mb-4 uppercase tracking-wide">
              Time Spent (minutes)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
            <LineChart data={summaryData.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="day" 
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="timeSpent" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 5 }}
                name="Minutes"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        </div>

        {/* Additional Insights - Full Width */}
        {summaryData.insights && summaryData.insights.length > 1 && (
          <Card className="p-6 shadow-soft bg-white border-gray-100 hover-lift">
            <h3 className="text-sm font-medium text-gray-600 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <span className="opacity-70">💡</span>
              More Insights
            </h3>
            <ul className="space-y-3">
              {summaryData.insights.slice(1).map((insight, index) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-lg">
                  <span className="text-blue-400 text-base mt-0.5">•</span>
                  <p className="text-gray-600 leading-relaxed text-sm">{insight}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </div>
  );
};

export default WeeklySummaryPage;

// Commit message: feat: create WeeklySummaryPage with LLM insights and Recharts visualizations
