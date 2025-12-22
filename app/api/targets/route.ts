import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Target from "@/lib/models/Target";

/**
 * Targets API
 * 
 * GET /api/targets?userId=X - Fetch user's targets
 * PATCH /api/targets/:id - Update target (mark complete, update progress)
 * POST /api/targets - Create new target
 * 
 * TODO: Implement as route with [id] dynamic segment for PATCH
 */

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

    const conn = await connectDB();

    // If MongoDB not connected, return empty array
    if (!conn) {
      console.warn('[Targets API] MongoDB not connected - returning empty targets');
      return NextResponse.json(
        {
          targets: [],
          count: 0,
        },
        { status: 200 }
      );
    }

    const targets = await Target.find({ userId } as any)
      .sort({ createdAt: -1 })
      .lean();

    const formattedTargets = targets.map((target: any) => ({
      id: target._id.toString(),
      _id: target._id.toString(),
      userId: target.userId,
      title: target.title,
      description: target.description,
      type: target.type,
      progress: target.completed ? 100 : 0,
      goal: target.goal,
      current: target.completed ? target.goal : 0,
      completed: target.completed,
      pinned: target.pinned || false,
      deadline: target.type === "daily" ? "Today, 11:59 PM" : "This Week",
      createdAt: target.createdAt.toISOString(),
    }));

    return NextResponse.json(
      {
        targets: formattedTargets,
        count: formattedTargets.length,
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
    const { userId, title, description, type, goal, pinned } = body;

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

    const conn = await connectDB();

    // If MongoDB not connected, return mock response
    if (!conn) {
      console.warn('[Targets API] MongoDB not connected - returning mock response');
      return NextResponse.json(
        {
          id: `mock_${Date.now()}`,
          userId,
          title,
          description,
          type,
          progress: 0,
          goal,
          current: 0,
          completed: false,
          pinned: pinned || false,
          createdAt: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    const newTarget = await Target.create({
      userId,
      title,
      description,
      type,
      targetType: "reduction",
      goal,
      completed: false,
      pinned: pinned || false,
    });

    console.log(`[Targets API] New target created for user ${userId}: ${title} (pinned: ${pinned})`);

    return NextResponse.json(
      {
        id: newTarget._id.toString(),
        _id: newTarget._id.toString(),
        userId: newTarget.userId,
        title: newTarget.title,
        description: newTarget.description,
        type: newTarget.type,
        progress: 0,
        goal: newTarget.goal,
        current: 0,
        completed: false,
        pinned: newTarget.pinned || false,
        createdAt: newTarget.createdAt.toISOString(),
      },
      { status: 201 }
    );

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
