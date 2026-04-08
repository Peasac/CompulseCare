"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, AlertCircle, BookText, Target, TrendingUp, Smile, ClipboardList, Wind, Settings, Menu, X } from "lucide-react";

/**
 * Navigation - Mobile-friendly bottom navigation
 * Fixed at bottom on mobile, side navigation on desktop
 */
const Navigation = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  // Mobile Nav Items (Desktop Sync + Mobile Panic Shortcut)
  const mobileNavItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/checkin", icon: ClipboardList, label: "Check-in" },
    { href: "/panic", icon: AlertCircle, label: "Panic" },
    { href: "/summary", icon: TrendingUp, label: "Summary" },
    { href: "/journal", icon: BookText, label: "Journal" },
    { href: "/mood", icon: Smile, label: "Mood" },
    { href: "/targets", icon: Settings, label: "Settings" },
  ];

  // Desktop Sidebar Nav Items (As requested by Stitch design)
  const desktopNavItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/checkin", icon: ClipboardList, label: "Check-in" },
    { href: "/summary", icon: TrendingUp, label: "Summary" },
    { href: "/journal", icon: BookText, label: "Journal" },
    { href: "/mood", icon: Smile, label: "Mood" },
  ];

  return (
    <>
      {/* Spacer to prevent overlap with main content layout */}
      <div className="hidden md:block w-16 shrink-0" aria-hidden="true" />

      {/* Desktop Hamburger Toggle Button */}
      <div className="hidden md:block fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-card border border-border shadow-soft text-primary hover:bg-primary/10 transition-colors"
          aria-label="Toggle Sidebar"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Navigation - Overlay Backdrop */}
      {isOpen && (
        <div 
          className="hidden md:block fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Desktop Navigation - Sliding Drawer Sidebar */}
      <aside 
        className={`hidden md:flex flex-col fixed left-0 top-0 w-56 h-screen bg-card border-r border-border z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand/Logo Section */}
        <div className="p-6 pb-8">
          <h1 className="font-medium text-foreground">CompulseCare</h1>
          <p className="text-xs text-muted-foreground mt-1">Mental Wellness</p>
        </div>

        {/* Main Links */}
        <div className="flex-1 px-4 space-y-1.5">
          {desktopNavItems.map((item, index) => {
            const Icon = item.icon;
            // Since we have multiple links going to the same href, active state is still tied to href
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={index}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Settings - Bottom Pinned */}
        <div className="p-4 px-4 border-t border-border mt-auto">
          <Link
            href="/targets"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === "/targets"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Navigation - Bottom (Kept Exactly as Existing) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navigation;
