import { NextRequest, NextResponse } from "next/server";

/**
 * Targets API
 * 
 * GET /api/targets?userId=X - Fetch user's targets
 * PATCH /api/targets/:id - Update target (mark complete, update progress)
 * POST /api/targets - Create new target
 * 
 * TODO: Implement as route with [id] dynamic segment for PATCH
 * TODO: Integrate with database
 * TODO: Add target templates
 */

interface Target {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: "daily" | "weekly";
  progress: number;
  goal: number;
  current: number;
  completed: boolean;
  deadline?: string;
  createdAt: string;
}

// Mock storage
const mockTargets: Target[] = [
  {
    id: "t1",
    userId: "user123",
    title: "No checking rituals",
    description: "Complete the day without checking locks/stove",
    type: "daily",
    progress: 85,
    goal: 1,
    current: 0,
    completed: false,
    deadline: "Today, 11:59 PM",
    createdAt: new Date().toISOString(),
  },
];

/**
 * GET /api/targets?userId=X
 * Fetch all targets for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    // TODO: Fetch from database
    /*
    const targets = await db.targets.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    */

    const userTargets = mockTargets.filter((t) => t.userId === userId);

    return NextResponse.json(
      {
        targets: userTargets,
        count: userTargets.length,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[Targets API GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/targets
 * Create a new target
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, type, goal } = body;

    // Validation
    if (!userId || !title || !type || !goal) {
      return NextResponse.json(
        { error: "userId, title, type, and goal are required" },
        { status: 400 }
      );
    }

    if (!["daily", "weekly"].includes(type)) {
      return NextResponse.json(
        { error: "type must be 'daily' or 'weekly'" },
        { status: 400 }
      );
    }

    const newTarget: Target = {
      id: `t${Date.now()}`,
      userId,
      title,
      description: description || undefined,
      type,
      progress: 0,
      goal,
      current: 0,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // TODO: Save to database
    /*
    const savedTarget = await db.targets.create({
      data: newTarget,
    });
    */

    mockTargets.push(newTarget);

    console.log(`[Targets API] New target created for user ${userId}: ${title}`);

    return NextResponse.json(newTarget, { status: 201 });

  } catch (error) {
    console.error("[Targets API POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// TODO: Implement PATCH endpoint as /api/targets/[id]/route.ts
/*
// File: app/api/targets/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetId = params.id;
    const body = await request.json();
    const { completed, progress, current } = body;

    // Update in database
    const updatedTarget = await db.targets.update({
      where: { id: targetId },
      data: {
        completed: completed !== undefined ? completed : undefined,
        progress: progress !== undefined ? progress : undefined,
        current: current !== undefined ? current : undefined,
      },
    });

    return NextResponse.json(updatedTarget, { status: 200 });

  } catch (error) {
    console.error("[Targets API PATCH] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
*/

// Commit message: feat: add /api/targets endpoints for managing daily and weekly goals
