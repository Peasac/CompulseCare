import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/debug-gemini
 * Debug endpoint to test Gemini API connection
 */
export async function GET(request: NextRequest) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
  
  const diagnostics = {
    apiKeySet: !!GEMINI_API_KEY,
    apiKeyLength: GEMINI_API_KEY.length,
    apiKeyPreview: GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 8)}...` : "NOT SET",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  };

  // If no API key, return early
  if (!GEMINI_API_KEY) {
    return NextResponse.json({
      error: "GEMINI_API_KEY not set in environment variables",
      diagnostics,
      fix: "Add GEMINI_API_KEY to your .env or .env.local file",
    }, { status: 400 });
  }

  // Test with a simple prompt
  try {
    const testPrompt = "Say 'Hello' in one word.";
    const model = "gemini-2.5-flash"; // Use latest 2.5 model
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: testPrompt }] }],
      }),
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      return NextResponse.json({
        error: "Gemini API request failed",
        status: response.status,
        statusText: response.statusText,
        diagnostics,
        response: responseData,
      }, { status: response.status });
    }

    const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return NextResponse.json({
      success: true,
      diagnostics,
      test: {
        model,
        prompt: testPrompt,
        response: text,
        fullResponse: responseData,
      },
    });

  } catch (error: any) {
    return NextResponse.json({
      error: "Error testing Gemini API",
      message: error.message,
      stack: error.stack,
      diagnostics,
    }, { status: 500 });
  }
}

