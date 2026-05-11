"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import nextDynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Play } from "lucide-react";
import { SessionStartResponse, SessionTestResult } from "@/types";
import SessionTimer from "@/components/session/SessionTimer";
import ProblemStatement from "@/components/session/ProblemStatement";
import TestCasePanel from "@/components/session/TestCasePanel";

const MonacoEditor = nextDynamic(() => import("@/components/session/MonacoEditor"), {
  ssr: false,
  loading: () => <Skeleton className="h-96 bg-slate-800" />,
});

interface PageProps {
  params: Promise<{ type: string }>;
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

export default function SessionPageWrapper(props: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SessionPage {...props} />
    </Suspense>
  );
}

function SessionPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionData, setSessionData] = useState<SessionStartResponse | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<SessionTestResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [sessionType, setSessionType] = useState("");
  const [experience, setExperience] = useState("");
  const [language, setLanguage] = useState("javascript");

  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      try {
        const resolvedParams = await params;
        const exp = searchParams.get("exp") || "1-3";
        const difficulty = searchParams.get("difficulty");
        const diffSuffix = difficulty ? `&difficulty=${encodeURIComponent(difficulty)}` : "";

        // Route HLD/LLD/DSA to their proper pages
        if (resolvedParams.type === "hld") {
          setRedirecting(true);
          router.replace(`/session/hld/read?exp=${exp}${diffSuffix}`);
          return;
        }
        if (resolvedParams.type === "lld") {
          setRedirecting(true);
          router.replace(`/session/lld/read?exp=${exp}${diffSuffix}`);
          return;
        }
        if (resolvedParams.type === "dsa") {
          setRedirecting(true);
          router.replace(`/session/dsa/round?exp=${exp}`);
          return;
        }

        setSessionType(resolvedParams.type);
        setExperience(exp);

        const response = await fetch("/api/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: resolvedParams.type,
            experience: exp,
          }),
        });

        const data = await response.json();
        setSessionData(data);

        if (data.problem) {
          const savedCode = localStorage.getItem(`code-${data.sessionId}`);
          if (savedCode) {
            setCode(savedCode);
          } else {
            const { getCodeStub } = await import("@/lib/problem-stubs");
            const stub = getCodeStub(data.problem.leetcodeNumber, "javascript");
            setCode(stub);
          }
        }
      } catch (error) {
        console.error("Failed to start session:", error);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [params, searchParams, router]);

  // Auto-save code every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionData && code) {
        localStorage.setItem(`code-${sessionData.sessionId}`, code);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [sessionData, code]);

  const handleTimerExpire = async () => {
    await submitSession("stuck");
  };

  const handleLanguageChange = async (newLanguage: string) => {
    setLanguage(newLanguage);

    if (!sessionData || !sessionData.problem) return;

    const { getCodeStub } = await import("@/lib/problem-stubs");
    const stub = getCodeStub(sessionData.problem.leetcodeNumber, newLanguage);
    setCode(stub);
    setTestResults(null);
    setShowResults(false);
  };

  const handleRunTests = async () => {
    if (!sessionData || !sessionData.problem) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          problemId: sessionData.problem.leetcodeNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Failed to run tests");
        return;
      }

      setTestResults(result);
      setShowResults(true);
    } catch (error) {
      console.error("Error running tests:", error);
      alert("Failed to run tests");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (result: "solved" | "partial" | "stuck" = "solved") => {
    if (!sessionData || !sessionData.problem) return;

    setSubmitting(true);

    try {
      // Run tests first
      const testResponse = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          problemId: sessionData.problem.leetcodeNumber,
        }),
      });

      const testResult = await testResponse.json();

      if (!testResponse.ok) {
        alert(testResult.error || "Failed to run tests");
        setSubmitting(false);
        return;
      }

      setTestResults(testResult);
      setShowResults(true);

      // Determine outcome based on test results
      const allPassed = testResult.passed === testResult.total;
      const finalResult: "solved" | "partial" | "stuck" = allPassed ? "solved" : "partial";

      // Record session completion
      const startTime = new Date(sessionData.startedAt).getTime();
      const endTime = Date.now();
      const timeMinutes = Math.round((endTime - startTime) / 60000);

      const completeRes = await fetch("/api/session/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          problemId: sessionData.problem.id,
          topic: sessionData.problem.topic,
          result: finalResult,
          score: allPassed ? 3 : 2,
          timeMinutes,
          notes: "",
          difficulty: sessionData.problem.difficulty,
        }),
      });

      if (!completeRes.ok) throw new Error("Failed to complete session");

      // Generate report
      const reportRes = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          type: "dsa",
          problem: sessionData.problem,
          code,
          experience,
          timeTakenMinutes: timeMinutes,
          allocatedMinutes: Math.round(sessionData.duration / 60),
        }),
      });

      if (!reportRes.ok) throw new Error("Failed to generate report");

      const report = await reportRes.json();

      // Clear saved code
      localStorage.removeItem(`code-${sessionData.sessionId}`);

      // Redirect to report after brief delay to show verdict
      setTimeout(() => {
        router.push(`/report/${sessionData.sessionId}`);
      }, 1500);
    } catch (error) {
      console.error("Error submitting session:", error);
      alert("Failed to submit session. Please try again.");
      setSubmitting(false);
    }
  };

  const submitSession = (result: "solved" | "partial" | "stuck") => {
    handleSubmit(result);
  };

  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
      </div>
    );
  }

  if (!sessionData || !sessionData.problem) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="bg-slate-900 border-slate-800 max-w-md">
          <div className="p-6 flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h2 className="text-xl font-bold">Failed to Load Session</h2>
            <p className="text-slate-400 text-center">
              Could not initialize your interview session. Please try again.
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
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header with Timer */}
      <div className="border-b border-slate-800 bg-black/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{sessionData.problem.title}</h1>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="border-slate-700">
                {sessionData.problem.difficulty}
              </Badge>
              <Badge variant="outline" className="border-slate-700">
                {sessionData.problem.topic.replace(/-/g, " ")}
              </Badge>
            </div>
          </div>

          <SessionTimer durationSeconds={sessionData.duration} onExpire={handleTimerExpire} />
        </div>
      </div>

      {/* Main Content — Split Pane */}
      <div className="flex-1 flex gap-6 max-w-7xl mx-auto w-full px-6 py-6 overflow-hidden">
        {/* Left Panel — 45% */}
        <div className="w-[45%] flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
          <ProblemStatement problem={sessionData.problem} />
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

          {/* Action Buttons & Results */}
          <div className="flex flex-col gap-3">
            {/* Action Buttons */}
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
                onClick={() => submitSession("solved")}
                disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Submit
              </Button>
            </div>

            {/* Submit Verdict Banner */}
            {showResults && testResults && (
              (() => {
                const reviewOnly =
                  testResults.results.length > 0 &&
                  testResults.results.every(
                    (result) => result.error === "Auto-check not available for this curated problem yet."
                  );

                return (
              <div
                className={`p-3 rounded-lg border text-sm font-semibold ${
                  reviewOnly
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : testResults.passed === testResults.total
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : testResults.results.some((r) => r.error)
                        ? "bg-red-500/10 border-red-500/30 text-red-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                {reviewOnly
                  ? "Review mode - this curated problem does not have an executable harness yet."
                  : testResults.passed === testResults.total
                    ? `✓ Accepted — ${testResults.passed}/${testResults.total} test cases passed`
                    : testResults.results.some((r) => r.error)
                      ? "✗ Compilation Error"
                      : `✗ Wrong Answer — ${testResults.passed}/${testResults.total} test cases passed`}
              </div>
                );
              })()
            )}

            {/* Test Cases Panel */}
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
    </div>
  );
}
