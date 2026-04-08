"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Calendar,
  Clock,
  Trash2,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CompulsionLog {
  id: string;
  activity: string;
  category: string;
  timeSpent: number; // in minutes
  timestamp: string;
  notes?: string;
}

/**
 * LoggerPage - Full table view of all compulsion logs
 * Features: Search, filter, analytics, export
 */
const LoggerPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [logs, setLogs] = useState<CompulsionLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<CompulsionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [dateRange, setDateRange] = useState<string>("7days");

  const CATEGORIES = ["All", "Checking", "Cleaning", "Organizing", "Counting", "Other"];

  useEffect(() => {
    if (!authLoading && user) {
      fetchLogs();
    } else if (!authLoading && !user) {
      // User not logged in, redirect to login
      router.push("/login");
    }
  }, [user, authLoading]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, selectedCategory, dateRange]);

  const fetchLogs = async () => {
    if (!user?.id) {
      console.warn("No user ID available");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/journal?userId=${user.id}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.entries || []);
      } else {
        console.error("Failed to fetch logs:", response.statusText);
        toast({
          title: "Error",
          description: "Failed to load journal entries",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast({
        title: "Error",
        description: "Failed to load journal entries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((log) =>
        log.activity?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((log) =>
        log.category === selectedCategory
      );
    }

    // Filter by date range
    const now = new Date();
    if (dateRange === "today") {
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate.toDateString() === now.toDateString();
      });
    } else if (dateRange === "7days") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((log) => new Date(log.timestamp) >= sevenDaysAgo);
    } else if (dateRange === "30days") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((log) => new Date(log.timestamp) >= thirtyDaysAgo);
    }

    setFilteredLogs(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    
    // Optimistically remove from UI
    const deletedLog = logs.find((log) => log.id === id);
    setLogs(logs.filter((log) => log.id !== id));
    setFilteredLogs(filteredLogs.filter((log) => log.id !== id));

    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete entry");
      }

      toast({
        title: "Success",
        description: "Entry deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete entry:", error);
      // Restore on error
      if (deletedLog) {
        setLogs((prev) => [...prev, deletedLog]);
        // filterLogs will be called automatically by useEffect when logs change
      }
      toast({
        title: "Delete failed",
        description: "Failed to delete entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    toast({
      title: "Coming soon",
      description: "Export feature is in development",
    });
  };

  const getTotalTime = () => {
    return filteredLogs.reduce((sum, log) => sum + log.timeSpent, 0);
  };

  const getAverageTime = () => {
    if (filteredLogs.length === 0) return 0;
    return Math.round(getTotalTime() / filteredLogs.length);
  };

  const getCategoryBreakdown = () => {
    const breakdown: { [key: string]: number } = {};
    filteredLogs.forEach((log) => {
      breakdown[log.category] = (breakdown[log.category] || 0) + 1;
    });
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  };

  return (
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
                <h1 className="text-xl font-bold text-foreground">Compulsion Logger</h1>
                <p className="text-sm text-muted-foreground">Track and analyze your patterns</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-2 border-border text-foreground hover:bg-section hover:text-foreground bg-card"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/journal")}
                className="gap-2 bg-primary hover:bg-primary/90 text-background"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Entry</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-card shadow-soft border-border hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wide">Entries</p>
                <p className="text-2xl font-semibold text-foreground">{filteredLogs.length}</p>
              </div>
              <div className="p-3 bg-info/10 rounded-lg">
                <Clock className="w-4 h-4 text-info" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card shadow-sm border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Total Time</p>
                <p className="text-2xl font-bold text-foreground">{getTotalTime()}m</p>
              </div>
              <div className="p-3 bg-primary/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card shadow-sm border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Avg Time/Entry</p>
                <p className="text-2xl font-bold text-foreground">{getAverageTime()}m</p>
              </div>
              <div className="p-3 bg-success/20 rounded-lg">
                <TrendingDown className="w-5 h-5 text-success" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card shadow-sm border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Most Common</p>
                <p className="text-sm font-semibold text-foreground">
                  {getCategoryBreakdown()[0]?.[0] || "N/A"}
                </p>
              </div>
              <div className="p-3 bg-warning/20 rounded-lg">
                <Filter className="w-5 h-5 text-warning" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 bg-card shadow-sm border-border">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border text-foreground placeholder:text-placeholder"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className={`cursor-pointer font-medium ${
                    selectedCategory === cat
                      ? "bg-info text-background hover:bg-info/90 border-info"
                      : "bg-card text-muted-foreground border-border hover:bg-containerBg"
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-border rounded-md text-sm bg-card text-foreground font-medium"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </Card>

        {/* Table */}
        <Card className="bg-card shadow-sm border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="[&>tr]:bg-section border-b-2 border-border">
                <TableRow className="border-border bg-section">
                  <TableHead className="w-[40%] text-foreground font-semibold bg-section">Activity</TableHead>
                  <TableHead className="text-foreground font-semibold bg-section">Category</TableHead>
                  <TableHead className="text-foreground font-semibold bg-section">Time Spent</TableHead>
                  <TableHead className="text-foreground font-semibold bg-section">Date</TableHead>
                  <TableHead className="text-right text-foreground font-semibold bg-section">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No entries found. Start tracking your compulsions!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-info/10 border-border">
                      <TableCell className="font-medium text-foreground">
                        {log.activity || "No description"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-info/20 text-info border-info/30 font-medium">
                          {log.category || "Other"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {log.timeSpent}m
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(log.id)}
                          className="text-panic hover:text-panic/80 hover:bg-panic/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Category Breakdown */}
        {filteredLogs.length > 0 && (
          <Card className="p-6 mt-6 bg-card shadow-sm border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Category Breakdown</h3>
            <div className="space-y-3">
              {getCategoryBreakdown().map(([category, count]) => (
                <div key={category} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-foreground w-24">{category}</span>
                  <div className="flex-1 bg-section rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all"
                      style={{
                        width: `${(count / filteredLogs.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground w-16 text-right">
                    {count} ({Math.round((count / filteredLogs.length) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default LoggerPage;
