
"use client";

import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

interface CheckInStripProps {
    streak: number;
    onCheckIn: () => void;
    onHistoryClick: () => void;
}

/**
 * CheckInStrip - Compact vertical widget for right dashboard column
 * Displays daily check-in button, streak, and history link
 */
export default function CheckInStrip({ streak, onCheckIn, onHistoryClick }: CheckInStripProps) {
    return (
        <div className="flex flex-col items-center gap-4 p-5 bg-white/50 rounded-xl border border-gray-100 shadow-sm backdrop-blur-sm min-h-[180px] justify-center">
            {/* Primary Action - Grey style as requested */}
            <Button
                onClick={onCheckIn}
                className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 shadow-sm transition-all text-sm font-medium"
            >
                Daily Check-In
            </Button>

            {/* Streak Display - "In Between" */}
            <div className="flex items-center gap-1.5 py-1.5 px-4 bg-orange-50 rounded-full border border-orange-100/50">
                <Flame className={`w-4 h-4 ${streak > 0 ? "text-orange-500 fill-orange-500" : "text-gray-300"}`} />
                <span className={`text-xs font-semibold ${streak > 0 ? "text-orange-700" : "text-gray-400"}`}>
                    {streak} Day Streak
                </span>
            </div>

            {/* Secondary Action - Matches styles */}
            <Button
                variant="outline"
                onClick={onHistoryClick}
                className="w-full h-10 bg-white hover:bg-gray-50 border-gray-200 text-gray-600 hover:text-indigo-600 transition-calm text-xs font-medium"
            >
                View Check-In History
            </Button>
        </div>
    );
}
