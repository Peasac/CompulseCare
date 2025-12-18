import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyInsights } from "@/lib/gemini";

/**
 * GET /api/summary?userId=X
 * Weekly summary with Gemini-generated insights and analytics
 * 
 * Returns:
 * - textSummary: LLM-generated narrative summary
 * - aggregated metrics (compulsions, time, mood)
 * - chart data for visualizations
 * - AI insights
 * 
 * TODO: Query database for user's weekly data
 * TODO: Add caching (Redis) for expensive LLM calls
 */

interface WeeklySummaryResponse {
  textSummary: string;
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
  insights: string[];
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

    // TODO: Fetch user's journal entries from last 7 days
    /*
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const entries = await db.journalEntries.findMany({
      where: {
        userId,
        timestamp: { gte: sevenDaysAgo },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Aggregate data
    const totalCompulsions = entries.length;
    const totalTimeSpent = entries.reduce((sum, e) => sum + e.timeSpent, 0);
    const avgTimeSpent = Math.round(totalTimeSpent / totalCompulsions || 0);
    
    // Find most common trigger
    const triggerCounts = {};
    entries.forEach(entry => {
      entry.triggers.forEach(trigger => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      });
    });
    const mostCommonTrigger = Object.keys(triggerCounts).reduce((a, b) => 
      triggerCounts[a] > triggerCounts[b] ? a : b, 
      "None"
    );

    // Group by day for charts
    const chartData = groupEntriesByDay(entries);
    */

    // MOCK DATA for now
    const mockChartData = [
      { day: "Mon", compulsions: 8, timeSpent: 45 },
      { day: "Tue", compulsions: 6, timeSpent: 35 },
      { day: "Wed", compulsions: 10, timeSpent: 60 },
      { day: "Thu", compulsions: 5, timeSpent: 25 },
      { day: "Fri", compulsions: 7, timeSpent: 40 },
      { day: "Sat", compulsions: 4, timeSpent: 20 },
      { day: "Sun", compulsions: 5, timeSpent: 30 },
    ];

    const totalCompulsions = mockChartData.reduce((sum, d) => sum + d.compulsions, 0);
    const totalTimeSpent = mockChartData.reduce((sum, d) => sum + d.timeSpent, 0);
    const avgTimeSpent = Math.round(totalTimeSpent / totalCompulsions);

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

    // Generate insights using Gemini
    const topTriggers = ["Checking", "Organizing", "Cleaning"];
    const insights = await generateWeeklyInsights({
      panicEpisodes: 10,
      journalEntries: 6,
      targetCompletion: 85,
      avgAnxiety: 4.5,
      topTriggers,
    });

    const response: WeeklySummaryResponse = {
      textSummary: insights[0] || "You're making progress one day at a time.",
      totalCompulsions: totalCompulsions,
      avgTimeSpent: avgTimeSpent,
      mostCommonTrigger: "Checking",
      compulsionChange: -15, // negative = improvement
      moodAverage: 6.5,
      chartData: mockChartData,
      insights: insights,
    };

    // TODO: Cache this response for 1 hour
    /*
    await redis.set(
      `summary:${userId}:weekly`,
      JSON.stringify(response),
      'EX',
      3600
    );
    */

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
