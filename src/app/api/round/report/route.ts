import { NextRequest } from "next/server";
import { roundCache } from "@/lib/round-cache";
import { reportCache } from "@/lib/report-cache";
import { generateRoundReport } from "@/lib/groq";
import { generateRoundReportSamba } from "@/lib/sambanova";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roundId, experience } = body;

    const round = roundCache.get(roundId);
    if (!round) {
      return Response.json(
        { error: "Round not found" },
        { status: 404 }
      );
    }

    // DSA round routing: SambaNova → Groq
    const useSamba = !!process.env.SAMBANOVA_API_KEY;
    let report;
    if (useSamba) {
      try {
        report = await generateRoundReportSamba(round, experience);
      } catch (errSamba) {
        console.error("SambaNova round failed, falling back to Groq:", errSamba);
        report = await generateRoundReport(round, experience);
      }
    } else {
      report = await generateRoundReport(round, experience);
    }

    round.status = "completed";
    roundCache.set(roundId, round);

    // Cache report by roundId so report page can fetch by ID (no URL bloat)
    reportCache.set(roundId, report);

    return Response.json(report);
  } catch (error) {
    console.error("Error generating round report:", error);
    return Response.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
