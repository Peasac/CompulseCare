import { NextRequest, NextResponse } from "next/server";

/**
 * Mood Tracking API
 * 
 * POST /api/mood - Log a mood entry
 * GET /api/mood?userId=X - Fetch mood entries
 * 
 * TODO: Integrate with database
 * TODO: Add mood analytics (trends, patterns)
 */

interface MoodEntry {
  id: string;
  userId: string;
  emoji: string;
  intensity: number; // 1-10
  note?: string;
  timestamp: string;
}

// Mock storage
let mockMoodEntries: MoodEntry[] = [
  {
    id: "m1",
    userId: "user123",
    emoji: "😌",
    intensity: 7,
    note: "Finished a breathing exercise, feeling better",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * POST /api/mood
 * Log a new mood entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, emoji, intensity, note, timestamp } = body;

    // Validation
    if (!userId || !emoji || typeof intensity !== "number") {
      return NextResponse.json(
        { error: "userId, emoji, and intensity are required" },
        { status: 400 }
      );
    }

    if (intensity < 1 || intensity > 10) {
      return NextResponse.json(
        { error: "intensity must be between 1 and 10" },
        { status: 400 }
      );
    }

    const newEntry: MoodEntry = {
      id: `m${Date.now()}`,
      userId,
      emoji,
      intensity,
      note: note || undefined,
      timestamp: timestamp || new Date().toISOString(),
    };

    // TODO: Save to database
    /*
    const savedEntry = await db.moodEntries.create({
      data: newEntry,
    });
    */

    mockMoodEntries.unshift(newEntry);

    console.log(`[Mood API] Mood logged for user ${userId}: ${emoji} (${intensity}/10)`);

    return NextResponse.json(newEntry, { status: 201 });

  } catch (error) {
    console.error("[Mood API POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mood?userId=X&limit=Y
 * Fetch mood entries
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    // TODO: Fetch from database
    /*
    const entries = await db.moodEntries.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    */

    const userEntries = mockMoodEntries
      .filter((entry) => entry.userId === userId)
      .slice(0, limit);

    return NextResponse.json(
      {
        entries: userEntries,
        count: userEntries.length,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[Mood API GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Commit message: feat: add /api/mood endpoints for logging and fetching mood entries
