"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import nextDynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, Play } from "lucide-react";
import { DsaRound, SessionTestResult } from "@/types";
import SessionTimer from "@/components/session/SessionTimer";
import ProblemStatement from "@/components/session/ProblemStatement";
import TestCasePanel from "@/components/session/TestCasePanel";
import TimeUpModal from "@/components/session/TimeUpModal";
import { recordSolved } from "@/lib/solved-tracker";

const MonacoEditor = nextDynamic(() => import("@/components/session/MonacoEditor"), {
  ssr: false,
  loading: () => <Skeleton className="h-96 bg-slate-800" />,
});

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

export default function DSASolvePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <DSASolvePage />
    </Suspense>
  );
}

function DSASolvePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [round, setRound] = useState<DsaRound | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [testResults, setTestResults] = useState<SessionTestResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [experience, setExperience] = useState("");
  const [selfMarkedSolved, setSelfMarkedSolved] = useState(false);

  const roundId = searchParams.get("roundId");
  const qIndex = parseInt(searchParams.get("qIndex") || "0");
  const exp = searchParams.get("exp") || "1-3";

  useEffect(() => {
    const initSolve = async () => {
      try {
        setLoading(true);
        setExperience(exp);

        // Reset state on question change
        setTestResults(null);
        setShowResults(false);
        setShowTimeUp(false);
        setSelfMarkedSolved(false);

        if (!roundId) throw new Error("Missing roundId");

        const response = await fetch(`/api/round/read?roundId=${roundId}`);
        if (!response.ok) throw new Error("Failed to fetch round");

        const data = await response.json();
        setRound(data);

        // Restore saved language for this question, else default to javascript
        const savedLang = localStorage.getItem(`round-${roundId}-q${qIndex}-lang`) || "javascript";
        setLanguage(savedLang);

        const savedCode = localStorage.getItem(`round-${roundId}-q${qIndex}`);
        if (savedCode) {
          setCode(savedCode);
        } else {
          const { getCodeStub } = await import("@/lib/problem-stubs");
          const stub = getCodeStub(data.questions[qIndex].problem.leetcodeNumber, savedLang);
          setCode(stub);
        }
      } catch (error) {
        console.error("Failed to load solve page:", error);
      } finally {
        setLoading(false);
      }
    };

    initSolve();
  }, [roundId, qIndex, exp]);

  // Auto-save code
  useEffect(() => {
    const interval = setInterval(() => {
      if (roundId && code) {
        localStorage.setItem(`round-${roundId}-q${qIndex}`, code);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [roundId, qIndex, code]);

  const handleTimerExpire = () => {
    setShowTimeUp(true);
  };

  const handleLanguageChange = async (newLanguage: string) => {
    setLanguage(newLanguage);
    if (!round || !roundId) return;

    // Persist language choice
    localStorage.setItem(`round-${roundId}-q${qIndex}-lang`, newLanguage);

    const { getCodeStub } = await import("@/lib/problem-stubs");
    const stub = getCodeStub(round.questions[qIndex].problem.leetcodeNumber, newLanguage);
    setCode(stub);
    localStorage.removeItem(`round-${roundId}-q${qIndex}`);
    setTestResults(null);
    setShowResults(false);
  };

  const handleRunTests = async () => {
    if (!round) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          problemId: round.questions[qIndex].problem.leetcodeNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Failed to run tests");
        return;
      }

      setIsDraft(!!result.draft);
      setTestResults(result);
      setShowResults(true);
    } catch (error) {
      console.error("Error running tests:", error);
      alert("Failed to run tests");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!round) return;

    setSubmitting(true);
    try {
      // Run tests first
      const testResponse = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          problemId: round.questions[qIndex].problem.leetcodeNumber,
        }),
      });

      const testResult = await testResponse.json();

      if (!testResponse.ok) {
        alert(testResult.error || "Failed to run tests");
        setSubmitting(false);
        return;
      }

      // Draft = no canonical test cases yet. AI report still grades the code at round end.
      // Treat as review-only so self-mark + AI grading kicks in.
      if (testResult.draft) {
        setIsDraft(true);
      }

      const reviewOnly =
        !!testResult.draft ||
        (testResult.results?.length > 0 &&
          testResult.results.every(
            (r: any) => r.error === "Auto-check not available for this curated problem yet."
          ));
      const allPassed = !reviewOnly && testResult.passed === testResult.total && testResult.total > 0;
      // Review-mode: trust user's self-mark if they confirmed solved
      const result: "solved" | "partial" | "stuck" = reviewOnly
        ? (selfMarkedSolved ? "solved" : "partial")
        : allPassed ? "solved" : "partial";

      const timeTaken = Math.round(
        (Date.now() - new Date(round.startedAt).getTime()) / 60000
      );

      // Update round with this question's result
      const updateRes = await fetch("/api/round/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId,
          questionIndex: qIndex,
          code,
          language,
          result,
          timeTakenMinutes: timeTaken,
          testPassed: testResult.passed,
          testTotal: testResult.total,
          score: allPassed ? 3 : 2,
        }),
      });

      if (!updateRes.ok) throw new Error("Failed to update round");

      // Track in solved history (client-side)
      recordSolved({
        problemId: round.questions[qIndex].problem.id,
        title: round.questions[qIndex].problem.title,
        leetcodeNumber: round.questions[qIndex].problem.leetcodeNumber,
        topic: round.questions[qIndex].problem.topic,
        difficulty: round.questions[qIndex].problem.difficulty,
        result,
        date: new Date().toISOString(),
        track: "dsa",
      });

      // Keep code + language persisted so user can revisit
      localStorage.setItem(`round-${roundId}-q${qIndex}`, code);
      localStorage.setItem(`round-${roundId}-q${qIndex}-lang`, language);

      // Always return to round page after submit — user chooses next
      router.push(`/session/dsa/round?roundId=${roundId}&exp=${experience}`);
    } catch (error) {
      console.error("Error submitting question:", error);
      alert("Failed to submit question. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!round || !round.questions[qIndex]) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="bg-slate-900 border-slate-800 max-w-md">
          <div className="p-6 flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h2 className="text-xl font-bold">Failed to Load Question</h2>
            <Button onClick={() => router.push("/setup")} className="w-full">
              Back to Setup
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const question = round.questions[qIndex];
  const allocatedSeconds = question.allocatedMinutes * 60;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-black/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/session/dsa/round?roundId=${roundId}&exp=${experience}`)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex-1">
            <div className="text-sm text-slate-400 mb-1">
              Question {qIndex + 1} of {round.questions.length}
            </div>
            <h1 className="text-lg font-bold text-white">{question.problem.title}</h1>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="border-slate-700">
                {question.problem.difficulty}
              </Badge>
              <Badge variant="outline" className="border-slate-700">
                {question.problem.topic.replace(/-/g, " ")}
              </Badge>
            </div>
          </div>

          <SessionTimer
            key={qIndex}
            durationSeconds={allocatedSeconds}
            onExpire={handleTimerExpire}
          />
        </div>
      </div>

      {/* Main Content — Split Pane */}
      <div className="flex-1 flex gap-6 max-w-7xl mx-auto w-full px-6 py-6 overflow-hidden">
        {/* Left Panel — 45% */}
        <div className="w-[45%] flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
          <ProblemStatement problem={question.problem} />
        </div>

        {/* Right Panel — 55% */}
        <div className="w-[55%] flex flex-col gap-4 min-w-0 overflow-hidden">
          {/* Language Selector */}
          <div className="flex gap-3 items-center">
            <label className="text-sm font-semibold text-slate-300 whitespace-nowrap">Language:</label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Editor */}
          <Card className="bg-slate-900 border-slate-800 flex-1 overflow-hidden min-h-0">
            <MonacoEditor value={code} onChange={setCode} language={language} />
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button
                onClick={handleRunTests}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                {submitting ? "Running..." : "Run"}
              </Button>
              <Button
                onClick={handleSubmitQuestion}
                disabled={submitting}
                title={isDraft ? "No canonical test cases yet — AI will grade your code at round end" : undefined}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isDraft ? "Submit for AI review" : "Submit Question"}
              </Button>
            </div>

            {/* Verdict Banner */}
            {showResults && testResults && (() => {
              const isDraftBanner = (testResults as any).draft === true;
              const reviewOnly =
                isDraftBanner ||
                (testResults.results.length > 0 &&
                  testResults.results.every(
                    (r: any) => r.error === "Auto-check not available for this curated problem yet."
                  ));
              return (
                <div
                  className={`p-3 rounded-lg border text-sm font-semibold ${
                    reviewOnly
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      : testResults.passed === testResults.total
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                  }`}
                >
                  <div>
                    {isDraftBanner
                      ? "No canonical test cases yet — submit for AI review. AI grades your code at round end."
                      : reviewOnly
                        ? "Review mode — no auto-check for this problem. Verify with sample inputs manually."
                        : testResults.passed === testResults.total
                          ? `✓ Accepted — ${testResults.passed}/${testResults.total} test cases passed`
                          : testResults.results.some((r) => r.error)
                            ? "✗ Compilation Error"
                            : `✗ Wrong Answer — ${testResults.passed}/${testResults.total} test cases passed`}
                  </div>
                  {reviewOnly && (
                    <label className="flex items-center gap-2 mt-2 text-xs font-normal cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selfMarkedSolved}
                        onChange={(e) => setSelfMarkedSolved(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500"
                      />
                      <span className="text-amber-200">
                        I verified my solution works on the example inputs (mark as solved)
                      </span>
                    </label>
                  )}
                </div>
              );
            })()}

            {/* Test Cases */}
            {showResults && testResults && (
              <div className="flex-1 min-h-0 overflow-hidden">
                <TestCasePanel
                  results={testResults.results}
                  running={submitting}
                  passed={testResults.passed}
                  total={testResults.total}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time Up Modal */}
      {showTimeUp && (
        <TimeUpModal
          questionTitle={question.problem.title}
          onSubmit={handleSubmitQuestion}
          onSkip={() => {
            setShowTimeUp(false);
            router.push(`/session/dsa/round?roundId=${roundId}&exp=${experience}`);
          }}
        />
      )}
    </div>
  );
}
