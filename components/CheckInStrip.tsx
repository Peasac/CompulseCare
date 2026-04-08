
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
        <div className="flex flex-col items-center gap-4 p-5 bg-card/50 rounded-xl border border-border shadow-sm backdrop-blur-sm min-h-[180px] justify-center">
            {/* Primary Action - Grey style as requested */}
            <Button
                onClick={onCheckIn}
                className="w-full h-11 bg-muted hover:bg-muted/80 text-foreground border border-border shadow-sm transition-all text-sm font-medium"
            >
                Daily Check-In
            </Button>

            {/* Streak Display - "In Between" */}
            <div className="flex items-center gap-1.5 py-1.5 px-4 bg-warning/10 rounded-full border border-warning/20">
                <Flame className={`w-4 h-4 ${streak > 0 ? "text-warning fill-warning" : "text-muted-foreground"}`} />
                <span className={`text-xs font-semibold ${streak > 0 ? "text-warning" : "text-muted-foreground"}`}>
                    {streak} Day Streak
                </span>
            </div>

            {/* Secondary Action - Matches styles */}
            <Button
                variant="outline"
                onClick={onHistoryClick}
                className="w-full h-10 bg-card hover:bg-muted border-border text-muted-foreground hover:text-primary transition-calm text-xs font-medium"
            >
                View Check-In History
            </Button>
        </div>
    );
}
