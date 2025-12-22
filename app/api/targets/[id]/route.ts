import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Target from "@/lib/models/Target";

/**
 * PATCH /api/targets/[id]
 * Update a specific target (e.g., mark as complete/incomplete)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { completed } = body;

    if (typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "completed field must be a boolean" },
        { status: 400 }
      );
    }

    const conn = await connectDB();

    if (!conn) {
      console.warn('[Targets PATCH API] MongoDB not connected - returning error');
      return NextResponse.json(
        { error: "Database not connected" },
        { status: 500 }
      );
    }

    // Update the target
    const updatedTarget = await Target.findByIdAndUpdate(
      id,
      { completed },
      { new: true }
    ).lean();

    if (!updatedTarget) {
      return NextResponse.json(
        { error: "Target not found" },
        { status: 404 }
      );
    }

    console.log(`[Targets PATCH API] Target ${id} updated: completed = ${completed}`);

    return NextResponse.json(
      {
        target: {
          id: updatedTarget._id.toString(),
          userId: updatedTarget.userId,
          title: updatedTarget.title,
          description: updatedTarget.description,
          type: updatedTarget.type,
          goal: updatedTarget.goal,
          completed: updatedTarget.completed,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[Targets PATCH API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/targets/[id]
 * Delete a specific target
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const conn = await connectDB();

    if (!conn) {
      console.warn('[Targets DELETE API] MongoDB not connected - returning error');
      return NextResponse.json(
        { error: "Database not connected" },
        { status: 500 }
      );
    }

    // Delete the target
    const deletedTarget = await Target.findByIdAndDelete(id).lean();

    if (!deletedTarget) {
      return NextResponse.json(
        { error: "Target not found" },
        { status: 404 }
      );
    }

    console.log(`[Targets DELETE API] Target ${id} deleted successfully`);

    return NextResponse.json(
      {
        message: "Target deleted successfully",
        targetId: id,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[Targets DELETE API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
