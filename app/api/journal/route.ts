import { NextRequest, NextResponse } from "next/server";

/**
 * Journal API Routes
 * 
 * POST /api/journal - Create new journal entry
 * GET /api/journal?userId=X&limit=Y - Fetch journal entries
 * 
 * TODO: Integrate with database (MongoDB, PostgreSQL, Firestore)
 * TODO: Add authentication middleware
 * TODO: Add data validation with Zod
 */

interface JournalEntry {
  id: string;
  userId: string;
  triggers: string[];
  note: string;
  timeSpent: number;
  timestamp: string;
  mood?: string;
}

// In-memory storage for demo (replace with database)
let mockJournalEntries: JournalEntry[] = [
  {
    id: "entry-1",
    userId: "user123",
    triggers: ["Checking", "Intrusive thoughts"],
    note: "Had to check the door locks 5 times before leaving. Felt anxious but managed to leave after breathing exercise.",
    timeSpent: 15,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    mood: "😟",
  },
  {
    id: "entry-2",
    userId: "user123",
    triggers: ["Cleaning"],
    note: "Cleaned kitchen counters repeatedly. Stopped after setting a timer.",
    timeSpent: 30,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    mood: "😌",
  },
];

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

    // Create new entry
    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      userId,
      triggers,
      note: note || "",
      timeSpent,
      timestamp: timestamp || new Date().toISOString(),
      mood: mood || undefined,
    };

    // TODO: Save to database
    /*
    const savedEntry = await db.journalEntries.create({
      data: newEntry,
    });
    */

    // Mock: Add to in-memory array
    mockJournalEntries.unshift(newEntry);

    console.log(`[Journal API] New entry created for user ${userId}`);

    return NextResponse.json(newEntry, { status: 201 });

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

    // TODO: Fetch from database with pagination
    /*
    const entries = await db.journalEntries.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    */

    // Mock: Filter in-memory array
    const userEntries = mockJournalEntries
      .filter((entry) => entry.userId === userId)
      .slice(0, limit);

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

// TODO: Add database integration
/*
Example with Prisma:

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// In POST:
const savedEntry = await prisma.journalEntry.create({
  data: {
    userId,
    triggers,
    note,
    timeSpent,
    timestamp: new Date(timestamp),
    mood,
  },
});

// In GET:
const entries = await prisma.journalEntry.findMany({
  where: { userId },
  orderBy: { timestamp: 'desc' },
  take: limit,
});
*/

// TODO: Add Firebase Firestore integration
/*
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

// In POST:
const docRef = await db.collection('journalEntries').add({
  userId,
  triggers,
  note,
  timeSpent,
  timestamp,
  mood,
});

// In GET:
const snapshot = await db.collection('journalEntries')
  .where('userId', '==', userId)
  .orderBy('timestamp', 'desc')
  .limit(limit)
  .get();

const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
*/

// Commit message: feat: add /api/journal POST and GET endpoints with database integration TODOs
