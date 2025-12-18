import { NextRequest, NextResponse } from "next/server";
import { getPanicSupport } from "@/lib/gemini";

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
 * - message: string (supportive LLM-generated message)
 * - suggestions: string[] (actionable suggestions)
 * 
 * TODO: Store panic events in database for analytics
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

    // TODO: Save panic event to database
    /*
    await db.panicEvents.create({
      userId,
      triggerType,
      context,
      llmResponse: support,
      timestamp: new Date(),
    });
    */

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
        message: "You're safe. We're having a technical issue, but please reach out to someone you trust if you need immediate support.",
        suggestions: [
          "Take slow, deep breaths",
          "You are safe right now",
          "This feeling will pass",
        ],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Commit message: feat: add /api/panic endpoint with OpenAI integration stubs and mock response
