import { NextRequest } from "next/server";
import { generateDSAReport, generateHLDReport, generateLLDReport } from "@/lib/claude";
import { generateDSAReportGroq, generateHLDReportGroq, generateLLDReportGroq } from "@/lib/groq";
import { reportCache } from "@/lib/report-cache";
import { SessionReport } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      type,
      problem,
      code,
      diagramDescription,
      experience,
      timeTakenMinutes,
      allocatedMinutes,
      scenario,
    } = body;

    if (!sessionId || !type || !experience || timeTakenMinutes == null || !allocatedMinutes) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let report: SessionReport;
    const useGroq = !!process.env.GROQ_API_KEY;

    if (type === "dsa") {
      if (!problem || !code) {
        return Response.json(
          { error: "DSA report requires problem and code" },
          { status: 400 }
        );
      }

      if (useGroq) {
        try {
          report = await generateDSAReportGroq({
            problem,
            code,
            experience,
            timeTakenMinutes,
            allocatedMinutes,
          });
        } catch (err) {
          console.error("Groq failed, falling back to Claude:", err);
          report = await generateDSAReport({
            problem,
            code,
            experience,
            timeTakenMinutes,
            allocatedMinutes,
          });
        }
      } else {
        report = await generateDSAReport({
          problem,
          code,
          experience,
          timeTakenMinutes,
          allocatedMinutes,
        });
      }
    } else if (type === "hld") {
      if (!scenario || !diagramDescription) {
        return Response.json(
          { error: "HLD report requires scenario and diagramDescription" },
          { status: 400 }
        );
      }

      if (useGroq) {
        try {
          report = await generateHLDReportGroq({
            title: scenario.title,
            problemContext: scenario.prompt || "",
            requirements: scenario.requirements,
            diagramDescription,
            experience,
            timeTakenMinutes,
            referenceUrl: scenario.referenceUrl,
            referenceLabel: scenario.referenceLabel,
          });
        } catch (err) {
          console.error("Groq failed, falling back to Claude:", err);
          report = await generateHLDReport({
            title: scenario.title,
            requirements: scenario.requirements,
            diagramDescription,
            experience,
            timeTakenMinutes,
            referenceUrl: scenario.referenceUrl,
            referenceLabel: scenario.referenceLabel,
          });
        }
      } else {
        report = await generateHLDReport({
          title: scenario.title,
          requirements: scenario.requirements,
          diagramDescription,
          experience,
          timeTakenMinutes,
          referenceUrl: scenario.referenceUrl,
          referenceLabel: scenario.referenceLabel,
        });
      }
    } else if (type === "lld") {
      if (!scenario || !code) {
        return Response.json(
          { error: "LLD report requires scenario and code" },
          { status: 400 }
        );
      }

      if (useGroq) {
        try {
          report = await generateLLDReportGroq({
            title: scenario.title,
            requirements: scenario.requirements,
            code,
            experience,
            timeTakenMinutes,
            referenceUrl: scenario.referenceUrl,
            referenceLabel: scenario.referenceLabel,
          });
        } catch (err) {
          console.error("Groq failed, falling back to Claude:", err);
          report = await generateLLDReport({
            title: scenario.title,
            requirements: scenario.requirements,
            code,
            experience,
            timeTakenMinutes,
            referenceUrl: scenario.referenceUrl,
            referenceLabel: scenario.referenceLabel,
          });
        }
      } else {
        report = await generateLLDReport({
          title: scenario.title,
          requirements: scenario.requirements,
          code,
          experience,
          timeTakenMinutes,
          referenceUrl: scenario.referenceUrl,
          referenceLabel: scenario.referenceLabel,
        });
      }
    } else {
      return Response.json({ error: "Invalid type" }, { status: 400 });
    }

    // Add sessionId to report
    report.sessionId = sessionId;

    reportCache.set(sessionId, report);
    return Response.json(report);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    console.error("[/api/report] Error generating report:", {
      message: errMsg,
      stack: errStack,
      timestamp: new Date().toISOString(),
    });
    return Response.json(
      {
        error: "Failed to generate report",
        detail: process.env.NODE_ENV === "production" ? undefined : errMsg,
      },
      { status: 500 }
    );
  }
}
