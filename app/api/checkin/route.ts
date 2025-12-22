import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CheckIn from "@/lib/models/CheckIn";
import { generateCheckInReflection } from "@/lib/gemini";

/**
 * CheckIn API Routes
 * 
 * POST /api/checkin - Create new check-in response
 * GET /api/checkin?userId=X&limit=Y&withReflection=true - Fetch check-in history with optional LLM reflection
 * 
 * Stores self-reported symptom responses with numeric scores only
 * No clinical labels or diagnoses
 */

// Standard check-in questions
export const CHECK_IN_QUESTIONS = [
  { id: 'anxiety', question: 'How would you rate your overall anxiety today?', category: 'anxiety' },
  { id: 'compulsion-urge', question: 'How strong were your compulsion urges today?', category: 'compulsion-urge' },
  { id: 'control', question: 'How much control did you feel over compulsions today?', category: 'control' },
  { id: 'functioning', question: 'How well were you able to function in daily activities?', category: 'functioning' },
  { id: 'sleep', question: 'How would you rate your sleep quality?', category: 'sleep' },
];

/**
 * POST /api/checkin
 * Submit check-in responses
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, responses, notes } = body;

    // Validation
    if (!userId || !responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { error: "userId and responses array are required" },
        { status: 400 }
      );
    }

    // Validate each response
    for (const response of responses) {
      if (!response.question || typeof response.response !== 'number' || !response.category) {
        return NextResponse.json(
          { error: "Each response must have question, response (number), and category" },
          { status: 400 }
        );
      }
      if (response.response < 0 || response.response > 10) {
        return NextResponse.json(
          { error: "Response values must be between 0 and 10" },
          { status: 400 }
        );
      }
    }

    // Calculate total score
    const totalScore = responses.reduce((sum: number, r: any) => sum + r.response, 0);

    const conn = await connectDB();

    if (!conn) {
      console.warn('[CheckIn API] MongoDB not connected - returning mock response');
      return NextResponse.json({
        checkIn: {
          id: `mock_${Date.now()}`,
          userId,
          responses,
          totalScore,
          notes: notes || "",
          createdAt: new Date().toISOString(),
        }
      }, { status: 201 });
    }

    // Create check-in
    const checkIn = await CheckIn.create({
      userId,
      responses,
      totalScore,
      notes: notes || "",
    });

    console.log(`[CheckIn API] New check-in created for user ${userId}: ${checkIn._id}`);

    return NextResponse.json({
      checkIn: {
        id: checkIn._id.toString(),
        userId: checkIn.userId,
        responses: checkIn.responses,
        totalScore: checkIn.totalScore,
        notes: checkIn.notes,
        createdAt: checkIn.createdAt.toISOString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error("[CheckIn API POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/checkin?userId=X&limit=Y&withReflection=true
 * Fetch check-in history with optional LLM-generated reflection
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const withReflection = searchParams.get("withReflection") === "true";

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const conn = await connectDB();

    if (!conn) {
      console.warn('[CheckIn API] MongoDB not connected - returning empty');
      return NextResponse.json({
        checkIns: [],
        count: 0,
        reflection: null,
      }, { status: 200 });
    }

    // Fetch check-ins
    const checkIns = await CheckIn.find({ userId } as any)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const formattedCheckIns = checkIns.map((checkIn: any) => ({
      id: checkIn._id.toString(),
      userId: checkIn.userId,
      responses: checkIn.responses,
      totalScore: checkIn.totalScore,
      notes: checkIn.notes,
      createdAt: checkIn.createdAt.toISOString(),
    }));

    // Generate LLM reflection if requested and enough data
    let reflection = null;
    if (withReflection && checkIns.length >= 2) {
      try {
        reflection = await generateCheckInReflection(checkIns);
      } catch (error) {
        console.error("[CheckIn API] Error generating reflection:", error);
        reflection = "Unable to generate reflection at this time.";
      }
    }

    return NextResponse.json({
      checkIns: formattedCheckIns,
      count: formattedCheckIns.length,
      reflection,
    }, { status: 200 });

  } catch (error) {
    console.error("[CheckIn API GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
