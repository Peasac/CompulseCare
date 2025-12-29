import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { JournalEntry } from "@/lib/models";

/**
 * DELETE /api/journal/[id]
 * Delete a specific journal entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Journal entry ID is required" },
        { status: 400 }
      );
    }

    const conn = await connectDB();

    if (!conn) {
      console.warn('[Journal DELETE API] MongoDB not connected - returning error');
      return NextResponse.json(
        { error: "Database not connected" },
        { status: 500 }
      );
    }

    // Delete the journal entry
    const deletedEntry = await JournalEntry.findByIdAndDelete(id).lean();

    if (!deletedEntry) {
      return NextResponse.json(
        { error: "Journal entry not found" },
        { status: 404 }
      );
    }

    console.log(`[Journal DELETE API] Entry ${id} deleted successfully`);

    return NextResponse.json(
      {
        message: "Journal entry deleted successfully",
        entryId: id,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[Journal DELETE API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

