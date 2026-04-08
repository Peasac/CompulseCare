"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, TrendingUp, Minus, Calendar, StickyNote, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import CheckInModal from "@/components/CheckInModal";

interface CheckInResponse {
  question: string;
  response: number;
  category: string;
}

interface CheckIn {
  id: string;
  userId: string;
  responses: CheckInResponse[];
  totalScore: number;
  notes: string;
  createdAt: string;
}

/**
 * CheckInHistoryPage - View check-in history with LLM-generated reflection
 * Shows all past check-ins with scores, notes, and AI trend analysis
 */
export default function CheckInHistoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [reflection, setReflection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingReflection, setLoadingReflection] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchCheckIns();
    }
  }, [user]);

  const fetchCheckIns = async (includeReflection = true) => {
    if (!user) return;

    setIsLoading(true);
    if (includeReflection) {
      setLoadingReflection(true);
    }

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const url = `/api/checkin?userId=${user.id}&limit=30${includeReflection ? "&withReflection=true" : ""}`;
      const response = await fetch(url, { headers });

      if (response.ok) {
        const data = await response.json();
        setCheckIns(data.checkIns || []);
        if (includeReflection && data.reflection) {
          setReflection(data.reflection);
        }
      } else {
        throw new Error("Failed to fetch check-ins");
      }
    } catch (error) {
      console.error("Failed to fetch check-ins:", error);
      setCheckIns([]);
    } finally {
      setIsLoading(false);
      setLoadingReflection(false);
    }
  };

  const getScoreColor = (score: number, maxScore = 50) => {
    const percentage = (score / maxScore) * 100;
    if (percentage < 30) return "text-success";
    if (percentage < 60) return "text-warning";
    return "text-panic";
  };

  const getTrendIcon = () => {
    if (checkIns.length < 2) return <Minus className="h-5 w-5" />;
    const recent = checkIns.slice(0, 5).reduce((sum, c) => sum + c.totalScore, 0) / Math.min(5, checkIns.length);
    const older = checkIns.slice(5).reduce((sum, c) => sum + c.totalScore, 0) / checkIns.slice(5).length;

    if (recent > older) return <TrendingUp className="h-5 w-5 text-panic" />;
    if (recent < older) return <TrendingDown className="h-5 w-5 text-success" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };

  const getAverageScore = () => {
    if (checkIns.length === 0) return 0;
    const total = checkIns.reduce((sum, c) => sum + c.totalScore, 0);
    return (total / checkIns.length).toFixed(1);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Check-In History</h1>
              <p className="text-sm text-muted-foreground">
                {checkIns.length} check-ins recorded
              </p>
            </div>
            <CheckInModal userId={user.id} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className={`text-3xl ${getScoreColor(Number(getAverageScore()))}`}>
                {getAverageScore()} / 50
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Trend</CardDescription>
              <div className="flex items-center gap-2 pt-2">
                {getTrendIcon()}
                <span className="text-sm text-muted-foreground">
                  {checkIns.length < 2 ? "Need more data" : checkIns.slice(0, 5).reduce((sum, c) => sum + c.totalScore, 0) / Math.min(5, checkIns.length) < checkIns.slice(5).reduce((sum, c) => sum + c.totalScore, 0) / checkIns.slice(5).length ? "Improving" : "Higher"}
                </span>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* AI Reflection */}
        {checkIns.length >= 2 && (
          <Card className="border-info/30 bg-info/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-info" />
                <CardTitle className="text-lg">AI Trend Analysis</CardTitle>
              </div>
              <CardDescription>
                LLM-generated reflection based on your check-in patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingReflection ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing trends...</span>
                </div>
              ) : reflection ? (
                <p className="text-sm text-foreground leading-relaxed">{reflection}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No reflection available. Try refreshing the page.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Check-In List */}
        <div className="space-y-4">
          {checkIns.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">No check-ins yet. Start tracking your progress!</p>
                <CheckInModal userId={user.id} />
              </CardContent>
            </Card>
          ) : (
            checkIns.map((checkIn, index) => (
              <Card key={checkIn.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">
                        {new Date(checkIn.createdAt).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {formatDistanceToNow(new Date(checkIn.createdAt), { addSuffix: true })}
                      </Badge>
                    </div>
                    <div className={`text-xl font-bold ${getScoreColor(checkIn.totalScore)}`}>
                      {checkIn.totalScore} / {checkIn.responses.length * 10}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Individual Responses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {checkIn.responses.map((response, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground capitalize">
                            {response.category}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-section rounded-full overflow-hidden">
                              <div
                                className={`h-full ${response.response <= 3
                                    ? "bg-success"
                                    : response.response <= 6
                                      ? "bg-warning"
                                      : "bg-panic"
                                  }`}
                                style={{ width: `${(response.response / 10) * 100}%` }}
                              />
                            </div>
                            <span className="font-medium w-8 text-right">
                              {response.response}/10
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    {checkIn.notes && (
                      <div className="flex gap-2 mt-3 p-3 bg-containerBg rounded-lg">
                        <StickyNote className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">{checkIn.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Info Card */}
        {checkIns.length < 2 && checkIns.length > 0 && (
          <Card className="border-warning/30 bg-warning/10">
            <CardContent className="pt-6">
              <p className="text-sm text-warning">
                <strong>💡 Tip:</strong> Complete at least 2 check-ins to unlock AI trend analysis and personalized reflections!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
