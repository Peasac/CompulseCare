import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Target from "@/lib/models/Target";

export async function POST(req: NextRequest) {
  try {
    console.log('[Cleanup] Starting cleanup...');
    await connectDB();
    console.log('[Cleanup] Connected to DB');
    
    const body = await req.json();
    const userId = body.userId;
    
    console.log('[Cleanup] User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Get all targets for this user
    const allTargets = await Target.find({ userId }).sort({ createdAt: -1 });
    console.log(`[Cleanup] Found ${allTargets.length} total targets for user ${userId}`);

    // Keep only the 10 most recent targets
    const targetsToKeep = allTargets.slice(0, 10).map(t => t._id);
    
    // Delete the rest
    const result = await Target.deleteMany({
      userId,
      _id: { $nin: targetsToKeep }
    });
    
    console.log(`[Cleanup] Deleted ${result.deletedCount} old targets`);

    // Get remaining targets and show pinned status
    const remaining = await Target.find({ userId }).sort({ createdAt: -1 });
    const pinnedCount = remaining.filter(t => t.pinned).length;
    
    const response = {
      success: true,
      deleted: result.deletedCount,
      remaining: remaining.length,
      pinnedCount,
      targets: remaining.map(t => ({
        id: t._id.toString(),
        title: t.title,
        type: t.type,
        pinned: t.pinned || false,
        completed: t.completed,
        createdAt: t.createdAt
      }))
    };
    
    console.log('[Cleanup] Response:', JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[Cleanup] Error:", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
