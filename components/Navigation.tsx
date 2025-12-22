"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, AlertCircle, BookText, Target, TrendingUp, Smile, ClipboardList } from "lucide-react";

/**
 * Navigation - Mobile-friendly bottom navigation
 * Fixed at bottom on mobile, top on desktop
 */
const Navigation = () => {
  const pathname = usePathname();
  
  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/checkin", icon: ClipboardList, label: "Check-Ins" },
    { href: "/panic", icon: AlertCircle, label: "Panic" },
    { href: "/journal", icon: BookText, label: "Journal" },
    { href: "/targets", icon: Target, label: "Targets" },
    { href: "/summary", icon: TrendingUp, label: "Insights" },
    { href: "/mood", icon: Smile, label: "Mood" },
  ];

  return (
    <>
      {/* Desktop Navigation - Top */}
      <nav className="hidden md:block border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-3 transition-colors ${
                    isActive
                      ? "text-lime-600 border-b-2 border-lime-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-lime-600 bg-lime-50"
                    : "text-gray-600"
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
