import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Target from "@/lib/models/Target";

/**
 * PATCH /api/targets/pin/[id]
 * Toggle pin status for a target
 * Request body: { pinned: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { pinned } = body;

    if (typeof pinned !== 'boolean') {
      return NextResponse.json(
        { error: "pinned field must be a boolean" },
        { status: 400 }
      );
    }

    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // If pinning, check if user already has 3 pinned daily or 2 pinned weekly targets
    if (pinned) {
      const targetToPin = await Target.findById(id);
      if (!targetToPin) {
        return NextResponse.json(
          { error: "Target not found" },
          { status: 404 }
        );
      }

      const pinnedCount = await Target.countDocuments({
        userId: targetToPin.userId,
        type: targetToPin.type,
        pinned: true,
      } as any);

      const maxPinned = targetToPin.type === 'daily' ? 3 : 2;
      
      if (pinnedCount >= maxPinned) {
        return NextResponse.json(
          { 
            error: `Maximum ${maxPinned} ${targetToPin.type} targets can be pinned. Unpin one first.`,
            maxPinned,
          },
          { status: 400 }
        );
      }
    }

    // Update pin status
    const updatedTarget = await Target.findByIdAndUpdate(
      id,
      { pinned },
      { new: true }
    );

    if (!updatedTarget) {
      return NextResponse.json(
        { error: "Target not found" },
        { status: 404 }
      );
    }

    console.log(`[Pin Target] Target ${id} ${pinned ? 'pinned' : 'unpinned'}`);

    return NextResponse.json({
      success: true,
      target: {
        _id: updatedTarget._id.toString(),
        title: updatedTarget.title,
        pinned: updatedTarget.pinned,
      },
    });

  } catch (error) {
    console.error("[Pin Target API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
