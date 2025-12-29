"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SummarySkeleton } from "@/components/LoadingSkeletons";
import Navigation from "@/components/Navigation";
import SummaryCard from "@/components/SummaryCard";
import DocumentUploadCard from "@/components/DocumentUploadCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Loader2, Download, Calendar, Sparkles, Lightbulb, Heart, FileText } from "lucide-react";
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
  checkInsCount?: number;
  panicEpisodesCount?: number;
}

/**
 * WeeklySummaryPage - LLM-generated insights and analytics
 * Mobile-first design with charts using Recharts
 * Features: textual summary, trends, visualizations
 */
const WeeklySummaryPage = () => {
  const router = useRouter();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [summaryData, setSummaryData] = useState<WeeklySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentAnalysis, setDocumentAnalysis] = useState<string | null>(null);
  const [loadingDocAnalysis, setLoadingDocAnalysis] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<{ fileName: string, ocrText: string, uploadDate: string } | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  console.log('[Summary] Page loaded, user:', user?.id, 'isLoading:', isLoading);

  useEffect(() => {
    console.log('[Summary] useEffect triggered, user:', user?.id);
    if (user) {
      fetchWeeklySummary();
      fetchDocumentAnalysis();
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

  const fetchDocumentAnalysis = async () => {
    if (!user) return;

    setLoadingDocAnalysis(true);

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/documents/analyze?userId=${user.id}`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setDocumentAnalysis(data.analysis);
        setUploadedDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Document analysis error:", err);
      setDocumentAnalysis("Unable to analyze documents at this time.");
    } finally {
      setLoadingDocAnalysis(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setDeletingDocId(docId);
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
        headers,
      });

      if (response.ok) {
        toast({
          title: "Document deleted",
          description: "The document has been removed",
        });
        // Refresh documents list
        await fetchDocumentAnalysis();
      } else {
        toast({
          title: "Delete failed",
          description: "Failed to delete document",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Delete document error:", err);
      toast({
        title: "Error",
        description: "Error deleting document",
        variant: "destructive",
      });
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleExport = async () => {
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/export?userId=${user?.id}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      // Get filename from header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/i);
      const filename = filenameMatch?.[1] || `compulsecare-report-${new Date().toISOString().split('T')[0]}.txt`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: "Your report has been downloaded",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#F5F6FA]">
          <header className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10">
            <div className="container mx-auto px-4 py-4 max-w-6xl">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="text-xs text-muted-foreground animate-pulse">
                  Analyzing patterns...
                </div>
              </div>
            </div>
          </header>
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <SummarySkeleton />
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

          {/* 1. AI WEEKLY INSIGHTS - 3 Block Focus */}
          <section className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-medium text-gray-800">AI Reflections</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Block 1: Pattern Detected */}
              <Card className="p-6 bg-white shadow-soft border-l-4 border-l-blue-400 hover-lift">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Pattern Detected</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">
                    {summaryData.insights && summaryData.insights[0] ? summaryData.insights[0] : "You tend to check more frequently during the evening hours."}
                  </p>
                </div>
              </Card>

              {/* Block 2: What Helped */}
              <Card className="p-6 bg-white shadow-soft border-l-4 border-l-green-400 hover-lift">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                      <Heart className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-800">What Helped</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">
                    {summaryData.textSummary ? summaryData.textSummary.split('.')[0] + '.' : "Taking deep breaths before acting seemed to reduce anxiety intensity."}
                  </p>
                </div>
              </Card>

              {/* Block 3: Gentle Suggestion */}
              <Card className="p-6 bg-white shadow-soft border-l-4 border-l-purple-400 hover-lift">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Suggestion</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">
                    {summaryData.insights && summaryData.insights.length > 0 ? summaryData.insights[summaryData.insights.length - 1] : "Try tracking your mood right after a compulsion next time."}
                  </p>
                </div>
              </Card>
            </div>
          </section>

          {/* 2. DATA & TRENDS SECTION */}
          <section className="animate-fade-in delay-100">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-4 h-[1px] bg-gray-300"></span> Trends <span className="w-full h-[1px] bg-gray-200"></span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compulsions Chart */}
              <Card className="p-6 shadow-soft bg-white border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-6">
                  Daily Log Frequency
                </h4>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summaryData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="day"
                        stroke="#9CA3AF"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar
                        dataKey="compulsions"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        barSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Time Spent Chart */}
              <Card className="p-6 shadow-soft bg-white border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-6">
                  Total Time Spent (min)
                </h4>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={summaryData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="day"
                        stroke="#9CA3AF"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="timeSpent"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        dot={{ fill: '#10B981', r: 4, strokeWidth: 2, stroke: '#FFFFFF' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </section>

          {/* 3. KEY METRICS CARDS */}
          <section className="animate-fade-in delay-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-blue-50/50 border-blue-100 border text-center hover:bg-blue-50 transition-colors">
                <div className="text-xs text-blue-600 font-medium mb-1 uppercase tracking-wide">Total Logs</div>
                <div className="text-3xl font-bold text-blue-900">{summaryData.totalCompulsions}</div>
              </Card>
              <Card className="p-4 bg-purple-50/50 border-purple-100 border text-center hover:bg-purple-50 transition-colors">
                <div className="text-xs text-purple-600 font-medium mb-1 uppercase tracking-wide">Avg Time</div>
                <div className="text-3xl font-bold text-purple-900">{summaryData.avgTimeSpent}<span className="text-sm font-normal ml-1">min</span></div>
              </Card>
              <Card className="p-4 bg-orange-50/50 border-orange-100 border text-center hover:bg-orange-50 transition-colors">
                <div className="text-xs text-orange-600 font-medium mb-1 uppercase tracking-wide">Avg Anxiety</div>
                <div className="text-3xl font-bold text-orange-900">{summaryData.moodAverage || "-"}<span className="text-sm font-normal ml-1">/10</span></div>
              </Card>
              <Card className="p-4 bg-green-50/50 border-green-100 border text-center hover:bg-green-50 transition-colors">
                <div className="text-xs text-green-600 font-medium mb-1 uppercase tracking-wide">Check-ins</div>
                <div className="text-3xl font-bold text-green-900">{summaryData.checkInsCount || 0}</div>
              </Card>
            </div>
          </section>

          {/* 4. DOCUMENT & OCR SECTION */}
          <section className="animate-fade-in delay-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Bring external context into your journey
              </h3>
            </div>

            {/* Upload Card */}
            <DocumentUploadCard userId={user.id} onUploadSuccess={fetchDocumentAnalysis} />

            {/* Analysis Result */}
            {documentAnalysis && (
              <Card className="mt-6 p-6 shadow-soft bg-gradient-to-br from-indigo-50/50 to-white border-indigo-100 group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-indigo-900 mb-1">AI Document Summary</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {documentAnalysis}
                    </p>

                    {/* Uploaded Files Pills */}
                    {uploadedDocuments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-indigo-100/50">
                        {uploadedDocuments.map((doc: any) => (
                          <div key={doc._id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-indigo-100 shadow-sm text-xs text-gray-600">
                            <span>📄 {doc.fileName}</span>
                            <button onClick={() => handleDeleteDocument(doc._id)} className="text-gray-400 hover:text-red-500 ml-1">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </section>

        </main>
      </div>
    </ProtectedRoute>
  );
};

export default WeeklySummaryPage;

// Commit message: feat: create WeeklySummaryPage with LLM insights and Recharts visualizations
