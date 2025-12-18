import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyReflection } from "@/lib/gemini";
import connectDB from "@/lib/mongodb";
import JournalEntry from "@/lib/models/JournalEntry";
import Mood from "@/lib/models/Mood";
import Target from "@/lib/models/Target";
import PanicEvent from "@/lib/models/PanicEvent";

/**
 * GET /api/summary?userId=X
 * Weekly summary with Gemini-generated reflection and analytics
 * 
 * Returns:
 * - textSummary: What improved (from LLM reflection)
 * - aggregated metrics (compulsions, time, mood)
 * - chart data for visualizations
 * - insights: [patterns noticed, suggestion for next week] (from LLM)
 * 
 * LLM generates reflection once per week using pre-aggregated stats only
 * TODO: Query database for user's weekly data
 * TODO: Add caching (Redis) for expensive LLM calls
 */

interface WeeklySummaryResponse {
  textSummary: string; // "What improved"
  totalCompulsions: number;
  avgTimeSpent: number;
  mostCommonTrigger: string;
  compulsionChange: number;
  moodAverage: number;
  chartData: Array<{
    day: string;
    compulsions: number;
    timeSpent: number;
  }>;
  insights: string[]; // [patterns, suggestion]
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

    await connectDB();

    // Fetch user's journal entries from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [entries, moods, targets, panicEvents] = await Promise.all([
      JournalEntry.find({
        userId,
        createdAt: { $gte: sevenDaysAgo },
      } as any)
        .sort({ createdAt: 1 })
        .lean(),
      Mood.find({
        userId,
        createdAt: { $gte: sevenDaysAgo },
      } as any).lean(),
      Target.find({ userId } as any).lean(),
      PanicEvent.find({
        userId,
        createdAt: { $gte: sevenDaysAgo },
      } as any).lean(),
    ]);

    // Aggregate data
    const totalCompulsions = entries.length;
    const totalTimeSpent = entries.reduce((sum: number, e: any) => sum + (e.timeSpent || 0), 0);
    const avgTimeSpent = totalCompulsions > 0 ? Math.round(totalTimeSpent / totalCompulsions) : 0;

    // Find most common trigger
    const triggerCounts: Record<string, number> = {};
    entries.forEach((entry: any) => {
      (entry.triggers || []).forEach((trigger: string) => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      });
    });
    const mostCommonTrigger =
      Object.keys(triggerCounts).length > 0
        ? Object.keys(triggerCounts).reduce((a, b) => (triggerCounts[a] > triggerCounts[b] ? a : b))
        : "None";

    // Group by day for charts
    const dayMap: Record<string, { day: string; compulsions: number; timeSpent: number }> = {};
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    entries.forEach((entry: any) => {
      const date = new Date(entry.createdAt);
      const dayName = daysOfWeek[date.getDay()];

      if (!dayMap[dayName]) {
        dayMap[dayName] = { day: dayName, compulsions: 0, timeSpent: 0 };
      }

      dayMap[dayName].compulsions += 1;
      dayMap[dayName].timeSpent += entry.timeSpent || 0;
    });

    const chartData = Object.values(dayMap);

    // Calculate mood average
    const avgMood =
      moods.length > 0
        ? moods.reduce((sum: number, m: any) => sum + (m.intensity || 0), 0) / moods.length
        : 0;

    // Calculate target completion
    const completedTargets = targets.filter((t: any) => t.completed).length;
    const targetCompletion = targets.length > 0 ? Math.round((completedTargets / targets.length) * 100) : 0;

    // TODO: Generate LLM summary using OpenAI
    /*
    const prompt = `You are a compassionate mental health assistant analyzing a user's OCD/compulsion tracking data.

Weekly Data:
- Total compulsions: ${totalCompulsions}
- Average time per compulsion: ${avgTimeSpent} minutes
- Most common trigger: ${mostCommonTrigger}
- Daily breakdown: ${JSON.stringify(chartData)}

Generate:
1. A supportive 2-3 sentence summary highlighting progress or areas of concern
2. 3 specific, actionable insights for the user

Keep tone positive, validating, and hopeful. Focus on patterns and small wins.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { 
            role: "system", 
            content: "You are a supportive mental health assistant providing weekly OCD tracking insights." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    const data = await openaiResponse.json();
    const llmSummary = data.choices[0].message.content;
    
    // Parse summary and insights from LLM response
    */

    // Calculate average anxiety from journal entries
    const avgAnxiety =
      entries.length > 0
        ? entries.reduce((sum: number, e: any) => sum + (e.anxietyLevel || 0), 0) / entries.length
        : 0;

    // Generate weekly reflection using Gemini (uses pre-aggregated stats only)
    const reflection = await generateWeeklyReflection({
      totalCompulsions,
      compulsionChange: -15, // TODO: Calculate from previous week
      avgTimeSpent,
      avgAnxiety: Math.round(avgAnxiety * 10) / 10,
      targetCompletion,
      journalEntries: entries.length,
      panicEpisodes: panicEvents.length,
      mostCommonTrigger,
    });

    const response: WeeklySummaryResponse = {
      textSummary: reflection.whatHelped,
      totalCompulsions,
      avgTimeSpent,
      mostCommonTrigger,
      compulsionChange: -15, // TODO: Calculate from previous week
      moodAverage: Math.round(avgMood * 10) / 10,
      chartData,
      insights: [reflection.patterns, reflection.suggestion],
    };

    console.log(`[Summary API] Generated weekly summary for user ${userId}`);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("[Summary API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function example (implement when using real DB)
/*
function groupEntriesByDay(entries: JournalEntry[]) {
  const dayMap = {};
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  entries.forEach(entry => {
    const date = new Date(entry.timestamp);
    const dayName = daysOfWeek[date.getDay()];
    
    if (!dayMap[dayName]) {
      dayMap[dayName] = { day: dayName, compulsions: 0, timeSpent: 0 };
    }
    
    dayMap[dayName].compulsions += 1;
    dayMap[dayName].timeSpent += entry.timeSpent;
  });
  
  return Object.values(dayMap);
}
*/

// Commit message: feat: add /api/summary endpoint with LLM integration stubs for weekly insights
