import { NextRequest, NextResponse } from "next/server";

/**
 * Auth Middleware for API Routes
 * Validates user authentication and returns userId
 */
export function requireAuth(request: NextRequest): { userId: string } | NextResponse {
  // In production, validate JWT token from Authorization header
  // For now, we accept userId from request body
  
  const userId = request.headers.get("x-user-id");
  
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized - User ID required" },
      { status: 401 }
    );
  }
  
  return { userId };
}

/**
 * Check if request is authenticated
 */
export function isAuthenticated(request: NextRequest): boolean {
  const userId = request.headers.get("x-user-id");
  return !!userId;
}

/**
 * Extract userId from request (body or header)
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  // Check header first
  const headerUserId = request.headers.get("x-user-id");
  if (headerUserId) return headerUserId;
  
  // Check body
  try {
    const body = await request.json();
    return body.userId || null;
  } catch {
    return null;
  }
}
