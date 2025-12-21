import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import JournalEntry from "@/lib/models/JournalEntry";
import Target from "@/lib/models/Target";
import { getCached, setCache } from "@/lib/gemini-cache";

/**
 * POST /api/targets/suggest?userId=X
 * Automatically generates daily targets based on user's compulsion patterns
 * Uses caching to avoid regenerating suggestions unnecessarily
 */

interface SuggestedTarget {
  title: string;
  description: string;
  type: "daily" | "weekly";
  targetType: "exposure" | "reduction" | "mindfulness";
  goal: number;
  reasoning: string;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    // Check cache first (6 hour cache for suggestions)
    const cacheKey = `targets:suggest:${userId}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      console.log('[Suggest Targets] Returning cached suggestions');
      return NextResponse.json(cached);
    }

    const conn = await connectDB();

    if (!conn) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Fetch journal entries from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const entries = await JournalEntry.find({
      userId,
      createdAt: { $gte: sevenDaysAgo },
    } as any)
      .sort({ createdAt: -1 })
      .lean();

    const existingTargets = await Target.find({ userId } as any).lean();

    if (entries.length === 0) {
      return NextResponse.json({
        suggestions: [
          {
            title: "Start tracking compulsions",
            description: "Log at least 3 compulsions today to identify patterns",
            type: "daily",
            targetType: "mindfulness",
            goal: 3,
            reasoning: "Building awareness is the first step",
          },
        ],
      });
    }

    // Analyze patterns
    const triggerCounts: Record<string, number> = {};
    const compulsionFrequency: Record<string, number> = {};
    let totalTimeSpent = 0;

    entries.forEach((entry: any) => {
      (entry.triggers || []).forEach((trigger: string) => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      });
      compulsionFrequency[entry.compulsion] = (compulsionFrequency[entry.compulsion] || 0) + 1;
      totalTimeSpent += entry.timeSpent || 0;
    });

    // Find most common trigger and compulsion
    const mostCommonTrigger = Object.keys(triggerCounts).length > 0
      ? Object.keys(triggerCounts).reduce((a, b) => triggerCounts[a] > triggerCounts[b] ? a : b)
      : null;

    const mostCommonCompulsion = Object.keys(compulsionFrequency).length > 0
      ? Object.keys(compulsionFrequency).reduce((a, b) => compulsionFrequency[a] > compulsionFrequency[b] ? a : b)
      : null;

    const avgTimePerDay = totalTimeSpent / 7;
    const avgCompulsionsPerDay = entries.length / 7;

    const suggestions: SuggestedTarget[] = [];

    // Suggestion 1: Reduce most common trigger
    if (mostCommonTrigger && triggerCounts[mostCommonTrigger] >= 3) {
      const currentCount = triggerCounts[mostCommonTrigger];
      const targetReduction = Math.max(1, Math.floor(currentCount * 0.7)); // 30% reduction
      
      suggestions.push({
        title: `Reduce ${mostCommonTrigger.toLowerCase()} compulsions`,
        description: `Try to limit ${mostCommonTrigger.toLowerCase()}-related compulsions to ${targetReduction} times today`,
        type: "daily",
        targetType: "reduction",
        goal: targetReduction,
        reasoning: `${mostCommonTrigger} appeared ${currentCount} times this week - gradual reduction helps`,
      });
    }

    // Suggestion 2: Limit most frequent compulsion
    if (mostCommonCompulsion && compulsionFrequency[mostCommonCompulsion] >= 5) {
      suggestions.push({
        title: `Pause before "${mostCommonCompulsion.substring(0, 30)}..."`,
        description: "Take 3 deep breaths before engaging in this compulsion",
        type: "daily",
        targetType: "mindfulness",
        goal: 3,
        reasoning: "Mindfulness helps break automatic patterns",
      });
    }

    // Suggestion 3: Reduce daily time spent
    if (avgTimePerDay > 30) {
      const targetTime = Math.max(15, Math.floor(avgTimePerDay * 0.8)); // 20% reduction
      
      suggestions.push({
        title: "Reduce time spent on compulsions",
        description: `Limit total compulsion time to ${targetTime} minutes today`,
        type: "daily",
        targetType: "reduction",
        goal: targetTime,
        reasoning: `You're averaging ${Math.round(avgTimePerDay)} min/day - small reductions add up`,
      });
    }

    // Suggestion 4: Practice exposure (if checking is common)
    if (mostCommonTrigger === "Checking" && triggerCounts["Checking"] >= 5) {
      suggestions.push({
        title: "Delay checking ritual",
        description: "Wait 5 minutes before checking - use breathing exercise instead",
        type: "daily",
        targetType: "exposure",
        goal: 2,
        reasoning: "Delaying compulsions reduces their power over time",
      });
    }

    // Suggestion 5: General mindfulness
    if (avgCompulsionsPerDay >= 3) {
      suggestions.push({
        title: "Journal immediately after compulsion",
        description: "Log the compulsion within 5 minutes of it happening",
        type: "daily",
        targetType: "mindfulness",
        goal: Math.min(5, Math.ceil(avgCompulsionsPerDay)),
        reasoning: "Immediate logging builds awareness and breaks automatic patterns",
      });
    }
const result = {
      suggestions: uniqueSuggestions.slice(0, 3),
      stats: {
        mostCommonTrigger,
        mostCommonCompulsion,
        avgCompulsionsPerDay: Math.round(avgCompulsionsPerDay * 10) / 10,
        avgTimePerDay: Math.round(avgTimePerDay),
      },
    };

    // Cache for 6 hours
    setCache(cacheKey, result);

    return NextResponse.json(resulteturn NextResponse.json({
      suggestions: uniqueSuggestions.slice(0, 3),
      stats: {
        mostCommonTrigger,
        mostCommonCompulsion,
        avgCompulsionsPerDay: Math.round(avgCompulsionsPerDay * 10) / 10,
        avgTimePerDay: Math.round(avgTimePerDay),
      },
    });

  } catch (error) {
    console.error("[Suggest Targets API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
