"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, Menu } from "lucide-react";

interface HeaderProps {
  userName?: string;
  showExport?: boolean;
}

/**
 * Header - Shared navigation header
 * Mobile-first with responsive design
 */
const Header = ({ userName = "User", showExport = true }: HeaderProps) => {
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                Welcome, {userName} 👋
              </h1>
            </Link>
            <p className="text-sm text-gray-500">
              You're doing great. One step at a time.
            </p>
          </div>
          
          {showExport && (
            <Button 
              className="gap-2 bg-lime-400 hover:bg-lime-500 text-gray-800"
              onClick={() => alert("Export feature coming soon!")}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Data</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

// Commit message: feat: create Header component with user greeting and export action
