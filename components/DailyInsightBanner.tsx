
"use client";

import { Sparkles } from "lucide-react";

interface DailyInsightBannerProps {
    insight?: string;
    loading?: boolean;
}

export default function DailyInsightBanner({ insight, loading }: DailyInsightBannerProps) {
    if (loading) {
        return (
            <div className="w-full h-24 bg-gradient-to-r from-muted to-card rounded-2xl border border-border animate-pulse mt-8 mb-2" />
        );
    }

    if (!insight) return null;

    return (
        <div className="w-full mt-8 mb-2 animate-fade-in relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-card rounded-2xl border border-primary/20" />

            <div className="relative p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="p-3 bg-card rounded-xl shadow-sm border border-primary/10 group-hover:scale-105 transition-transform duration-500">
                    <Sparkles className="w-5 h-5 text-primary fill-primary/20" />
                </div>

                <div className="flex-1 space-y-1">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">
                        Daily Insight
                    </p>
                    <p className="text-foreground font-medium leading-relaxed text-sm sm:text-base">
                        "{insight}"
                    </p>
                </div>
            </div>
        </div>
    );
}
