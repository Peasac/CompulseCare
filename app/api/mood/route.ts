import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Mood from "@/lib/models/Mood";

export const dynamic = 'force-dynamic';

/**
 * Mood Tracking API
 * 
 * POST /api/mood - Log a mood entry
 * GET /api/mood?userId=X - Fetch mood entries
 * 
 */

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

    const conn = await connectDB();

    // If MongoDB not connected, return mock response
    if (!conn) {
      console.warn('[Mood API] MongoDB not connected - returning mock response');
      return NextResponse.json(
        {
          id: `mock_${Date.now()}`,
          userId,
          emoji,
          intensity,
          note,
          timestamp: timestamp || new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    const newEntry = await Mood.create({
      userId,
      mood: emoji,
      intensity,
      notes: note,
      createdAt: timestamp ? new Date(timestamp) : undefined,
    });

    console.log(`[Mood API] Mood logged for user ${userId}: ${emoji} (${intensity}/10)`);

    return NextResponse.json(
      {
        id: newEntry._id.toString(),
        userId: newEntry.userId,
        emoji: newEntry.mood,
        intensity: newEntry.intensity,
        note: newEntry.notes,
        timestamp: newEntry.createdAt.toISOString(),
      },
      { status: 201 }
    );

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

    const conn = await connectDB();

    // If MongoDB not connected, return empty array
    if (!conn) {
      console.warn('[Mood API] MongoDB not connected - returning empty entries');
      return NextResponse.json(
        {
          entries: [],
          count: 0,
        },
        { status: 200 }
      );
    }

    const entries = await Mood.find({ userId } as any)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const formattedEntries = entries.map((entry: any) => ({
      id: entry._id.toString(),
      userId: entry.userId,
      emoji: entry.mood,
      intensity: entry.intensity,
      note: entry.notes,
      timestamp: entry.createdAt.toISOString(),
    }));

    return NextResponse.json(
      {
        entries: formattedEntries,
        count: formattedEntries.length,
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
