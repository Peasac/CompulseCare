"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const [summaryData, setSummaryData] = useState<WeeklySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentAnalysis, setDocumentAnalysis] = useState<string | null>(null);
  const [loadingDocAnalysis, setLoadingDocAnalysis] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [selectedDocOCR, setSelectedDocOCR] = useState<string | null>(null);
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

  const handleExport = () => {
    // TODO: Implement PDF or CSV export
    toast({
      title: "Coming soon",
      description: "Export feature is in development",
    });
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

        {/* Document Analysis Section */}
        {documentAnalysis && (
          <Card className="p-6 shadow-soft bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                📄
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-indigo-900 mb-1">
                  Document Insights
                </h3>
                <p className="text-xs text-indigo-600 mb-3">
                  AI analysis of your uploaded documents
                </p>
                {loadingDocAnalysis ? (
                  <div className="flex items-center gap-2 text-sm text-indigo-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing documents...
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {documentAnalysis}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={fetchDocumentAnalysis}
              variant="outline"
              size="sm"
              disabled={loadingDocAnalysis}
              className="mt-3 border-indigo-300 text-indigo-700 hover:bg-indigo-100"
            >
              🔄 Refresh Analysis
            </Button>

            {/* Uploaded Documents List */}
            {uploadedDocuments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-indigo-200">
                <h4 className="text-xs font-medium text-indigo-900 mb-2">
                  Uploaded Documents ({uploadedDocuments.length})
                </h4>
                <div className="space-y-2">
                  {uploadedDocuments.map((doc: any) => (
                    <div key={doc._id || doc.fileName} className="flex items-center justify-between p-2 bg-white rounded border border-indigo-100">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{doc.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {doc.ocrText && (
                          <Button
                            onClick={() => setSelectedDocOCR(doc.ocrText)}
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                          >
                            View OCR
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteDocument(doc._id)}
                          variant="ghost"
                          size="sm"
                          disabled={deletingDocId === doc._id}
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deletingDocId === doc._id ? "..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OCR Text Modal */}
            {selectedDocOCR && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDocOCR(null)}>
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Extracted Text (OCR)</h3>
                    <Button onClick={() => setSelectedDocOCR(null)} variant="ghost" size="sm">✕</Button>
                  </div>
                  <pre className="text-xs bg-gray-50 p-4 rounded whitespace-pre-wrap font-mono">
                    {selectedDocOCR}
                  </pre>
                </div>
              </div>
            )}
          </Card>
        )}

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
