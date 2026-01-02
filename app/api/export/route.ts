import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { JournalEntry, Mood, Target, PanicEvent, CheckIn, ImportedDocument } from "@/lib/models";
import { generateCheckInReflection } from "@/lib/gemini";
import { analyzeBehavioralPatterns, getTopInsights } from "@/lib/behavioral-insights";
import { jsPDF } from "jspdf";

export const dynamic = 'force-dynamic';

/**
 * GET /api/export
 * Generate and download a comprehensive report with:
 * - User summary data
 * - AI behavioral insights
 * - Check-in reflections
 * - Imported document summaries
 * 
 * Query params:
 * - userId: string (required)
 * - format: 'json' | 'text' (optional, default: 'text')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const format = searchParams.get("format") || "text";

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Fetch all user data
    const [journalEntries, moods, targets, panicEvents, checkIns, documents] = await Promise.all([
      JournalEntry.find({ userId }).sort({ createdAt: -1 }).lean(),
      Mood.find({ userId }).sort({ createdAt: -1 }).lean(),
      Target.find({ userId }).sort({ createdAt: -1 }).lean(),
      PanicEvent.find({ userId }).sort({ createdAt: -1 }).lean(),
      CheckIn.find({ userId }).sort({ createdAt: -1 }).lean(),
      ImportedDocument.find({ userId }).sort({ uploadDate: -1 }).lean(),
    ]);

    // Generate insights
    const analysis = await analyzeBehavioralPatterns({
      journalEntries,
      moods,
      targets,
      panicEvents,
    });
    const insights = getTopInsights(analysis, 5);

    // Generate check-in reflection
    let checkInReflection = "No check-in data available.";
    if (checkIns.length > 0) {
      try {
        checkInReflection = await generateCheckInReflection(checkIns);
      } catch (error) {
        console.error("Error generating check-in reflection:", error);
        checkInReflection = "Check-in data recorded for longitudinal tracking.";
      }
    }

    // Calculate summary stats
    const stats = {
      totalEntries: journalEntries.length,
      totalMoodLogs: moods.length,
      totalTargets: targets.length,
      completedTargets: targets.filter((t) => t.completed).length,
      totalPanicEvents: panicEvents.length,
      totalCheckIns: checkIns.length,
      totalDocuments: documents.length,
      dateRange: {
        earliest: journalEntries.length > 0
          ? new Date(journalEntries[journalEntries.length - 1].createdAt).toLocaleDateString()
          : "N/A",
        latest: journalEntries.length > 0
          ? new Date(journalEntries[0].createdAt).toLocaleDateString()
          : "N/A",
      },
    };

    if (format === "json") {
      // Return structured JSON
      return NextResponse.json({
        userId,
        generatedAt: new Date().toISOString(),
        stats,
        insights: insights.slice(0, 5).map((i) => ({
          pattern: i.pattern,
          category: i.category,
          confidence: i.confidence,
          statistics: i.statistics,
        })),
        checkInReflection,
        recentEntries: journalEntries.slice(0, 10).map((e) => ({
          date: new Date(e.createdAt).toLocaleDateString(),
          activity: e.activity,
          category: e.category,
        })),
        documents: documents.map((d) => ({
          fileName: d.fileName,
          uploadDate: new Date(d.uploadDate).toLocaleDateString(),
          summary: d.summary || "No summary available",
        })),
      });
    }

    // Generate text report
    let report = `CompulseCare - Personal Report
Generated: ${new Date().toLocaleDateString()}
User ID: ${userId}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Journal Entries: ${stats.totalEntries}
Total Mood Logs: ${stats.totalMoodLogs}
Total Targets: ${stats.totalTargets} (${stats.completedTargets} completed)
Total Panic Events: ${stats.totalPanicEvents}
Total Check-Ins: ${stats.totalCheckIns}
Imported Documents: ${stats.totalDocuments}

Date Range: ${stats.dateRange.earliest} to ${stats.dateRange.latest}

`;

    // Add behavioral insights
    if (insights.length > 0) {
      report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEHAVIORAL INSIGHTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
      insights.slice(0, 5).forEach((insight, index) => {
        report += `${index + 1}. [${insight.category}] (Confidence: ${Math.round(insight.confidence * 100)}%)
   ${insight.pattern}

`;
      });
    }

    // Add check-in reflection
    if (checkIns.length > 0) {
      report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHECK-IN REFLECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${checkInReflection}

Recent Check-In Scores:
`;
      checkIns.slice(0, 5).forEach((checkIn) => {
        report += `  ${new Date(checkIn.createdAt).toLocaleDateString()} - Total Score: ${checkIn.totalScore}\n`;
      });
      report += '\n';
    }

    // Add imported documents
    if (documents.length > 0) {
      report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTED DOCUMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
      documents.forEach((doc, index) => {
        report += `${index + 1}. ${doc.fileName} (${new Date(doc.uploadDate).toLocaleDateString()})
   ${doc.summary || "No summary available"}

`;
      });
    }

    // Add recent entries
    if (journalEntries.length > 0) {
      report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECENT JOURNAL ENTRIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
      journalEntries.slice(0, 10).forEach((entry) => {
        report += `${new Date(entry.createdAt).toLocaleDateString()} - ${entry.activity} (${entry.category})\n`;
      });
    }

    report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

End of Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPos = 20;
    const lineHeight = 7;

    // Helper function to add text with auto page break
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, maxWidth);
      
      for (const line of lines) {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, margin, yPos);
        yPos += lineHeight;
      }
    };

    const addSection = (title: string) => {
      yPos += 5;
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setDrawColor(100);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
      addText(title, 14, true);
      yPos += 3;
    };

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("CompulseCare - Personal Report", margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | User ID: ${userId}`, margin, yPos);
    doc.setTextColor(0);
    yPos += 15;

    // Summary Statistics
    addSection("SUMMARY STATISTICS");
    addText(`Total Journal Entries: ${stats.totalEntries}`);
    addText(`Total Mood Logs: ${stats.totalMoodLogs}`);
    addText(`Total Targets: ${stats.totalTargets} (${stats.completedTargets} completed)`);
    addText(`Total Panic Events: ${stats.totalPanicEvents}`);
    addText(`Total Check-Ins: ${stats.totalCheckIns}`);
    addText(`Imported Documents: ${stats.totalDocuments}`);
    addText(`Date Range: ${stats.dateRange.earliest} to ${stats.dateRange.latest}`);

    // Behavioral Insights
    if (insights.length > 0) {
      addSection("BEHAVIORAL INSIGHTS");
      insights.slice(0, 5).forEach((insight, index) => {
        addText(`${index + 1}. [${insight.category}] (${Math.round(insight.confidence * 100)}% confidence)`, 10, true);
        addText(`   ${insight.pattern}`);
        yPos += 2;
      });
    }

    // Check-in Reflection
    if (checkIns.length > 0) {
      addSection("CHECK-IN REFLECTION");
      addText(checkInReflection);
      yPos += 5;
      addText("Recent Check-In Scores:", 10, true);
      checkIns.slice(0, 5).forEach((checkIn) => {
        addText(`  ${new Date(checkIn.createdAt).toLocaleDateString()} - Total Score: ${checkIn.totalScore}`);
      });
    }

    // Imported Documents
    if (documents.length > 0) {
      addSection("IMPORTED DOCUMENTS");
      documents.forEach((docItem, index) => {
        addText(`${index + 1}. ${docItem.fileName} (${new Date(docItem.uploadDate).toLocaleDateString()})`, 10, true);
        addText(`   ${docItem.summary || "No summary available"}`);
        yPos += 2;
      });
    }

    // Recent Journal Entries
    if (journalEntries.length > 0) {
      addSection("RECENT JOURNAL ENTRIES");
      journalEntries.slice(0, 10).forEach((entry) => {
        addText(`${new Date(entry.createdAt).toLocaleDateString()} - ${entry.activity} (${entry.category})`);
      });
    }

    // Footer
    yPos += 10;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("This report is for personal tracking purposes only and does not constitute medical advice.", margin, yPos);

    // Get PDF as buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Return as downloadable PDF file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compulsecare-report-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Error generating export:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
