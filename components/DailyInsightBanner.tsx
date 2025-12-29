
"use client";

import { Sparkles } from "lucide-react";

interface DailyInsightBannerProps {
    insight?: string;
    loading?: boolean;
}

export default function DailyInsightBanner({ insight, loading }: DailyInsightBannerProps) {
    if (loading) {
        return (
            <div className="w-full h-24 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 animate-pulse mt-8 mb-2" />
        );
    }

    if (!insight) return null;

    return (
        <div className="w-full mt-8 mb-2 animate-fade-in relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white rounded-2xl border border-indigo-100/50" />

            <div className="relative p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-50 group-hover:scale-105 transition-transform duration-500">
                    <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-100" />
                </div>

                <div className="flex-1 space-y-1">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                        Daily Insight
                    </p>
                    <p className="text-gray-700 font-medium leading-relaxed text-sm sm:text-base">
                        "{insight}"
                    </p>
                </div>
            </div>
        </div>
    );
}
