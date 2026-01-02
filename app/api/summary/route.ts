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

export const dynamic = 'force-dynamic';

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
  checkInsCount?: number;
  panicEpisodesCount?: number;
  moodLogsCount?: number;
  // Check-in category averages
  checkInAverages?: {
    anxiety: number;
    compulsionUrge: number;
    control: number;
    functioning: number;
    sleep: number;
    overallScore: number;
  };
}

// In-memory cache for AI reflections (keyed by userId + data fingerprint)
const summaryCache = new Map<string, { data: WeeklySummaryResponse; timestamp: number; fingerprint: string }>();
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

// Generate fingerprint from data counts to detect changes
function generateDataFingerprint(counts: {
  entries: number;
  moods: number;
  targets: number;
  panicEvents: number;
  checkIns: number;
  documents: number;
  completedTargets: number;
}): string {
  return `${counts.entries}-${counts.moods}-${counts.targets}-${counts.panicEvents}-${counts.checkIns}-${counts.documents}-${counts.completedTargets}`;
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
          .limit(100) // Limit for performance
          .lean(),
        Mood.find({
          userId,
          createdAt: { $gte: sevenDaysAgo },
        } as any)
          .limit(50)
          .lean(),
        Target.find({ userId } as any)
          .limit(50)
          .lean(),
        PanicEvent.find({
          userId,
          createdAt: { $gte: sevenDaysAgo },
        } as any)
          .limit(50)
          .lean(),
        CheckIn.find({
          userId,
          createdAt: { $gte: sevenDaysAgo },
        } as any)
          .sort({ createdAt: -1 })
          .limit(10) // Only need recent check-ins
          .lean(),
        ImportedDocument.find({ userId } as any)
          .sort({ uploadDate: -1 })
          .limit(5) // Only recent documents
          .lean(),
      ]);
      
      console.log(`[Summary API] Data fetched - Entries: ${entries.length}, Moods: ${moods.length}, CheckIns: ${checkIns.length}, Documents: ${documents.length}`);
    } else {
      console.warn('[Summary API] MongoDB not connected - using empty data');
    }

    console.log(`[Summary API] Fetched data: entries=${entries.length}, checkIns=${checkIns.length}, documents=${documents.length}`);

    // Generate data fingerprint to detect changes
    const completedTargets = targets.filter((t: any) => t.completed).length;
    const currentFingerprint = generateDataFingerprint({
      entries: entries.length,
      moods: moods.length,
      targets: targets.length,
      panicEvents: panicEvents.length,
      checkIns: checkIns.length,
      documents: documents.length,
      completedTargets,
    });

    // Check cache with fingerprint validation
    const cacheKey = `summary_${userId}`;
    const cached = summaryCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL && cached.fingerprint === currentFingerprint) {
      console.log(`[Summary API] Returning cached summary for user ${userId} (fingerprint match)`);
      return NextResponse.json(cached.data, {
        status: 200,
        headers: { "X-Cache": "HIT" },
      });
    } else if (cached && cached.fingerprint !== currentFingerprint) {
      console.log(`[Summary API] Cache invalidated - data changed (${cached.fingerprint} → ${currentFingerprint})`);
    }

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
        const behavioralCacheKey = `summary:behavioral:${userId}:${sevenDaysAgo.toISOString()}`;
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
          behavioralInsights = [];

          for (const insight of topInsights) {
            const explained = await explainBehavioralInsight(insight);
            behavioralInsights.push(explained);
          }


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
        mood: c.responses?.mood || c.mood || 'Unknown',
        thought: c.notes || c.thought || '',
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

    // Calculate check-in category averages
    let checkInAverages = undefined;
    if (checkIns.length > 0) {
      const categoryTotals: Record<string, { sum: number; count: number }> = {
        anxiety: { sum: 0, count: 0 },
        'compulsion': { sum: 0, count: 0 },
        'compulsion-urge': { sum: 0, count: 0 }, // Legacy support
        control: { sum: 0, count: 0 },
        functioning: { sum: 0, count: 0 },
        sleep: { sum: 0, count: 0 },
      };
      let totalScore = 0;
      let totalResponses = 0;

      checkIns.forEach((checkIn: any) => {
        if (checkIn.responses && Array.isArray(checkIn.responses)) {
          checkIn.responses.forEach((r: any) => {
            if (categoryTotals[r.category]) {
              categoryTotals[r.category].sum += r.response;
              categoryTotals[r.category].count += 1;
            }
            totalScore += r.response;
            totalResponses += 1;
          });
        }
      });

      checkInAverages = {
        anxiety: categoryTotals.anxiety.count > 0 ? Math.round((categoryTotals.anxiety.sum / categoryTotals.anxiety.count) * 10) / 10 : 0,
        compulsionUrge: (categoryTotals['compulsion'].count > 0 || categoryTotals['compulsion-urge'].count > 0) 
          ? Math.round(((categoryTotals['compulsion'].sum + categoryTotals['compulsion-urge'].sum) / (categoryTotals['compulsion'].count + categoryTotals['compulsion-urge'].count)) * 10) / 10 
          : 0,
        control: categoryTotals.control.count > 0 ? Math.round((categoryTotals.control.sum / categoryTotals.control.count) * 10) / 10 : 0,
        functioning: categoryTotals.functioning.count > 0 ? Math.round((categoryTotals.functioning.sum / categoryTotals.functioning.count) * 10) / 10 : 0,
        sleep: categoryTotals.sleep.count > 0 ? Math.round((categoryTotals.sleep.sum / categoryTotals.sleep.count) * 10) / 10 : 0,
        overallScore: totalResponses > 0 ? Math.round((totalScore / totalResponses) * 10) / 10 : 0,
      };
    }

    const response: WeeklySummaryResponse = {
      textSummary,
      totalCompulsions,
      avgTimeSpent,
      mostCommonTrigger,
      compulsionChange: -15, // TODO: Calculate from previous week
      moodAverage: Math.round(avgMood * 10) / 10,
      chartData,
      insights: allInsights.slice(0, 5), // Show top 5 insights
      checkInsCount: checkIns.length,
      panicEpisodesCount: panicEvents.length,
      moodLogsCount: moods.length,
      checkInAverages,
    };

    // Cache the response with fingerprint
    summaryCache.set(cacheKey, {
      data: response,
      timestamp: now,
      fingerprint: currentFingerprint,
    });

    console.log(`[Summary API] Generated and cached weekly summary for user ${userId} (fingerprint: ${currentFingerprint})`);

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
