"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { DsaRound } from "@/types";
import { getSolvedIds, getRecentlyAttemptedIds } from "@/lib/solved-tracker";

function DSARoundPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [round, setRound] = useState<DsaRound | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [experience, setExperience] = useState("");

  const roundId = searchParams.get("roundId");
  const exp = searchParams.get("exp") || "1-3";

  useEffect(() => {
    let cancelled = false;
    const initRound = async () => {
      try {
        setExperience(exp);

        if (roundId) {
          const response = await fetch(`/api/round/read?roundId=${roundId}`);
          if (!response.ok) throw new Error("Failed to fetch round");
          const data = await response.json();
          if (cancelled) return;
          setRound(data);
          setStatus("ready");
        } else {
          const solved = getSolvedIds();
          const recent = getRecentlyAttemptedIds(7);
          const excludeIds = Array.from(new Set([...solved, ...recent]));

          const createRes = await fetch("/api/round/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ experience: exp, excludeIds }),
          });

          if (!createRes.ok) throw new Error("Failed to create round");
          const newRound = await createRes.json();
          if (cancelled) return;
          setRound(newRound);
          setStatus("ready");
          router.replace(`?roundId=${newRound.roundId}&exp=${exp}`);
        }
      } catch (error) {
        console.error("Failed to load round:", error);
        if (!cancelled) setStatus("error");
      }
    };

    initRound();
    return () => { cancelled = true; };
  }, [roundId, exp, router]);

  if (status !== "ready" || !round) {
    if (status === "error") {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <Card className="bg-slate-900 border-slate-800 max-w-md">
            <div className="p-6 flex flex-col items-center gap-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h2 className="text-xl font-bold">Failed to Load Round</h2>
              <p className="text-slate-400 text-center">
                Could not initialize your coding round. Please try again.
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

  const totalMinutes = round.questions.reduce((s, q) => s + q.allocatedMinutes, 0);

  const handleQuestionClick = (index: number) => {
    router.push(`/session/dsa/solve?roundId=${round.roundId}&qIndex=${index}&exp=${experience}`);
  };

  const completedCount = round.questions.filter((q) => q.status === "completed").length;

  const handleSubmitRound = async () => {
    try {
      const reportRes = await fetch("/api/round/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId: round.roundId,
          experience,
        }),
      });

      if (!reportRes.ok) throw new Error("Failed to generate report");

      // Report is now cached server-side — fetch by ID on report page
      router.push(`/report/${round.roundId}`);
    } catch (error) {
      console.error("Error submitting round:", error);
      alert("Failed to submit round. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto w-full mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">DSA Interview Round</h1>
        <p className="text-slate-400">
          Complete {round.questions.length} questions in {totalMinutes} minutes
        </p>
      </div>

      {/* Questions Grid */}
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {round.questions.map((question, idx) => (
          <Card
            key={idx}
            onClick={() => handleQuestionClick(idx)}
            className="bg-slate-900 border-slate-800 hover:border-indigo-500 cursor-pointer transition-all p-6 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">Q{idx + 1}</h3>
                <p className="text-sm text-slate-300 mt-1">{question.problem.title}</p>
              </div>
              {question.status === "completed" ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-slate-600 flex-shrink-0" />
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="border-slate-700 text-xs">
                {question.problem.difficulty}
              </Badge>
              <Badge variant="outline" className="border-slate-700 text-xs flex gap-1">
                <Clock className="w-3 h-3" />
                {question.allocatedMinutes}m
              </Badge>
            </div>

            {question.status === "completed" && question.result && (
              <div className="text-xs text-slate-400">
                Result: <span className="text-slate-200 font-semibold">{question.result}</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Submit Button — always available */}
      <div className="max-w-4xl mx-auto w-full">
        <Button
          onClick={handleSubmitRound}
          disabled={completedCount === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          size="lg"
        >
          {completedCount === 0
            ? "Solve at least 1 question to finish"
            : `Finish Round — Generate Report (${completedCount}/${round.questions.length} done)`}
        </Button>
      </div>
    </div>
  );
}

export default function DSARoundPageWithSuspense() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <DSARoundPage />
    </Suspense>
  );
}
