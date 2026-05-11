"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import nextDynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Save, ArrowLeft } from "lucide-react";
import { SessionStartResponse, HLDScenario, HLDFormData } from "@/types";
import SessionTimer from "@/components/session/SessionTimer";
import HLDTemplate from "@/components/session/HLDTemplate";
import HLDDesignHints from "@/components/session/HLDDesignHints";
import { recordSolved } from "@/lib/solved-tracker";

const ExcalidrawCanvas = nextDynamic(
  () => import("@/components/session/ExcalidrawCanvas").then((mod) => ({ default: mod.ExcalidrawCanvas })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-96 bg-slate-800" />,
  }
);

const STORAGE_KEY_PREFIX = "hld-form-";

function HLDDesignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionData, setSessionData] = useState<SessionStartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hldFormData, setHldFormData] = useState<HLDFormData>({
    functionalReqs: "",
    nonFunctionalReqs: "",
    entities: "",
    apiDesign: "",
    nfrPlan: "",
  });
  const excalidrawRef = useRef<any>(null);

  const sessionId = searchParams.get("sessionId");
  const experience = searchParams.get("exp") || "1-3";

  useEffect(() => {
    const initSession = async () => {
      try {
        if (!sessionId) {
          throw new Error("Missing sessionId");
        }

        // Try localStorage first (from hld/read page)
        const cached = localStorage.getItem(`hld-session-${sessionId}`);
        if (cached) {
          setSessionData(JSON.parse(cached));
          setLoading(false);
          return;
        }

        // Fallback to API if not in localStorage
        const response = await fetch(`/api/session/read?sessionId=${sessionId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch session data");
        }

        const data = await response.json();
        setSessionData(data);

        // Load form state from sessionStorage
        const savedForm = localStorage.getItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
        if (savedForm) {
          setHldFormData(JSON.parse(savedForm));
        }
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [sessionId]);

  // Auto-save form state every 30s
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${sessionId}`, JSON.stringify(hldFormData));
    }, 30000);

    return () => clearInterval(interval);
  }, [sessionId, hldFormData]);

  const handleTimerExpire = async () => {
    await handleHLDSubmit();
  };

  const handleHLDSubmit = async () => {
    if (!sessionData || !sessionData.scenario) return;

    // Validate: require either a diagram OR meaningful form content
    const excalidrawDescription = excalidrawRef.current?.getDescription?.() || "No diagram provided";
    const hasDiagram =
      excalidrawDescription !== "No diagram provided" &&
      excalidrawDescription.trim().length > 10;
    const filledFields = Object.values(hldFormData).filter(
      (v) => typeof v === "string" && v.trim().length >= 10
    ).length;

    if (!hasDiagram && filledFields === 0) {
      alert(
        "Please draw your architecture in the canvas, or fill in at least one section of the design template (functional/non-functional/entities/API/NFR plan) before submitting."
      );
      return;
    }
    if (!hasDiagram && filledFields < 2) {
      const proceed = confirm(
        `Only ${filledFields} of 5 sections has meaningful content and you haven't drawn a diagram. The AI report quality will be limited. Submit anyway?`
      );
      if (!proceed) return;
    }

    setSubmitting(true);

    try {

      // Build combined diagram description
      const diagramDescription = `
Functional Requirements:
${hldFormData.functionalReqs}

Non-Functional Requirements:
${hldFormData.nonFunctionalReqs}

Core Entities:
${hldFormData.entities}

API Design:
${hldFormData.apiDesign}

NFR Deep Dives:
${hldFormData.nfrPlan}

Architecture Diagram:
${excalidrawDescription}
`.trim();

      // Record session completion
      const startTime = new Date(sessionData.startedAt).getTime();
      const endTime = Date.now();
      const timeMinutes = Math.round((endTime - startTime) / 60000);

      const completeRes = await fetch("/api/session/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          problemId: sessionData.scenario.id,
          topic: "system-design",
          result: "solved",
          score: 3,
          timeMinutes,
          notes: "",
          difficulty: sessionData.scenario.difficulty,
        }),
      });

      if (!completeRes.ok) throw new Error("Failed to complete session");

      // Record locally for the dashboard
      recordSolved({
        problemId: sessionData.scenario.id,
        title: sessionData.scenario.title,
        leetcodeNumber: 0,
        topic: "system-design",
        difficulty: sessionData.scenario.difficulty,
        result: "solved",
        date: new Date().toISOString(),
        track: "hld",
      });

      // Generate HLD report
      const reportRes = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          type: "hld",
          scenario: sessionData.scenario,
          diagramDescription,
          experience,
          timeTakenMinutes: timeMinutes,
          allocatedMinutes: Math.round(sessionData.duration / 60),
        }),
      });

      if (!reportRes.ok) throw new Error("Failed to generate report");

      const report = await reportRes.json();

      // Clear saved form data
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${sessionData.sessionId}`);

      // Redirect to report
      setTimeout(() => {
        router.push(`/report/${sessionData.sessionId}`);
      }, 1000);
    } catch (error) {
      console.error("Error submitting HLD session:", error);
      alert("Failed to submit session. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
      </div>
    );
  }

  if (!sessionData || !sessionData.scenario) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="bg-slate-900 border-slate-800 max-w-md">
          <div className="p-6 flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h2 className="text-xl font-bold">Session Expired</h2>
            <p className="text-slate-400 text-center">
              Your session is no longer available — this can happen after the server restarts.
              Please start a new session.
            </p>
            <Button onClick={() => router.push("/setup")} className="w-full">
              Start New Session
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const scenario = sessionData.scenario;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-black/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(
                `/session/hld/read?sessionId=${sessionData.sessionId}&exp=${experience}`
              )
            }
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            title="Back to problem statement"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            View Problem
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{scenario.title}</h1>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="border-slate-700">
                {scenario.difficulty}
              </Badge>
              <Badge variant="outline" className="border-slate-700">
                system-design
              </Badge>
            </div>
          </div>

          <SessionTimer durationSeconds={sessionData.duration} onExpire={handleTimerExpire} />
        </div>
      </div>

      {/* Design Hints - Sticky below header */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-4">
        <HLDDesignHints scenario={scenario} />
      </div>

      {/* Main Content — Split Pane */}
      <div className="flex-1 flex gap-6 max-w-7xl mx-auto w-full px-6 py-4 overflow-hidden">
        {/* Left Panel — 40% */}
        <div className="w-[40%] flex-shrink-0 overflow-hidden">
          <HLDTemplate
            scenario={scenario}
            value={hldFormData}
            onChange={setHldFormData}
          />
        </div>

        {/* Right Panel — 60% */}
        <div className="w-[60%] flex flex-col gap-3 min-w-0 overflow-hidden">
          {/* Canvas Title */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">High Level Design</h2>
            <span className="text-xs text-slate-500">Draw your architecture below</span>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden min-h-0 bg-[#F2F3F2] rounded-lg">
            <ExcalidrawCanvas ref={excalidrawRef} />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleHLDSubmit}
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {submitting ? "Submitting to AI..." : "Submit Design"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function HLDDesignPageWithSuspense() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <HLDDesignPage />
    </Suspense>
  );
}
