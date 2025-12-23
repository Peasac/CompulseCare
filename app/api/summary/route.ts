import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyReflection, explainBehavioralInsight } from "@/lib/gemini";
import { analyzeBehavioralPatterns, getTopInsights } from "@/lib/behavioral-insights";
import { getCached, setCache } from "@/lib/gemini-cache";
import connectDB from "@/lib/mongodb";
import JournalEntry from "@/lib/models/JournalEntry";
import Mood from "@/lib/models/Mood";
import Target from "@/lib/models/Target";
import PanicEvent from "@/lib/models/PanicEvent";
import CheckIn from "@/lib/models/CheckIn";
import ImportedDocument from "@/lib/models/ImportedDocument";

/**
 * GET /api/summary?userId=X
 * Weekly summary with behavioral insights and AI-generated reflection
 * 
 * Process:
 * 1. Fetch historical data (7+ days)
 * 2. Run behavioral pattern detection (deterministic)
 * 3. Transform top insights to human-readable text (LLM)
 * 4. Generate weekly reflection (LLM with structured data)
 * 5. Cache results to prevent regeneration
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

// In-memory cache for AI reflections (keyed by userId + timestamp)
const summaryCache = new Map<string, { data: WeeklySummaryResponse; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

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

    // Check cache first
    const cacheKey = `summary_${userId}`;
    const cached = summaryCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL) {
      console.log(`[Summary API] Returning cached summary for user ${userId}`);
      return NextResponse.json(cached.data, {
        status: 200,
        headers: { "X-Cache": "HIT" },
      });
    }

    const conn = await connectDB();

    // Fetch user's journal entries from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let entries: any[] = [];
    let moods: any[] = [];
    let targets: any[] = [];
    let panicEvents: any[] = [];
    let checkIns: any[] = [];
    let documents: any[] = [];

    // If MongoDB connected, fetch real data
    if (conn) {
      [entries, moods, targets, panicEvents, checkIns, documents] = await Promise.all([
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
        CheckIn.find({
          userId,
          createdAt: { $gte: sevenDaysAgo },
        } as any)
          .sort({ createdAt: -1 })
          .lean(),
        ImportedDocument.find({ userId } as any)
          .sort({ uploadDate: -1 })
          .limit(10)
          .lean(),
      ]);
    } else {
      console.warn('[Summary API] MongoDB not connected - using empty data');
    }

    console.log(`[Summary API] Fetched data: entries=${entries.length}, checkIns=${checkIns.length}, documents=${documents.length}`);

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

    // Run behavioral pattern analysis (deterministic, no LLM)
    let behavioralInsights: string[] = [];
    let textSummary = "Keep tracking to see meaningful patterns.";
    
    if (entries.length >= 10) { // Need sufficient data for pattern detection
      try {
        // Check cache
        const behavioralCacheKey = `summary:behavioral:${userId}:${entries.length}`;
        let cachedBehavioralText = getCached<string[]>(behavioralCacheKey);
        
        if (!cachedBehavioralText) {
          // Run behavioral analysis
          const behavioralAnalysis = await analyzeBehavioralPatterns({
            journalEntries: entries,
            panicEvents: panicEvents,
            targets: targets,
          });

          // Get top 3 insights
          const topInsights = getTopInsights(behavioralAnalysis, 3);

          // Transform each insight to human-readable text using LLM
          const insightPromises = topInsights.map(insight => 
            explainBehavioralInsight(insight)
          );
          behavioralInsights = await Promise.all(insightPromises);

          // Cache behavioral insights
          setCache(behavioralCacheKey, behavioralInsights);
        } else {
          behavioralInsights = cachedBehavioralText;
        }
      } catch (error) {
        console.error("[Summary API] Behavioral analysis error:", error);
      }
    }

    // Generate weekly reflection using traditional LLM approach (uses pre-aggregated stats)
    const reflection = await generateWeeklyReflection({
      totalCompulsions,
      compulsionChange: -15, // TODO: Calculate from previous week
      avgTimeSpent,
      avgAnxiety: Math.round(avgAnxiety * 10) / 10,
      targetCompletion,
      journalEntries: entries.length,
      panicEpisodes: panicEvents.length,
      mostCommonTrigger,
      checkIns: checkIns.map((c: any) => ({
        mood: c.mood,
        thought: c.thought,
        date: c.createdAt,
      })),
      documents: documents.map((d: any) => ({
        fileName: d.fileName,
        summary: d.summary,
        ocrText: d.ocrText?.substring(0, 500), // First 500 chars
      })),
    });

    textSummary = reflection.whatHelped;

    // Combine behavioral insights with traditional reflection
    const allInsights = [
      ...behavioralInsights, // Deterministic pattern detection
      reflection.patterns, // Traditional LLM reflection
      reflection.suggestion, // Traditional LLM suggestion
    ].filter(Boolean);

    const response: WeeklySummaryResponse = {
      textSummary,
      totalCompulsions,
      avgTimeSpent,
      mostCommonTrigger,
      compulsionChange: -15, // TODO: Calculate from previous week
      moodAverage: Math.round(avgMood * 10) / 10,
      chartData,
      insights: allInsights.slice(0, 5), // Show top 5 insights
    };

    // Cache the response
    summaryCache.set(cacheKey, {
      data: response,
      timestamp: now,
    });

    console.log(`[Summary API] Generated and cached weekly summary for user ${userId}`);

    return NextResponse.json(response, {
      status: 200,
      headers: { "X-Cache": "MISS" },
    });

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
