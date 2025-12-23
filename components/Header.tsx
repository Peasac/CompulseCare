"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, Menu, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  userName?: string;
  showExport?: boolean;
  userId?: string;
}

/**
 * Header - Shared navigation header
 * Mobile-first with responsive design
 */
const Header = ({ userName, showExport = true, userId }: HeaderProps) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const effectiveUserId = user?.id || userId || "user123";
      
      console.log("Starting export for userId:", effectiveUserId);
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/export?userId=${effectiveUserId}`, {
        headers,
      });
      
      console.log("Export response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Export failed:", errorText);
        throw new Error(`Failed to generate report: ${response.status}`);
      }
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/i);
      const filename = filenameMatch?.[1] || `compulsecare-report-${new Date().toISOString().split('T')[0]}.txt`;
      
      console.log("Downloading file:", filename);
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log("Export completed successfully");
      toast({
        title: "Export successful",
        description: "Your report has been downloaded",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const displayName = user?.name || userName || "User";

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                Welcome, {displayName} 👋
              </h1>
            </Link>
            <p className="text-sm text-gray-500">
              You're doing great. One step at a time.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {showExport && (
              <Button 
                className="gap-2 bg-lime-400 hover:bg-lime-500 text-gray-800"
                onClick={handleExport}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Data</span>
              </Button>
            )}
            
            {user && (
              <Button 
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

// Commit message: feat: create Header component with user greeting and export action
