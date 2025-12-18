"use client";

import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  days: number;
  size?: "sm" | "md" | "lg";
}

/**
 * StreakBadge - Display consecutive days of app usage
 * Gamification element to encourage daily engagement
 */
const StreakBadge = ({ days, size = "md" }: StreakBadgeProps) => {
  const sizeClasses = {
    sm: "text-xs py-1 px-2",
    md: "text-sm py-1.5 px-3",
    lg: "text-base py-2 px-4",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const getStreakColor = (days: number) => {
    if (days >= 30) return "bg-gradient-to-r from-purple-600 to-pink-600 text-white";
    if (days >= 14) return "bg-gradient-to-r from-orange-500 to-red-500 text-white";
    if (days >= 7) return "bg-blue-500 text-white";
    return "bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white";
  };

  const getStreakMessage = (days: number) => {
    if (days === 0) return "Start your streak!";
    if (days === 1) return "First day!";
    if (days >= 30) return "Amazing streak!";
    if (days >= 14) return "Keep it up!";
    if (days >= 7) return "One week!";
    return "Building momentum!";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Badge 
        className={`
          ${getStreakColor(days)} 
          ${sizeClasses[size]} 
          font-bold 
          shadow-lg 
          hover:scale-105 
          transition-transform 
          cursor-default
          flex 
          items-center 
          gap-2
        `}
      >
        <Flame className={`${iconSizes[size]} animate-pulse`} />
        <span>{days} day{days !== 1 ? 's' : ''}</span>
      </Badge>
      <p className="text-xs text-gray-600 font-medium">
        {getStreakMessage(days)}
      </p>
    </div>
  );
};

export default StreakBadge;

// Commit message: feat: create StreakBadge component for gamified daily tracking
