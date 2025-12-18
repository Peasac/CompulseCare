import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { JournalEntry } from "@/lib/models";

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
    const { userId, triggers, note, timeSpent, timestamp, mood } = body;

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
    await connectDB();

    // Create new entry in MongoDB
    const newEntry = await JournalEntry.create({
      userId,
      compulsion: note || "Compulsion logged",
      triggers,
      timeSpent,
      anxietyLevel: mood ? parseInt(mood) : undefined,
      notes: note,
    });

    console.log(`[Journal API] New entry created for user ${userId}: ${newEntry._id}`);

    return NextResponse.json({
      id: newEntry._id.toString(),
      userId: newEntry.userId,
      triggers: newEntry.triggers,
      note: newEntry.notes || "",
      timeSpent: newEntry.timeSpent,
      timestamp: newEntry.createdAt.toISOString(),
      mood: mood,
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
    await connectDB();

    // Fetch entries from MongoDB
    const entries = await JournalEntry.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Transform to expected format
    const userEntries = entries.map((entry) => ({
      id: entry._id.toString(),
      userId: entry.userId,
      triggers: entry.triggers,
      note: entry.notes || "",
      timeSpent: entry.timeSpent,
      timestamp: entry.createdAt.toISOString(),
      mood: entry.anxietyLevel?.toString(),
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
   MongoDB integration complete - using Mongoose model
  .get();

const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
*/

// Commit message: feat: add /api/journal POST and GET endpoints with database integration TODOs
