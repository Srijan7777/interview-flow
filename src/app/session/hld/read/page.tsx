"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronRight, BookOpen } from "lucide-react";
import { HLDScenario, SessionStartResponse } from "@/types";
import SessionTimer from "@/components/session/SessionTimer";
import HLDDesignHints from "@/components/session/HLDDesignHints";
import ExampleArchitectures from "@/components/session/ExampleArchitectures";

function HLDReadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionData, setSessionData] = useState<SessionStartResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const initSession = async () => {
      try {
        // If URL has sessionId (e.g. coming back from design page), restore it
        const existingId = searchParams.get("sessionId");
        if (existingId) {
          const cached = localStorage.getItem(`hld-session-${existingId}`);
          if (cached) {
            if (!cancelled) {
              setSessionData(JSON.parse(cached));
              setStatus("ready");
            }
            return;
          }
          // Cached miss → try API
          const res = await fetch(`/api/session/read?sessionId=${existingId}`);
          if (res.ok) {
            const data = await res.json();
            if (!cancelled) {
              setSessionData(data);
              localStorage.setItem(`hld-session-${data.sessionId}`, JSON.stringify(data));
              setStatus("ready");
            }
            return;
          }
          // Fall through to creating a new session if restore failed
        }

        const difficultyRaw = searchParams.get("difficulty");
        const difficulty = difficultyRaw
          ? difficultyRaw.split(",").filter(Boolean)
          : undefined;
        const response = await fetch("/api/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "hld",
            experience: searchParams.get("exp") || "1-3",
            ...(difficulty && difficulty.length > 0 ? { difficulty } : {}),
          }),
        });
        if (!response.ok) throw new Error("Failed to start session");
        const data = await response.json();
        if (cancelled) return;
        if (!data?.scenario) throw new Error("Invalid session response");
        setSessionData(data);
        localStorage.setItem(`hld-session-${data.sessionId}`, JSON.stringify(data));
        setStatus("ready");

        // Pin sessionId in URL so back-nav restores the same scenario
        const params = new URLSearchParams(searchParams.toString());
        if (!params.get("sessionId")) {
          params.set("sessionId", data.sessionId);
          router.replace(`/session/hld/read?${params.toString()}`);
        }
      } catch (error) {
        console.error("Failed to start session:", error);
        if (!cancelled) setStatus("error");
      }
    };

    initSession();
    return () => { cancelled = true; };
  }, [searchParams, router]);

  if (status !== "ready" || !sessionData?.scenario) {
    if (status === "error") {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <Card className="bg-slate-900 border-slate-800 max-w-md">
            <div className="p-6 flex flex-col items-center gap-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h2 className="text-xl font-bold">Failed to Load Scenario</h2>
              <p className="text-slate-400 text-center">
                Could not load the HLD scenario. Please try again.
              </p>
              <Button onClick={() => router.push("/setup")} className="w-full">
                Back to Setup
              </Button>
            </div>
          </Card>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
      </div>
    );
  }

  const scenario = sessionData.scenario;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-black/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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

          <SessionTimer durationSeconds={sessionData.duration} onExpire={() => {}} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 overflow-y-auto">
        <div className="space-y-8">
          {/* Design Hints - Sticky at top */}
          <HLDDesignHints scenario={scenario} />

          {/* Problem Statement */}
          <Card className="bg-slate-900 border-slate-800 p-8">
            <div className="flex gap-3 items-start mb-6">
              <BookOpen className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-4">Problem Statement</h2>
                <p className="text-slate-300 text-base leading-relaxed">{scenario.prompt}</p>
              </div>
            </div>

            {/* Requirements */}
            <div className="mt-8 pt-8 border-t border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4">Requirements</h3>
              <ul className="space-y-3">
                {scenario.requirements.map((req, idx) => (
                  <li key={idx} className="flex gap-3 text-slate-300">
                    <span className="text-indigo-400 font-bold flex-shrink-0">✓</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Example Architectures */}
          <ExampleArchitectures scenario={scenario} />

          {/* CTA */}
          <div className="flex gap-3">
            <Button
              onClick={() => router.push(`/setup`)}
              variant="outline"
              className="flex-1 border-slate-700"
            >
              Back
            </Button>
            <Button
              onClick={() =>
                router.push(
                  `/session/hld/design?sessionId=${sessionData.sessionId}&exp=${
                    searchParams.get("exp") || "1-3"
                  }`
                )
              }
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              Start Designing
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HLDReadPageWithSuspense() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <HLDReadPage />
    </Suspense>
  );
}
