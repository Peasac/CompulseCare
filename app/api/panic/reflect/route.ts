import { NextRequest, NextResponse } from "next/server";
import { getPanicReflection } from "@/lib/gemini";

/**
 * POST /api/panic/reflect
 * LLM reflection endpoint for post-panic processing
 * 
 * Request body:
 * - userId: string
 * - reflection: string (user's written reflection about the panic moment)
 * 
 * Response:
 * - reflection: string (1-2 sentence calm, reflective response)
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, reflection } = body;

    // Validation
    if (!userId || !reflection) {
      return NextResponse.json(
        { error: "userId and reflection are required" },
        { status: 400 }
      );
    }

    // Call Gemini API for reflective response
    const reflectionResponse = await getPanicReflection(reflection);

    console.log(`[Panic Reflect API] User ${userId} submitted reflection`);

    return NextResponse.json(
      {
        reflection: reflectionResponse,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[Panic Reflect API] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        reflection: "Thank you for sharing. That took courage.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
