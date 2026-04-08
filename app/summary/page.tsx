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
  checkInAverages?: {
    anxiety: number;
    compulsionUrge: number;
    control: number;
    functioning: number;
    sleep: number;
    overallScore: number;
  };
  moodLogsCount?: number;
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
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 bg-card border-b border-border shadow-sm z-10">
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
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 bg-card border-b border-border shadow-sm z-10">
            <div className="container mx-auto px-4 py-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
          </header>
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Card className="p-8 text-center bg-card border-border">
              <p className="text-panic">{error || "No data available"}</p>
              <Button
                onClick={fetchWeeklySummary}
                className="mt-4 bg-primary hover:bg-primary/90 text-background"
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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
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
                  <h1 className="text-xl font-bold text-foreground">Weekly Insights</h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
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
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-medium text-foreground">AI Reflections</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Block 1: Pattern Detected */}
              <Card className="p-6 bg-card shadow-soft border-l-4 border-l-info hover-lift">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-info/20 rounded-lg text-info">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-foreground">Pattern Detected</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {summaryData.insights && summaryData.insights[0] ? summaryData.insights[0] : "You tend to check more frequently during the evening hours."}
                  </p>
                </div>
              </Card>

              {/* Block 2: Weekly Summary */}
              <Card className="p-6 bg-card shadow-soft border-l-4 border-l-success hover-lift">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-success/20 rounded-lg text-success">
                      <Heart className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-foreground">Weekly Summary</h3>
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {(summaryData.checkInAverages || summaryData.moodLogsCount) ? (
                      <p>
                        {summaryData.moodLogsCount && summaryData.moodLogsCount > 0 && (
                          <>You logged your mood <strong>{summaryData.moodLogsCount} time{summaryData.moodLogsCount !== 1 ? 's' : ''}</strong> this week{summaryData.moodAverage > 0 ? <>, averaging <strong>{summaryData.moodAverage}/10</strong></> : ''}. </>
                        )}
                        {summaryData.checkInAverages && summaryData.checkInsCount && summaryData.checkInsCount > 0 ? (
                          <>
                            From {summaryData.checkInsCount} check-in{summaryData.checkInsCount !== 1 ? 's' : ''}, 
                            your anxiety averaged <strong>{summaryData.checkInAverages.anxiety}/10</strong>, 
                            compulsion urges at <strong>{summaryData.checkInAverages.compulsionUrge}/10</strong>, 
                            and you reported <strong>{summaryData.checkInAverages.control}/10</strong> sense of control. 
                            Sleep quality: <strong>{summaryData.checkInAverages.sleep}/10</strong>.
                            {summaryData.checkInAverages.control >= 6 ? " Great self-regulation this week!" : 
                             summaryData.checkInAverages.control >= 4 ? " Keep building on your progress." : 
                             " Consider practicing more coping strategies."}
                          </>
                        ) : (
                          <>Complete daily check-ins to track anxiety, control, and sleep patterns.</>  
                        )}
                      </p>
                    ) : (
                      <p>
                        {summaryData.textSummary || `This week you logged ${summaryData.totalCompulsions} compulsion${summaryData.totalCompulsions !== 1 ? 's' : ''} with "${summaryData.mostCommonTrigger}" as the primary trigger. Start using the mood tracker and daily check-ins to get personalized insights about your emotional patterns.`}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Block 3: Gentle Suggestion */}
              <Card className="p-6 bg-card shadow-soft border-l-4 border-l-primary hover-lift">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-foreground">Suggestion</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {summaryData.insights && summaryData.insights.length > 0 ? summaryData.insights[summaryData.insights.length - 1] : "Try tracking your mood right after a compulsion next time."}
                  </p>
                </div>
              </Card>
            </div>
          </section>

          {/* 2. DATA & TRENDS SECTION */}
          <section className="animate-fade-in delay-100">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-4 h-[1px] bg-border"></span> Trends <span className="w-full h-[1px] bg-border"></span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compulsions Chart */}
              <Card className="p-6 shadow-soft bg-card border-border">
                <h4 className="text-sm font-medium text-foreground mb-6">
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
              <Card className="p-6 shadow-soft bg-card border-border">
                <h4 className="text-sm font-medium text-foreground mb-6">
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
              <Card className="p-4 bg-info/10 border-info/20 border text-center hover:bg-info/20 transition-colors">
                <div className="text-xs text-info font-medium mb-1 uppercase tracking-wide">Total Logs</div>
                <div className="text-3xl font-bold text-info">{summaryData.totalCompulsions}</div>
              </Card>
              <Card className="p-4 bg-primary/10 border-primary/20 border text-center hover:bg-primary/20 transition-colors">
                <div className="text-xs text-primary font-medium mb-1 uppercase tracking-wide">Avg Time</div>
                <div className="text-3xl font-bold text-primary">{summaryData.avgTimeSpent}<span className="text-sm font-normal ml-1">min</span></div>
              </Card>
              <Card className="p-4 bg-warning/10 border-warning/20 border text-center hover:bg-warning/20 transition-colors">
                <div className="text-xs text-warning font-medium mb-1 uppercase tracking-wide">Avg Anxiety</div>
                <div className="text-3xl font-bold text-warning">{summaryData.moodAverage || "-"}<span className="text-sm font-normal ml-1">/10</span></div>
              </Card>
              <Card className="p-4 bg-success/10 border-success/20 border text-center hover:bg-success/20 transition-colors">
                <div className="text-xs text-success font-medium mb-1 uppercase tracking-wide">Check-ins</div>
                <div className="text-3xl font-bold text-success">{summaryData.checkInsCount || 0}</div>
              </Card>
            </div>
          </section>

          {/* 4. DOCUMENT & OCR SECTION */}
          <section className="animate-fade-in delay-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                Bring external context into your journey
              </h3>
            </div>

            {/* Upload Card */}
            <DocumentUploadCard userId={user.id} onUploadSuccess={fetchDocumentAnalysis} />

            {/* Analysis Result */}
            {documentAnalysis && (
              <Card className="mt-6 p-6 shadow-soft bg-gradient-to-br from-info/20 to-card border-info/30 group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 text-info" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-info mb-1">AI Document Summary</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {documentAnalysis}
                    </p>

                    {/* Uploaded Documents List */}
                    {uploadedDocuments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-info/30">
                        <h4 className="text-xs font-medium text-info mb-2">
                          Uploaded Documents ({uploadedDocuments.length})
                        </h4>
                        <div className="space-y-2">
                          {uploadedDocuments.map((doc: any) => (
                            <div key={doc._id || doc.fileName} className="flex items-center justify-between p-2 bg-card rounded border border-info/30">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-foreground">{doc.fileName}</p>
                                  {doc.fileUrl && (
                                    <Button
                                      onClick={() => window.open(doc.fileUrl, '_blank')}
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-6 px-2 text-info hover:text-info/80 hover:bg-info/10"
                                    >
                                      👁️ View
                                    </Button>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(doc.uploadDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {doc.ocrText && (
                                  <Button
                                    onClick={() => setSelectedDoc({ fileName: doc.fileName, ocrText: doc.ocrText, uploadDate: doc.uploadDate })}
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
                                  className="text-xs text-panic hover:text-panic/80 hover:bg-panic/10"
                                >
                                  {deletingDocId === doc._id ? "..." : "Delete"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </section>

        </main>

        {/* OCR Text Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDoc(null)}>
            <div className="bg-card rounded-lg p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Extracted Text (OCR)</h3>
                  <p className="text-xs text-muted-foreground mt-1">{selectedDoc.fileName}</p>
                </div>
                <Button onClick={() => setSelectedDoc(null)} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">✕</Button>
              </div>
              <pre className="text-sm bg-section p-5 rounded-lg whitespace-pre-wrap font-mono leading-relaxed border border-border text-foreground">
                {selectedDoc.ocrText}
              </pre>
              <div className="flex gap-3 mt-5 pt-4 border-t border-border">
                <Button
                  onClick={async () => {
                    const jsPDF = (await import('jspdf')).default;
                    const doc = new jsPDF();
                    
                    // Add title
                    doc.setFontSize(16);
                    doc.setFont(undefined, 'bold');
                    doc.text('OCR Document Extract', 20, 20);
                    
                    // Add metadata
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(100);
                    doc.text(`File: ${selectedDoc.fileName}`, 20, 30);
                    doc.text(`Extracted: ${new Date(selectedDoc.uploadDate).toLocaleDateString()}`, 20, 36);
                    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 42);
                    
                    // Add divider
                    doc.setDrawColor(200);
                    doc.line(20, 48, 190, 48);
                    
                    // Add OCR text with proper wrapping
                    doc.setFontSize(11);
                    doc.setTextColor(0);
                    const splitText = doc.splitTextToSize(selectedDoc.ocrText, 170);
                    doc.text(splitText, 20, 56);
                    
                    // Save PDF
                    const fileName = selectedDoc.fileName.replace(/\.[^/.]+$/, '') + '_OCR.pdf';
                    doc.save(fileName);
                    
                    toast({
                      title: "PDF generated",
                      description: "OCR text exported as PDF",
                    });
                  }}
                  variant="default"
                  size="sm"
                  className="bg-primary"
                >
                  📄 Export as PDF
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedDoc.ocrText);
                    toast({
                      title: "Copied to clipboard",
                      description: "OCR text copied successfully",
                    });
                  }}
                  variant="outline"
                  size="sm"
                >
                  📋 Copy Text
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default WeeklySummaryPage;

// Commit message: feat: create WeeklySummaryPage with LLM insights and Recharts visualizations
