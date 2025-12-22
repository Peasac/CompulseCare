import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

/**
 * Example of protected API endpoint
 * GET /api/auth/me - Get current user info
 * Requires: Authorization: Bearer <token>
 */
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid or missing token" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.userId,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Auth verification error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
