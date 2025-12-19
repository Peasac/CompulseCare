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
          <div className="lg:col-span-1">
            <DailyTargetsWidget />
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

            {/* Pure Factual Metrics - No AI */}
            <div className="space-y-5">
              {/* Avg Anxiety */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                <span className="text-sm text-muted-foreground">Avg Anxiety</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold text-foreground">4.5</span>
                  <span className="text-xs text-muted-foreground">/10</span>
                </div>
              </div>

              {/* Total Compulsions */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                <span className="text-sm text-muted-foreground">Total Compulsions</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold text-foreground">42</span>
                  <span className="text-xs text-success">↓ 30%</span>
                </div>
              </div>

              {/* Pause Sessions */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                <span className="text-sm text-muted-foreground">Pause Sessions</span>
                <span className="text-xl font-semibold text-foreground">10</span>
              </div>
            </div>
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

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-muted/30 rounded-md border border-border">
                <p className="text-xs text-muted-foreground mb-1">Sessions</p>
                <span className="text-lg font-semibold text-foreground">10</span>
              </div>
              <div className="p-3 bg-muted/30 rounded-md border border-border">
                <p className="text-xs text-muted-foreground mb-1">Completion</p>
                <span className="text-lg font-semibold text-foreground">85%</span>
              </div>
              <div className="p-3 bg-muted/30 rounded-md border border-border">
                <p className="text-xs text-muted-foreground mb-1">Avg Anxiety</p>
                <span className="text-lg font-semibold text-foreground">4.5/10</span>
              </div>
              <div className="p-3 bg-muted/30 rounded-md border border-border">
                <p className="text-xs text-muted-foreground mb-1">Journals</p>
                <span className="text-lg font-semibold text-foreground">6</span>
              </div>
            </div>

            {/* AI-Generated Pattern Insight */}
            <div className="p-3 bg-primary/5 rounded-md border border-primary/10">
              <p className="text-sm text-foreground leading-relaxed">
                Compulsions dropped on days you logged more pauses — consistency is helping.
              </p>
            </div>
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

          <div className="space-y-4">
            {/* Current Mood Display - Compact */}
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">😌</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Calm</p>
                    <p className="text-xs text-gray-500">Current mood</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-semibold text-gray-800">7</span>
                  <span className="text-xs text-gray-500">/10</span>
                </div>
              </div>
            </div>

            {/* Weekly Mood Strip - Compact */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">This Week</p>
              <div className="grid grid-cols-7 gap-1.5">
                {[
                  { emoji: "😊", label: "M" },
                  { emoji: "😌", label: "T" },
                  { emoji: "😊", label: "W" },
                  { emoji: "😐", label: "T" },
                  { emoji: "😌", label: "F" },
                  { emoji: "😊", label: "S" },
                  { emoji: "😟", label: "S" },
                ].map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-0.5">
                    <div
                      className={`w-full aspect-square rounded-md flex items-center justify-center text-lg border ${
                        day.emoji === "😊" || day.emoji === "😌"
                          ? "bg-emerald-50 border-emerald-200"
                          : day.emoji === "😐"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-amber-50 border-amber-200"
                      }`}
                    >
                      {day.emoji}
                    </div>
                    <span className="text-xs text-gray-400">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats - Compact */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-muted/20 rounded-md">
                <p className="text-xs text-muted-foreground mb-0.5">Streak</p>
                <p className="text-base font-semibold text-foreground">5d</p>
              </div>
              <div className="text-center p-2 bg-muted/20 rounded-md">
                <p className="text-xs text-muted-foreground mb-0.5">Avg</p>
                <p className="text-base font-semibold text-foreground">6.8</p>
              </div>
              <div className="text-center p-2 bg-muted/20 rounded-md">
                <p className="text-xs text-muted-foreground mb-0.5">Logged</p>
                <p className="text-base font-semibold text-foreground">12</p>
              </div>
            </div>

            {/* Subtle Correlation Hint */}
            <div className="p-2 bg-blue-50/50 rounded-md border border-blue-100">
              <p className="text-xs text-gray-600">
                💡 Higher mood on days with pause sessions
              </p>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
