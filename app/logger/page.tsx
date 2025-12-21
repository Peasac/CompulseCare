"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const [logs, setLogs] = useState<CompulsionLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<CompulsionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [dateRange, setDateRange] = useState<string>("7days");

  const CATEGORIES = ["All", "Checking", "Cleaning", "Organizing", "Counting", "Other"];

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, selectedCategory, dateRange]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch from API
      const response = await fetch("/api/journal?userId=user123&limit=50");
      if (response.ok) {
        const data = await response.json();
        setLogs(data.entries || []);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
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
    
    // TODO: Call delete API
    setLogs(logs.filter((log) => log.id !== id));
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    alert("Export feature coming soon!");
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
                <h1 className="text-xl font-bold text-gray-800">Compulsion Logger</h1>
                <p className="text-sm text-gray-500">Track and analyze your patterns</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 bg-white"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/journal")}
                className="gap-2 bg-blue-500 hover:bg-blue-600 text-white"
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
          <Card className="p-4 bg-white shadow-soft border-gray-100 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Entries</p>
                <p className="text-2xl font-semibold text-gray-800">{filteredLogs.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-sm border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Total Time</p>
                <p className="text-2xl font-bold text-gray-900">{getTotalTime()}m</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-sm border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Avg Time/Entry</p>
                <p className="text-2xl font-bold text-gray-900">{getAverageTime()}m</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-sm border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Most Common</p>
                <p className="text-sm font-semibold text-gray-900">
                  {getCategoryBreakdown()[0]?.[0] || "N/A"}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Filter className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 bg-white shadow-sm border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
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
                      ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
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
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 font-medium"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </Card>

        {/* Table */}
        <Card className="bg-white shadow-sm border-gray-200">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="[&>tr]:bg-gray-100 border-b-2 border-gray-200">
                <TableRow className="border-gray-200 bg-gray-100">
                  <TableHead className="w-[40%] text-gray-900 font-semibold bg-gray-100">Activity</TableHead>
                  <TableHead className="text-gray-900 font-semibold bg-gray-100">Category</TableHead>
                  <TableHead className="text-gray-900 font-semibold bg-gray-100">Time Spent</TableHead>
                  <TableHead className="text-gray-900 font-semibold bg-gray-100">Date</TableHead>
                  <TableHead className="text-right text-gray-900 font-semibold bg-gray-100">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No entries found. Start tracking your compulsions!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-blue-50 border-gray-200">
                      <TableCell className="font-medium text-gray-900">
                        {log.activity || "No description"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 font-medium">
                          {log.category || "Other"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {log.timeSpent}m
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(log.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
          <Card className="p-6 mt-6 bg-white shadow-sm border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
            <div className="space-y-3">
              {getCategoryBreakdown().map(([category, count]) => (
                <div key={category} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900 w-24">{category}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{
                        width: `${(count / filteredLogs.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-16 text-right">
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
