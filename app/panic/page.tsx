"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BreathingAnimation from "@/components/BreathingAnimation";
import { X, FileText, RotateCcw, Loader2, AlertCircle } from "lucide-react";

interface LLMResponse {
  message: string;
  suggestions: string[];
}

/**
 * PanicModePage - Full-screen panic support overlay
 * Features: breathing exercise, LLM supportive message, quick actions
 * Mobile-first design with calm UX optimized for OCD users
 * Low cognitive load, fast and accessible
 */
const PanicModePage = () => {
  const router = useRouter();
  const [stage, setStage] = useState<"breathing" | "support">("breathing");
  const [llmResponse, setLlmResponse] = useState<LLMResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breathCount, setBreathCount] = useState(0);

  // Auto-transition to support after breathing (or user can skip)
  useEffect(() => {
    if (stage === "breathing" && breathCount === 0) {
      const timer = setTimeout(() => {
        fetchLLMSupport();
        setBreathCount(1);
      }, 12000); // 2 breath cycles (6s each)
      
      return () => clearTimeout(timer);
    }
  }, [stage, breathCount]);

  // Prevent body scroll when overlay is active
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const fetchLLMSupport = async () => {
    setLoading(true);
    setError(null);
    setStage("support");
    
    try {
      // TODO: Connect to real API endpoint with user context
      const response = await fetch("/api/panic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user123", // TODO: Get from auth context
          triggerType: "panic_button",
          context: "User activated panic mode",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get support");
      }

      const data = await response.json();
      setLlmResponse(data);
    } catch (err) {
      setError("Unable to load support message. Please try again.");
      console.error("Panic API error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.push("/");
  };

  const handleLogTrigger = () => {
    // Navigate to journal page with panic context
    router.push("/journal?from=panic");
  };

  const handleDoAnotherBreath = () => {
    setStage("breathing");
    setBreathCount((prev) => prev + 1);
    
    // Auto-fetch support after this breath cycle
    setTimeout(() => {
      if (stage === "breathing") {
        setStage("support");
      }
    }, 12000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#FFF5F5] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="panic-mode-title"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 id="panic-mode-title" className="text-xl font-semibold text-gray-800">
            You're Safe
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            aria-label="Close panic mode"
            className="hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Breathing Stage */}
        {stage === "breathing" && (
          <div className="space-y-6 animate-fadeIn">
            <Card className="p-6 md:p-8 shadow-lg bg-white">
              <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-4">
                Let's breathe together
              </h2>
              <p className="text-center text-gray-600 mb-8">
                Take a moment. You're doing great.
              </p>
              
              <BreathingAnimation />
              
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={fetchLLMSupport}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3"
                >
                  I'm ready to continue
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2563EB] border-t-transparent" />
            <p className="text-gray-600">Getting support for you...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">Connection Issue</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <Button
                  onClick={fetchLLMSupport}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Support Stage with LLM Response */}
        {stage === "support" && llmResponse && (
          <div className="space-y-6 animate-fadeIn">
            {/* LLM Message Card */}
            <Card className="p-6 md:p-8 shadow-lg bg-white">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                Here for you
              </h2>
              <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                {llmResponse.message}
              </p>
            </Card>

            {/* Suggestions */}
            {llmResponse.suggestions.length > 0 && (
              <Card className="p-6 shadow-md">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Things you can try:
                </h3>
                <ul className="space-y-2">
                  {llmResponse.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <span className="text-[#06B6D4] mt-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Quick Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleLogTrigger}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white h-14 flex items-center justify-center gap-3 text-base"
              >
                <FileText className="w-5 h-5" />
                <span>Log This Trigger</span>
              </Button>
              
              <Button
                onClick={handleDoAnotherBreath}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white h-14 flex items-center justify-center gap-3 text-base"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Do Another Breath</span>
              </Button>

              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 h-14 text-base"
              >
                Exit to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* TODO: Add focus trap library */}
      {/* npm install focus-trap-react */}
      {/* Wrap content in <FocusTrap> component */}
    </div>
  );
};

export default PanicModePage;

// Commit message: feat: create full-screen PanicModePage with breathing exercise and LLM support integration
