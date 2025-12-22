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
    const targetType = searchParams.get("type"); // 'daily' or 'weekly'

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    // Check cache first (6 hour cache for suggestions)
    const cacheKey = `targets:suggest:${userId}:${targetType || 'all'}`;
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
      // Return starter suggestions for new users
      const starterSuggestions = [
        {
          title: "Track 3 compulsions today",
          description: "Log at least 3 compulsions to start identifying patterns",
          type: "daily" as const,
          targetType: "mindfulness" as const,
          goal: 3,
          reasoning: "Building awareness is the first step to managing OCD",
        },
        {
          title: "Practice breathing exercise",
          description: "Use the 4-7-8 breathing technique when you feel an urge",
          type: "daily" as const,
          targetType: "mindfulness" as const,
          goal: 2,
          reasoning: "Breathing helps create space between urge and action",
        },
        {
          title: "Weekly journaling goal",
          description: "Log at least 10 compulsions this week to understand your patterns",
          type: "weekly" as const,
          targetType: "mindfulness" as const,
          goal: 10,
          reasoning: "Consistent tracking over a week reveals important patterns",
        },
      ];
      
      return NextResponse.json({
        suggestions: starterSuggestions,
        stats: {
          mostCommonTrigger: null,
          mostCommonCompulsion: null,
          avgCompulsionsPerDay: 0,
          avgTimePerDay: 0,
        },
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

    // Suggestion 6: Weekly reduction goal
    if (entries.length >= 5) {
      const weeklyTotal = entries.length;
      const weeklyGoal = Math.max(3, Math.floor(weeklyTotal * 0.7)); // 30% reduction
      
      suggestions.push({
        title: "Reduce weekly compulsion count",
        description: `Aim for ${weeklyGoal} compulsions or fewer this week`,
        type: "weekly",
        targetType: "reduction",
        goal: weeklyGoal,
        reasoning: `You logged ${weeklyTotal} last week - small weekly reductions compound over time`,
      });
    }

    // Suggestion 7: Weekly exposure target
    if (mostCommonTrigger && triggerCounts[mostCommonTrigger] >= 3) {
      suggestions.push({
        title: `Weekly ${mostCommonTrigger.toLowerCase()} exposure`,
        description: `Practice resisting ${mostCommonTrigger.toLowerCase()}-related urges 5 times this week`,
        type: "weekly",
        targetType: "exposure",
        goal: 5,
        reasoning: "Repeated exposure over a week builds stronger resistance",
      });
    }

    // Fallback suggestions if we have fewer than 3
    if (suggestions.length < 3) {
      const fallbackSuggestions = [
        {
          title: "Practice 5-minute mindfulness",
          description: "Use the breathing exercise when you feel an urge",
          type: "daily" as const,
          targetType: "mindfulness" as const,
          goal: 3,
          reasoning: "Mindfulness helps create space between urge and action",
        },
        {
          title: "Delay compulsions by 5 minutes",
          description: "When you feel an urge, wait 5 minutes before acting",
          type: "daily" as const,
          targetType: "exposure" as const,
          goal: 2,
          reasoning: "Delaying compulsions reduces their intensity over time",
        },
        {
          title: "Weekly journaling goal",
          description: "Log at least 15 compulsions this week",
          type: "weekly" as const,
          targetType: "mindfulness" as const,
          goal: 15,
          reasoning: "Weekly tracking provides comprehensive pattern insights",
        },
        {
          title: "Track all compulsions today",
          description: "Log every compulsion to build awareness of patterns",
          type: "daily" as const,
          targetType: "mindfulness" as const,
          goal: 5,
          reasoning: "Tracking helps identify triggers and patterns",
        },
        {
          title: "Reduce total compulsion time",
          description: "Limit compulsion time to 20 minutes total today",
          type: "daily" as const,
          targetType: "reduction" as const,
          goal: 20,
          reasoning: "Gradual time reduction makes progress sustainable",
        },
        {
          title: "Weekly exposure practice",
          description: "Practice exposure to 3 different triggers this week",
          type: "weekly" as const,
          targetType: "exposure" as const,
          goal: 3,
          reasoning: "Regular exposure reduces trigger sensitivity",
        },
        {
          title: "Practice urge surfing",
          description: "Observe urges without acting on them - like waves that pass",
          type: "daily" as const,
          targetType: "exposure" as const,
          goal: 3,
          reasoning: "Observing urges helps break the compulsion cycle",
        },
      ];

      // Add fallback suggestions until we have at least 3
      for (const fallback of fallbackSuggestions) {
        if (suggestions.length >= 3) break;
        
        // Check if this suggestion title is unique
        const isDuplicate = suggestions.some(s => 
          s.title.toLowerCase().includes(fallback.title.toLowerCase().substring(0, 15))
        );
        
        if (!isDuplicate) {
          suggestions.push(fallback);
        }
      }
    }

    // Filter out targets that already exist
    const existingTitles = existingTargets.map((t: any) => t.title.toLowerCase());
    const uniqueSuggestions = suggestions.filter(
      (s) => !existingTitles.some((existing) => existing.includes(s.title.toLowerCase().substring(0, 20)))
    );

    // Filter by type if specified
    let filteredSuggestions = uniqueSuggestions;
    if (targetType === 'daily' || targetType === 'weekly') {
      filteredSuggestions = uniqueSuggestions.filter(s => s.type === targetType);
      
      // If not enough suggestions of the requested type, add from unfiltered
      if (filteredSuggestions.length < 3) {
        const additionalSuggestions = suggestions
          .filter(s => s.type === targetType && !filteredSuggestions.includes(s))
          .slice(0, 3 - filteredSuggestions.length);
        filteredSuggestions = [...filteredSuggestions, ...additionalSuggestions];
      }
    }

    // Ensure we always return at least 3 suggestions
    const finalSuggestions = filteredSuggestions.length >= 3 
      ? filteredSuggestions.slice(0, 3)
      : suggestions.filter(s => !targetType || s.type === targetType).slice(0, 3);

    // Return top 3 suggestions
    const result = {
      suggestions: finalSuggestions,
      stats: {
        mostCommonTrigger,
        mostCommonCompulsion,
        avgCompulsionsPerDay: Math.round(avgCompulsionsPerDay * 10) / 10,
        avgTimePerDay: Math.round(avgTimePerDay),
      },
    };

    // Cache for 6 hours
    setCache(cacheKey, result);

    return NextResponse.json(result);

  } catch (error) {
    console.error("[Suggest Targets API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
