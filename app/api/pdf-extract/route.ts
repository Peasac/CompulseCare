import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/pdf-extract
 * Extract text from PDF file
 * Expects multipart/form-data with a "file" field
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamic import to avoid bundling issues - use CommonJS style
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);

    return NextResponse.json({
      text: data.text,
      pages: data.numpages,
      info: data.info,
    });

  } catch (error) {
    console.error("PDF extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract text from PDF" },
      { status: 500 }
    );
  }
}
