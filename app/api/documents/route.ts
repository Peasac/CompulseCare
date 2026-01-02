import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ImportedDocument from "@/lib/models/ImportedDocument";
import { summarizeDocument } from "@/lib/gemini";

export const dynamic = 'force-dynamic';

/**
 * Documents API Routes
 * 
 * POST /api/documents - Upload and process document with OCR
 * GET /api/documents?userId=X - Fetch imported documents
 * 
 * NOTE: This is a placeholder. Actual OCR implementation requires:
 * - File upload handling (multipart/form-data)
 * - OCR library (Tesseract.js, Google Vision API, AWS Textract, etc.)
 * - PDF parsing (pdf-parse, pdfjs-dist)
 * 
 * For now, accepts base64-encoded text as proof of concept
 */

/**
 * POST /api/documents
 * Upload document and extract text via OCR
 * 
 * Expected body:
 * {
 *   userId: string,
 *   fileName: string,
 *   fileType: 'pdf' | 'image',
 *   fileUrl?: string,  // Supabase URL of original document
 *   ocrText: string,  // In production, this would be extracted via OCR
 *   generateSummary: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fileName, fileType, fileUrl, ocrText, generateSummary } = body;

    // Validation
    if (!userId || !fileName || !fileType || !ocrText) {
      return NextResponse.json(
        { error: "userId, fileName, fileType, and ocrText are required" },
        { status: 400 }
      );
    }

    if (!['pdf', 'image'].includes(fileType)) {
      return NextResponse.json(
        { error: "fileType must be 'pdf' or 'image'" },
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

    // Optional: Generate summary using LLM
    let summary: string | undefined;
    if (generateSummary && ocrText.length > 100) {
      try {
        summary = await summarizeDocument(ocrText);
      } catch (error) {
        console.error("[Documents API] Summary generation error:", error);
        // Continue without summary
      }
    }

    // Store document
    const document = await ImportedDocument.create({
      userId,
      fileName,
      fileType,
      fileUrl,
      ocrText,
      summary,
      uploadDate: new Date(),
    });

    console.log(`[Documents API] Document imported for user ${userId}: ${document._id}`);

    return NextResponse.json({
      document: {
        id: document._id.toString(),
        userId: document.userId,
        fileName: document.fileName,
        fileType: document.fileType,
        fileUrl: document.fileUrl,
        ocrText: document.ocrText,
        summary: document.summary,
        uploadDate: document.uploadDate.toISOString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error("[Documents API POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents?userId=X
 * Fetch imported documents
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
      return NextResponse.json({
        documents: [],
        count: 0,
      }, { status: 200 });
    }

    // Fetch documents
    const documents = await ImportedDocument.find({ userId } as any)
      .sort({ uploadDate: -1 })
      .lean();

    const formattedDocuments = documents.map((doc: any) => ({
      id: doc._id.toString(),
      userId: doc.userId,
      fileName: doc.fileName,
      fileType: doc.fileType,
      ocrText: doc.ocrText,
      summary: doc.summary,
      uploadDate: doc.uploadDate.toISOString(),
    }));

    return NextResponse.json({
      documents: formattedDocuments,
      count: formattedDocuments.length,
    }, { status: 200 });

  } catch (error) {
    console.error("[Documents API GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
