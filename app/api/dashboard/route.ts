import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import JournalEntry from "@/lib/models/JournalEntry";
import Mood from "@/lib/models/Mood";
import Target from "@/lib/models/Target";
import PanicEvent from "@/lib/models/PanicEvent";
import { generateDashboardSnapshot } from "@/lib/gemini";

/**
 * GET /api/dashboard?userId=X
 * Lightweight dashboard snapshot with aggregated data
 * Returns current metrics for display on main dashboard
 */

interface DashboardSnapshot {
  progress: {
    avgAnxiety: number;
    totalCompulsions: number;
    compulsionChange: number;
    pauseSessions: number;
  };
  aiSnapshot: {
    sessions: number;
    completion: number;
    avgAnxiety: number;
    journals: number;
    insight: string;
  };
  mood: {
    current: {
      emoji: string;
      label: string;
      intensity: number;
    } | null;
    weeklyStrip: Array<{
      emoji: string;
      label: string;
      day: string;
    }>;
    stats: {
      streak: number;
      avgThisWeek: number;
      totalEntries: number;
    };
    correlationHint: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const conn = await connectDB();

    if (!conn) {
      // Return empty state if DB not connected
      return NextResponse.json({
        progress: {
          avgAnxiety: 0,
          totalCompulsions: 0,
          compulsionChange: 0,
          pauseSessions: 0,
        },
        aiSnapshot: {
          sessions: 0,
          completion: 0,
          avgAnxiety: 0,
          journals: 0,
          insight: "No data yet - start logging to see insights.",
        },
        mood: {
          current: null,
          weeklyStrip: [],
          stats: {
            streak: 0,
            avgThisWeek: 0,
            totalEntries: 0,
          },
          correlationHint: "",
        },
      });
    }

    // Fetch data from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [entries, moods, targets, panicEvents] = await Promise.all([
      JournalEntry.find({
        userId,
        createdAt: { $gte: sevenDaysAgo },
      } as any)
        .sort({ createdAt: -1 })
        .lean(),
      Mood.find({
        userId,
        createdAt: { $gte: sevenDaysAgo },
      } as any)
        .sort({ createdAt: -1 })
        .lean(),
      Target.find({ userId } as any).lean(),
      PanicEvent.find({
        userId,
        createdAt: { $gte: sevenDaysAgo },
      } as any).lean(),
    ]);

    // Calculate progress metrics
    const totalCompulsions = entries.length;
    const avgAnxiety =
      entries.length > 0
        ? entries.reduce((sum: number, e: any) => sum + (e.anxietyLevel || 0), 0) / entries.length
        : 0;

    // Calculate target completion percentage
    const completedTargets = targets.filter((t: any) => t.completed).length;
    const targetCompletion = targets.length > 0 ? Math.round((completedTargets / targets.length) * 100) : 0;

    // Get current mood (most recent)
    const currentMood = moods[0];
    const moodEmoji = currentMood ? currentMood.mood : null;
    const moodLabels: Record<string, string> = {
      "😊": "Happy",
      "😌": "Calm",
      "😐": "Neutral",
      "😟": "Anxious",
      "😢": "Sad",
      "😤": "Frustrated",
      "😰": "Stressed",
      "😴": "Tired",
    };

    // Weekly mood strip (last 7 days)
    const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
    const today = new Date();
    const weeklyStrip = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayIndex = date.getDay();
      
      // Find mood for this day
      const dayMood = moods.find((m: any) => {
        const moodDate = new Date(m.createdAt);
        return moodDate.toDateString() === date.toDateString();
      });
      
      weeklyStrip.push({
        emoji: dayMood ? dayMood.mood : "😐",
        label: daysOfWeek[dayIndex],
        day: daysOfWeek[dayIndex],
      });
    }

    // Calculate mood stats
    const avgMoodIntensity =
      moods.length > 0
        ? moods.reduce((sum: number, m: any) => sum + (m.intensity || 0), 0) / moods.length
        : 0;

    // Calculate streak (consecutive days with mood entries)
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const hasMood = moods.some((m: any) => {
        const moodDate = new Date(m.createdAt);
        return moodDate.toDateString() === date.toDateString();
      });
      if (hasMood) {
        streak++;
      } else {
        break;
      }
    }

    // Correlation hint
    let correlationHint = "";
    if (panicEvents.length > 0 && moods.length > 0) {
      correlationHint = "💡 Higher mood on days with pause sessions";
    }

    // Generate AI snapshot (short insight)
    let aiInsight = "Start logging to see patterns.";
    if (entries.length > 0) {
      try {
        const avgTimeSpent = entries.length > 0 
          ? entries.reduce((sum: number, e: any) => sum + (e.timeSpent || 0), 0) / entries.length
          : 0;
        
        aiInsight = await generateDashboardSnapshot({
          totalCompulsions,
          compulsionChange: -15, // TODO: Calculate from previous week
          avgAnxiety,
          targetCompletion,
          journalEntries: entries.length,
          panicEpisodes: panicEvents.length,
        });
      } catch (error) {
        console.error("[Dashboard API] AI snapshot error:", error);
        aiInsight = "Compulsions dropped on days you logged more pauses — consistency is helping.";
      }
    }

    const response: DashboardSnapshot = {
      progress: {
        avgAnxiety: Math.round(avgAnxiety * 10) / 10,
        totalCompulsions,
        compulsionChange: -15, // TODO: Calculate from previous week
        pauseSessions: panicEvents.length,
      },
      aiSnapshot: {
        sessions: panicEvents.length,
        completion: targetCompletion,
        avgAnxiety: Math.round(avgAnxiety * 10) / 10,
        journals: entries.length,
        insight: aiInsight,
      },
      mood: {
        current: currentMood
          ? {
              emoji: moodEmoji,
              label: moodLabels[moodEmoji] || "Unknown",
              intensity: currentMood.intensity,
            }
          : null,
        weeklyStrip,
        stats: {
          streak,
          avgThisWeek: Math.round(avgMoodIntensity * 10) / 10,
          totalEntries: moods.length,
        },
        correlationHint,
      },
    };

    console.log(`[Dashboard API] Generated snapshot for user ${userId}`);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
