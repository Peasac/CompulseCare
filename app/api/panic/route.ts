import { NextRequest, NextResponse } from "next/server";
import { getPanicSupport } from "@/lib/gemini";
import connectDB from "@/lib/mongodb";
import { PanicEvent } from "@/lib/models";

export const dynamic = 'force-dynamic';

/**
 * POST /api/panic
 * Server-side endpoint for panic mode LLM support using Google Gemini
 * 
 * Request body:
 * - userId: string
 * - triggerType: string (e.g., "panic_button", "anxiety_spike")
 * - context?: string (optional additional context)
 * 
 * Response:
 * - message: string (short, calming reassurance - max 2 sentences)
 * 
 * Uses MongoDB to store panic events
 * TODO: Add rate limiting to prevent abuse
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, triggerType, context } = body;

    // Validation
    if (!userId || !triggerType) {
      return NextResponse.json(
        { error: "userId and triggerType are required" },
        { status: 400 }
      );
    }

    // Call Gemini API for supportive message
    const contextString = context || `User activated panic button (${triggerType})`;
    const support = await getPanicSupport(contextString);

    // Connect to database and save event (optional)
    const conn = await connectDB();
    if (conn) {
      try {
        await PanicEvent.create({
          userId,
          duration: 0,
          completed: false,
        });
      } catch (dbError) {
        console.warn('[Panic API] Failed to save to MongoDB:', dbError);
      }
    }

    console.log(`[Panic API] User ${userId} activated panic mode: ${triggerType}`);

    return NextResponse.json(
      {
        ...support,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[Panic API] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "You handled that moment with care. It's okay to take things slowly right now.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Commit message: feat: add /api/panic endpoint with OpenAI integration stubs and mock response
