import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { JournalEntry } from "@/lib/models";

export const dynamic = 'force-dynamic';

/**
 * Journal API Routes
 * 
 * POST /api/journal - Create new journal entry
 * GET /api/journal?userId=X&limit=Y - Fetch journal entries
 * 
 * Uses MongoDB with Mongoose
 * TODO: Add authentication middleware
 * TODO: Add data validation with Zod
 */

/**
 * POST /api/journal
 * Create a new journal entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, triggers, note, compulsion, timeSpent, timestamp, mood, anxietyLevel, notes } = body;

    // Use compulsion field if provided, otherwise fall back to note
    const activityText = compulsion || note || "No description";

    // Validation
    if (!userId || !triggers || !Array.isArray(triggers) || triggers.length === 0) {
      return NextResponse.json(
        { error: "userId and triggers array are required" },
        { status: 400 }
      );
    }

    if (typeof timeSpent !== "number" || timeSpent < 1) {
      return NextResponse.json(
        { error: "timeSpent must be a positive number" },
        { status: 400 }
      );
    }

    // Connect to database
    const conn = await connectDB();

    // If MongoDB not connected, return mock success
    if (!conn) {
      console.warn('[Journal API] MongoDB not connected - returning mock response');
      return NextResponse.json({
        id: `mock_${Date.now()}`,
        userId,
        triggers,
        note: activityText,
        compulsion: activityText,
        timeSpent,
        timestamp: timestamp || new Date().toISOString(),
        mood: mood,
      }, { status: 201 });
    }

    // Create new entry in MongoDB
    const newEntry = await JournalEntry.create({
      userId,
      compulsion: activityText,
      triggers,
      timeSpent,
      anxietyLevel: anxietyLevel || (mood ? parseInt(mood) : undefined),
      notes: notes || note || "",
    });

    console.log(`[Journal API] New entry created for user ${userId}: ${newEntry._id}`);

    return NextResponse.json({
      entry: {
        _id: newEntry._id.toString(),
        userId: newEntry.userId,
        compulsion: newEntry.compulsion,
        triggers: newEntry.triggers,
        timeSpent: newEntry.timeSpent,
        anxietyLevel: newEntry.anxietyLevel,
        notes: newEntry.notes || "",
        createdAt: newEntry.createdAt.toISOString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error("[Journal API POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/journal?userId=X&limit=Y
 * Fetch journal entries for a user
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

    // Connect to database
    const conn = await connectDB();

    // If MongoDB not connected, return empty array
    if (!conn) {
      console.warn('[Journal API] MongoDB not connected - returning empty entries');
      return NextResponse.json(
        {
          entries: [],
          count: 0,
          userId,
        },
        { status: 200 }
      );
    }

    // Fetch entries from MongoDB
    const entries = await JournalEntry.find({ userId } as any)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Transform to expected format
    const userEntries = entries.map((entry: any) => ({
      id: entry._id.toString(),
      userId: entry.userId,
      activity: entry.compulsion || "No description",
      compulsion: entry.compulsion || "No description",
      category: entry.triggers?.[0] || "Other",
      triggers: entry.triggers,
      notes: entry.notes || "",
      timeSpent: entry.timeSpent,
      timestamp: entry.createdAt.toISOString(),
      createdAt: entry.createdAt.toISOString(),
      anxietyLevel: entry.anxietyLevel,
    }));

    return NextResponse.json(
      {
        entries: userEntries,
        count: userEntries.length,
        userId,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[Journal API GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
