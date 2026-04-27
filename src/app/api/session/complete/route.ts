import { NextRequest } from "next/server";
import {
  logSession,
  updateAttempted,
  getProgress,
  updateProgress,
} from "@/lib/data";
import { formatDate, getWeekStart } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    // Client-side recordSolved() already handles all tracking
    // This endpoint just acknowledges completion
    // Server-side file operations (logSession, updateAttempted, etc.)
    // don't work in serverless - skip them

    return Response.json({ ok: true, sessionId });
  } catch (error) {
    console.error("Error completing session:", error);
    return Response.json(
      { error: "Failed to complete session" },
      { status: 500 }
    );
  }
}
