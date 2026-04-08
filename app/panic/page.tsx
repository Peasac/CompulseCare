"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BreathingAnimation from "@/components/BreathingAnimation";
import { X, FileText, RotateCcw, Loader2 } from "lucide-react";

interface LLMResponse {
  message: string;
}

/**
 * PanicModePage - Full-screen panic support overlay
 * Features: breathing exercise, LLM supportive message, quick actions
 * Mobile-first design with calm UX optimized for OCD users
 * Low cognitive load, fast and accessible
 */
const PanicModePage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [stage, setStage] = useState<"breathing" | "support">("breathing");
  const [llmResponse, setLlmResponse] = useState<LLMResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breathCount, setBreathCount] = useState(0);
  
  // Reflection state
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionResponse, setReflectionResponse] = useState<string | null>(null);
  const [reflectionLoading, setReflectionLoading] = useState(false);
  
  // External support modal
  const [showSupportModal, setShowSupportModal] = useState(false);

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
          userId: user.id, // TODO: Get from auth context
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
    setReflectionText("");
    setReflectionResponse(null);
    setShowReflection(false);
    
    // Auto-fetch support after this breath cycle
    setTimeout(() => {
      if (stage === "breathing") {
        setStage("support");
      }
    }, 12000);
  };

  const handleReflectionSubmit = async () => {
    if (!reflectionText.trim()) return;
    
    setReflectionLoading(true);
    try {
      const response = await fetch("/api/panic/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          reflection: reflectionText,
        }),
      });

      if (!response.ok) throw new Error("Failed to get reflection");

      const data = await response.json();
      
      // Show response after short delay for calm transition
      setTimeout(() => {
        setReflectionResponse(data.reflection);
      }, 400);
    } catch (err) {
      console.error("Reflection API error:", err);
      setReflectionResponse("Thank you for sharing. That took courage.");
    } finally {
      setReflectionLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-panic/20 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="panic-mode-title"
    >
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center">
            <h1 id="panic-mode-title" className="text-lg font-medium text-foreground">
              You're safe
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Let's slow things down together
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Breathing Stage */}
        {stage === "breathing" && (
          <div className="space-y-6 animate-fadeIn">
            <Card className="p-8 md:p-12 shadow-soft bg-card border-border">
              <BreathingAnimation />
              
              <p className="text-center text-muted-foreground mt-8 text-sm">
                Follow the circle. In as it grows, out as it shrinks.
              </p>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 border-border bg-muted">
            <p className="text-sm text-muted-foreground text-center">
              {error}
            </p>
          </Card>
        )}

        {/* Support Stage with LLM Response */}
        {stage === "support" && llmResponse && (
          <div className="space-y-8 animate-fadeIn">
            {/* LLM Reassurance Message */}
            <Card className="p-6 md:p-8 shadow-soft bg-card border-border">
              <p className="text-foreground leading-relaxed text-base text-center">
                {llmResponse.message}
              </p>
            </Card>

            {/* Optional Grounding Prompts - NOT tasks */}
            <Card className="p-5 shadow-soft bg-muted/50 border-border">
              <p className="text-xs text-muted-foreground mb-4 text-center">
                If your mind still feels busy, you could gently try one of these:
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="text-center">Notice 3 things you can see around you</p>
                <p className="text-center">Feel your feet resting on the floor</p>
                <p className="text-center">Notice one sound nearby</p>
                <p className="text-center">Gently unclench your jaw and shoulders</p>
              </div>
            </Card>

            {/* LLM Reflection - Optional */}
            <Card className="p-5 shadow-soft bg-card border-border">
              <button
                onClick={() => setShowReflection(!showReflection)}
                className="w-full text-left flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-calm"
              >
                <span>Put the moment into words (optional)</span>
                <span className="text-xs">{showReflection ? '−' : '+'}</span>
              </button>
              
              {showReflection && (
                <div className="mt-4 space-y-3 animate-fadeIn">
                  <textarea
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder="You can write what just happened. This isn't advice — just a space to offload."
                    className="w-full min-h-[100px] p-3 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-calm"
                    disabled={reflectionLoading}
                  />
                  
                  <Button
                    onClick={handleReflectionSubmit}
                    disabled={!reflectionText.trim() || reflectionLoading}
                    className="w-full bg-muted hover:bg-muted/80 text-foreground h-10 text-sm transition-calm"
                  >
                    {reflectionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Reflect"
                    )}
                  </Button>
                  
                  {reflectionResponse && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-md animate-fadeIn">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {reflectionResponse}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Clear Hierarchy: ONE primary action */}
            <div className="space-y-4 pt-4">
              {/* PRIMARY: Do another breath */}
              <Button
                onClick={handleDoAnotherBreath}
                className="w-full bg-primary hover:bg-primary/90 text-background h-16 text-lg font-medium shadow-soft transition-calm"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Breathe again
              </Button>
              
              {/* SECONDARY: Log trigger (quieter) */}
              <Button
                onClick={handleLogTrigger}
                variant="outline"
                className="w-full border-border text-muted-foreground hover:bg-muted h-12 text-sm transition-calm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Log this moment
              </Button>

              {/* External support placeholder */}
              <button
                onClick={() => setShowSupportModal(true)}
                className="w-full text-muted-foreground/60 hover:text-muted-foreground text-xs py-2 transition-calm"
              >
                External support (coming soon)
              </button>

              {/* TERTIARY: Exit (text-only style) */}
              <button
                onClick={handleClose}
                className="w-full text-muted-foreground hover:text-foreground text-xs py-2 transition-calm"
              >
                Return to dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* External Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-md p-6 shadow-soft-lg bg-card border-border">
            <h3 className="text-lg font-medium text-foreground mb-3">
              External support
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              This feature is a placeholder in this prototype. In a full version, this could help users reach trusted contacts or professionals.
            </p>
            <Button
              onClick={() => setShowSupportModal(false)}
              className="w-full bg-muted hover:bg-muted/80 text-foreground transition-calm"
            >
              Close
            </Button>
          </Card>
        </div>
      )}

      {/* TODO: Add focus trap library */}
      {/* npm install focus-trap-react */}
      {/* Wrap content in <FocusTrap> component */}
    </div>
  );
};

export default PanicModePage;

// Commit message: feat: create full-screen PanicModePage with breathing exercise and LLM support integration
