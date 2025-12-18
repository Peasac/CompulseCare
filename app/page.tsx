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

          {/* Center Column - LARGE PANIC Button */}
          <div className="lg:col-span-1 flex flex-col items-center justify-start">
            <div className="sticky top-8 w-full max-w-md">
              <button
                onClick={handlePauseClick}
                className="relative w-full aspect-square max-w-[400px] mx-auto rounded-full bg-gradient-to-br from-pink-400 via-rose-400 to-red-400 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-300 group animate-pulse"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-300 to-red-300 blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
                  <div className="mb-4">
                    <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
                    PANIC
                  </h2>
                  <p className="text-white/90 text-center text-sm md:text-base font-medium">
                    Tap for help
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
          <Card className="p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <h3 className="font-semibold text-lg">Analytics</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/summary")}
                className="text-blue-600 hover:text-blue-700"
              >
                View more →
              </Button>
            </div>

            {/* Anxiety Level Trends Chart */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Anxiety Level Trends
              </h4>
              <div className="h-48 flex items-end justify-between gap-2">
                {[
                  { day: "Mon", value: 8 },
                  { day: "Tue", value: 5 },
                  { day: "Wed", value: 6 },
                  { day: "Thu", value: 4 },
                  { day: "Fri", value: 3 },
                  { day: "Sat", value: 4 },
                  { day: "Sun", value: 5 },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-400 rounded-t"
                      style={{ height: `${item.value * 10}%` }}
                    />
                    <span className="text-xs text-gray-600 mt-2">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panic Episodes Chart */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Pause Sessions
              </h4>
              <div className="h-48 flex items-end justify-between gap-2">
                {[3, 2, 1, 2, 1, 0, 1].map((value, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-teal-400 rounded-t"
                      style={{ height: `${value * 33}%` }}
                    />
                    <span className="text-xs text-gray-600 mt-2">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Weekly Summary Card */}
          <Card className="p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <h3 className="font-semibold text-lg">Weekly Summary</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/summary")}
                className="text-blue-600 hover:text-blue-700"
              >
                View more →
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Pause Sessions</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">10</span>
                  <span className="text-xs text-green-600 flex items-center">
                    ↓ 30%
                  </span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Journal Entries</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">6</span>
                  <span className="text-xs text-green-600 flex items-center">
                    ↑ 20%
                  </span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Target Completion</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">85%</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Avg Anxiety</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">4.5/10</span>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-lg">💡</span>
                <h4 className="font-semibold text-sm">Insights</h4>
              </div>
              <ul className="space-y-2 text-xs text-gray-700">
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
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Common Triggers
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-gray-100">
                  Organizing
                </Badge>
                <Badge variant="secondary" className="bg-gray-100">
                  Social Events
                </Badge>
                <Badge variant="secondary" className="bg-gray-100">
                  Work Stress
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Mood Tracker Section */}
        <Card className="p-6 bg-white shadow-sm mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-lg">😊</span>
              <h3 className="font-semibold text-lg">Mood Tracker</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push("/mood")}
              className="text-blue-600 hover:text-blue-700"
            >
              View more →
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Mood Input */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">
                How are you feeling right now?
              </h4>
              <div className="flex justify-center gap-4 mb-6">
                {["😢", "😟", "😐", "🙂", "😊"].map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => router.push("/mood")}
                    className="w-14 h-14 rounded-full bg-gray-100 hover:bg-blue-100 transition-colors flex items-center justify-center text-2xl"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <Button 
                onClick={() => router.push("/mood")}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                Log Mood
              </Button>
            </div>

            {/* Right: This Week's Mood */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">
                This Week's Mood
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
                    className={`aspect-square rounded-lg flex items-center justify-center text-2xl ${
                      emoji === "😊"
                        ? "bg-green-100"
                        : emoji === "😐"
                        ? "bg-blue-100"
                        : "bg-pink-100"
                    }`}
                  >
                    {emoji}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">Average Mood</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">😊</span>
                    <span className="font-semibold text-blue-600">Calm</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">Most Frequent</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">😐</span>
                    <span className="font-semibold text-blue-600">Neutral</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">Current Streak</span>
                  <span className="font-semibold text-gray-800">5 days</span>
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
