import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import JournalEntry from "@/lib/models/JournalEntry";
import Target from "@/lib/models/Target";
import { generateTargetSuggestions } from "@/lib/gemini";

/**
 * POST /api/targets/suggest?userId=X&type=daily&count=3
 * Generates personalized targets using Gemini AI
 * Based on user's compulsion patterns and progress
 */

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const targetType = searchParams.get("type"); // 'daily' or 'weekly'
    const countParam = searchParams.get("count");
    const count = countParam ? parseInt(countParam) : 3;

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
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
    const completedTargets = existingTargets.filter((t: any) => t.completed);
    
    // Calculate completion rate
    const completionRate = existingTargets.length > 0 
      ? (completedTargets.length / existingTargets.length) * 100 
      : 0;

    console.log(`[Suggest] Using Gemini AI to generate ${count} ${targetType || 'any'} suggestions`);

    // Use Gemini to generate suggestions
    const suggestions = await generateTargetSuggestions({
      type: (targetType as "daily" | "weekly") || "daily",
      count,
      recentEntries: entries,
      existingTargets,
      completionRate,
    });

    // Return suggestions
    const result = {
      suggestions: suggestions.map(s => ({
        ...s,
        type: targetType || "daily",
        targetType: "mindfulness" as const,
        reasoning: "AI-personalized suggestion based on your patterns",
      })),
    };

    console.log(`[Suggest] Generated ${suggestions.length} suggestions:`, suggestions.map(s => s.title));

    return NextResponse.json(result);

  } catch (error) {
    console.error("[Suggest Targets API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
