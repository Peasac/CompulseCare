import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ImportedDocument from "@/lib/models/ImportedDocument";
import { analyzeDocuments } from "@/lib/gemini";

/**
 * GET /api/documents/analyze?userId=X
 * Analyze all uploaded documents for OCD-related insights
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
    if (!conn) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Fetch all user documents
    const documents = await ImportedDocument.find({ userId } as any)
      .sort({ uploadDate: -1 })
      .limit(10) // Limit to most recent 10 documents
      .lean();

    if (documents.length === 0) {
      return NextResponse.json({
        analysis: "No documents uploaded yet. Upload therapy notes, assessments, or related documents to get AI insights.",
        documentCount: 0,
      });
    }

    // Analyze documents with AI
    const analysis = await analyzeDocuments(
      documents.map((doc: any) => ({
        ocrText: doc.ocrText,
        fileName: doc.fileName,
      }))
    );

    console.log(`[Document Analysis] Analyzed ${documents.length} documents for user ${userId}`);

    return NextResponse.json({
      analysis,
      documentCount: documents.length,
      documents: documents.map((doc: any) => ({
        fileName: doc.fileName,
        uploadDate: doc.uploadDate,
        summary: doc.summary,
      })),
    });

  } catch (error) {
    console.error("[Document Analysis API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
