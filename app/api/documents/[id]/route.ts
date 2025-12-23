import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ImportedDocument from "@/lib/models/ImportedDocument";

/**
 * DELETE /api/documents/[id]
 * Delete a specific document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
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

    // Delete the document
    const result = await ImportedDocument.findByIdAndDelete(documentId);

    if (!result) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    console.log(`[Documents API] Deleted document ${documentId} (${result.fileName})`);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
      fileName: result.fileName,
    });

  } catch (error) {
    console.error("[Documents API] Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
