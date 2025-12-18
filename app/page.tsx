"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompulsionLoggerWidget from "@/components/CompulsionLoggerWidget";
import DailyTargetsWidget from "@/components/DailyTargetsWidget";

/**
 * DashboardPage - Main landing page with centered Pause & Breathe button
 * 3-column layout: Compulsion Logger | PAUSE Button | Daily Targets
 * Analytics, Summary, and Mood sections below
 */
export default function DashboardPage() {
  const router = useRouter();
  const [userName] = useState("Ayaan"); // TODO: Get from auth context

  const handlePauseClick = () => {
    router.push("/panic");
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      {/* Header */}
      <Header userName={userName} showExport={true} />

      {/* Main Content - 3 Column Layout with Large Center Button */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column - Compulsion Logger */}
          <div className="lg:col-span-1">
            <CompulsionLoggerWidget />
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
                  <div className="mb-6">
                    <svg className="w-16 h-16 text-pink-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-semibold text-pink-800 mb-2">
                    Panic
                  </h2>
                  <p className="text-pink-700/80 text-center text-sm md:text-base">
                    I need help now
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Right Column - Daily Targets */}
          <div className="lg:col-span-1">
            <DailyTargetsWidget />
          </div>
        </div>

        {/* Analytics + Weekly Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Analytics Card */}
          <Card className="p-6 bg-white shadow-soft border-gray-100 hover-lift">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-xl opacity-60">📊</span>
                <h3 className="font-medium text-base text-gray-700">Your Progress</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/summary")}
                className="text-gray-500 hover:text-gray-700 text-xs"
              >
                Details →
              </Button>
            </div>

            {/* Anxiety Level Trends Chart */}
            <div className="mb-8">
              <h4 className="text-xs font-medium text-gray-500 mb-4 uppercase tracking-wide">
                Anxiety Levels
              </h4>
              <div className="h-40 flex items-end justify-between gap-3">
                {[
                  { day: "Mon", value: 8 },
                  { day: "Tue", value: 5 },
                  { day: "Wed", value: 6 },
                  { day: "Thu", value: 4 },
                  { day: "Fri", value: 3 },
                  { day: "Sat", value: 4 },
                  { day: "Sun", value: 5 },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center group">
                    <div
                      className="w-full bg-blue-200 group-hover:bg-blue-300 rounded-t transition-calm"
                      style={{ height: `${item.value * 10}%` }}
                    />
                    <span className="text-xs text-gray-400 mt-2">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pause Sessions Chart */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-4 uppercase tracking-wide">
                Pause Sessions
              </h4>
              <div className="h-40 flex items-end justify-between gap-3">
                {[3, 2, 1, 2, 1, 0, 1].map((value, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center group">
                    <div
                      className="w-full bg-emerald-200 group-hover:bg-emerald-300 rounded-t transition-calm"
                      style={{ height: `${value * 33}%` }}
                    />
                    <span className="text-xs text-gray-400 mt-2">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Weekly Summary Card */}
          <Card className="p-6 bg-white shadow-soft border-gray-100 hover-lift">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-xl opacity-60">📅</span>
                <h3 className="font-medium text-base text-gray-700">This Week</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/summary")}
                className="text-gray-500 hover:text-gray-700 text-xs"
              >
                Details →
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 mb-1.5">Pause Sessions</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-gray-800">10</span>
                  <span className="text-xs text-emerald-600 flex items-center">
                    ↓ 30%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 mb-1.5">Journal Entries</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-gray-800">6</span>
                  <span className="text-xs text-emerald-600 flex items-center">
                    ↑ 20%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 mb-1.5">Target Completion</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-gray-800">85%</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 mb-1.5">Avg Anxiety</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-gray-800">4.5/10</span>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-base opacity-70">💡</span>
                <h4 className="font-medium text-sm text-gray-700">Insights</h4>
              </div>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>
                    You reduced checking compulsions by 30% this week—great progress!
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>
                    Your anxiety spikes correlate with evening hours. Consider a
                    wind-down routine.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>
                    Mood improved on days when you completed exposure targets.
                  </span>
                </li>
              </ul>
            </div>

            {/* Common Triggers */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
                Common Triggers
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-gray-50 text-gray-600 border border-gray-200">
                  Organizing
                </Badge>
                <Badge variant="secondary" className="bg-gray-50 text-gray-600 border border-gray-200">
                  Social Events
                </Badge>
                <Badge variant="secondary" className="bg-gray-50 text-gray-600 border border-gray-200">
                  Work Stress
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Mood Tracker Section */}
        <Card className="p-6 bg-white shadow-soft border-gray-100 mt-8 hover-lift">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xl opacity-60">😊</span>
              <h3 className="font-medium text-base text-gray-700">How Are You Feeling?</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push("/mood")}
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              Details →
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Mood Input */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-5 uppercase tracking-wide">
                Right Now
              </h4>
              <div className="flex justify-center gap-3 mb-6">
                {["😢", "😟", "😐", "🙂", "😊"].map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => router.push("/mood")}
                    className="w-12 h-12 rounded-full bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-calm flex items-center justify-center text-2xl"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <Button 
                onClick={() => router.push("/mood")}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white transition-calm"
              >
                Log Mood
              </Button>
            </div>

            {/* Right: This Week's Mood */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-5 uppercase tracking-wide">
                This Week
              </h4>
              <div className="grid grid-cols-7 gap-2 mb-6">
                {[
                  "😊",
                  "😊",
                  "😊",
                  "😊",
                  "😊",
                  "😐",
                  "😟",
                ].map((emoji, idx) => (
                  <div
                    key={idx}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xl border ${
                      emoji === "😊"
                        ? "bg-emerald-50 border-emerald-200"
                        : emoji === "😐"
                        ? "bg-blue-50 border-blue-200"
                        : "bg-pink-50 border-pink-200"
                    }`}
                  >
                    {emoji}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-lg">
                  <span className="text-xs text-gray-500">Average Mood</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base">😊</span>
                    <span className="font-medium text-gray-700 text-sm">Calm</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-lg">
                  <span className="text-xs text-gray-500">Most Frequent</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base">😐</span>
                    <span className="font-medium text-gray-700 text-sm">Neutral</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-lg">
                  <span className="text-xs text-gray-500">Current Streak</span>
                  <span className="font-medium text-gray-700 text-sm">5 days</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
