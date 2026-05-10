"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import nextDynamic from "next/dynamic";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
  Clock,
  Cpu,
  Lightbulb,
  Compass,
  ExternalLink,
} from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { SessionReport, DsaRoundReport } from "@/types";
import TimeAnalysisPanel from "@/components/report/TimeAnalysisPanel";
import FollowUpPanel from "@/components/report/FollowUpPanel";
import CompanyTagsPanel from "@/components/report/CompanyTagsPanel";
import SimilarProblemsPanel from "@/components/report/SimilarProblemsPanel";
import WeaknessPanel from "@/components/report/WeaknessPanel";
import CoachingPanel from "@/components/report/CoachingPanel";
import { recordWeakness } from "@/lib/weakness-tracker";

const MonacoEditor = nextDynamic(() => import("@/components/session/MonacoEditor"), {
  ssr: false,
});

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

// ----- score tier helpers -----
function getTier(score: number): "excellent" | "good" | "needs-work" {
  if (score >= 8) return "excellent";
  if (score >= 6) return "good";
  return "needs-work";
}

const TIER_CONFIG = {
  excellent: {
    label: "Excellent",
    blurb: "Interview-ready. Ship this energy to the real thing.",
    ringFill: "#10b981",
    glow: "shadow-[0_0_60px_-10px_rgba(16,185,129,0.45)]",
    aurora: "report-aurora-emerald",
    chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    text: "text-emerald-300",
  },
  good: {
    label: "Solid",
    blurb: "Strong fundamentals. Sharpen the rough edges below.",
    ringFill: "#f59e0b",
    glow: "shadow-[0_0_60px_-10px_rgba(245,158,11,0.40)]",
    aurora: "report-aurora-amber",
    chip: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    text: "text-amber-300",
  },
  "needs-work": {
    label: "Keep Grinding",
    blurb: "Every rep compounds. Focus on the gaps below.",
    ringFill: "#f43f5e",
    glow: "shadow-[0_0_60px_-10px_rgba(244,63,94,0.40)]",
    aurora: "report-aurora-rose",
    chip: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    text: "text-rose-300",
  },
} as const;

// ----- Score Ring (animated radial) -----
function ScoreRing({
  value,
  max = 10,
  size = 220,
  thickness = 14,
  fill,
  label,
  sublabel,
}: {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  fill: string;
  label?: string;
  sublabel?: string;
}) {
  const data = [{ name: "score", value, fill }];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius={size / 2 - thickness - 6}
          outerRadius={size / 2 - 6}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, max]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: "rgba(51,65,85,0.35)" }}
            dataKey="value"
            cornerRadius={thickness / 2}
            angleAxisId={0}
            isAnimationActive
            animationBegin={150}
            animationDuration={1400}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {label && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">
            {label}
          </span>
        )}
        <div className="flex items-baseline gap-1">
          <span
            className="text-5xl font-black tracking-tight"
            style={{ color: fill }}
          >
            {value.toFixed(1)}
          </span>
          <span className="text-slate-500 font-medium text-base">/{max}</span>
        </div>
        {sublabel && (
          <span className="text-[11px] text-slate-400 mt-1">{sublabel}</span>
        )}
      </div>
    </div>
  );
}

function SubScoreRing({
  value,
  max = 10,
  label,
  fill,
  size = 110,
}: {
  value: number;
  max?: number;
  label: string;
  fill: string;
  size?: number;
}) {
  const data = [{ name: label, value, fill }];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius={size / 2 - 9}
            outerRadius={size / 2 - 2}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, max]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "rgba(51,65,85,0.35)" }}
              dataKey="value"
              cornerRadius={6}
              angleAxisId={0}
              isAnimationActive
              animationBegin={300}
              animationDuration={1300}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xl font-bold" style={{ color: fill }}>
            {value.toFixed(1)}
          </span>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-medium">
        {label}
      </span>
    </div>
  );
}

// ----- Insight card with category tinting -----
const INSIGHT_STYLES = {
  strengths: {
    Icon: CheckCircle2,
    border: "border-emerald-500/25",
    iconBg: "bg-emerald-500/15 text-emerald-300",
    bullet: "text-emerald-400",
    eyebrow: "text-emerald-300",
  },
  issues: {
    Icon: AlertTriangle,
    border: "border-rose-500/25",
    iconBg: "bg-rose-500/15 text-rose-300",
    bullet: "text-rose-400",
    eyebrow: "text-rose-300",
  },
  improvements: {
    Icon: Sparkles,
    border: "border-amber-500/25",
    iconBg: "bg-amber-500/15 text-amber-300",
    bullet: "text-amber-400",
    eyebrow: "text-amber-300",
  },
  missing: {
    Icon: BookOpen,
    border: "border-indigo-500/25",
    iconBg: "bg-indigo-500/15 text-indigo-300",
    bullet: "text-indigo-400",
    eyebrow: "text-indigo-300",
  },
} as const;

function InsightCard({
  kind,
  eyebrow,
  title,
  items,
}: {
  kind: keyof typeof INSIGHT_STYLES;
  eyebrow: string;
  title: string;
  items: string[];
}) {
  const cfg = INSIGHT_STYLES[kind];
  const Icon = cfg.Icon;
  return (
    <Card
      className={`bg-slate-900/60 border ${cfg.border} p-6 report-glass report-hover-lift`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className={`text-[10px] uppercase tracking-[0.2em] font-medium ${cfg.eyebrow}`}>
            {eyebrow}
          </div>
          <h3 className="text-base font-semibold text-white leading-tight">{title}</h3>
        </div>
        <span className="ml-auto text-xs text-slate-500 font-mono">{items.length}</span>
      </div>
      <ul className="space-y-2.5">
        {items.map((s, i) => (
          <li key={i} className="text-sm text-slate-300 leading-relaxed flex gap-2.5">
            <span className={`mt-2 inline-block w-1 h-1 rounded-full shrink-0 ${cfg.bullet} bg-current`} />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ----- Code copy button -----
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(code).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-md border border-slate-700/60 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-600 transition"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function ReportPageWrapper(props: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ReportPage {...props} />
    </Suspense>
  );
}

function ReportPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  const [report, setReport] = useState<(SessionReport & Partial<DsaRoundReport>) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        // Try server-side cache first (preferred)
        const res = await fetch(`/api/report/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setReport(data);
        } else {
          // Fallback: legacy URL data param
          const dataStr = searchParams.get("data");
          if (dataStr) {
            try {
              if (!cancelled) setReport(JSON.parse(decodeURIComponent(dataStr)));
            } catch {
              if (!cancelled) setReport(null);
            }
          }
        }
      } catch {
        if (!cancelled) setReport(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, searchParams]);

  // Record weakness entries on mount
  useEffect(() => {
    if (report && (report as any).questions) {
      const roundReport = report as DsaRoundReport;
      roundReport.questions.forEach((q) => {
        recordWeakness({
          topic: q.problem.topic,
          score: q.score || 0,
          date: new Date().toISOString(),
          problemTitle: q.problem.title,
        });
      });
    }
  }, [report]);

  const tier = useMemo(
    () => (report?.score?.overall != null ? getTier(report.score.overall) : "good"),
    [report?.score?.overall]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <span className="report-typing-dot" />
          <span className="report-typing-dot" />
          <span className="report-typing-dot" />
          <span className="ml-2 font-mono uppercase tracking-[0.2em] text-xs">Loading report</span>
        </div>
      </div>
    );
  }

  if (!report || !report.score?.breakdown || !report.problem || !report.optimalApproach) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="bg-slate-900 border-slate-800 max-w-md">
          <div className="p-6 flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h2 className="text-xl font-bold">Report Not Available</h2>
            <p className="text-slate-400 text-center">
              {report
                ? "This report appears incomplete. Please run a new session."
                : "Could not load your interview report. The session may have expired."}
            </p>
            <Button onClick={() => router.push("/setup")} className="w-full">
              Start New Session
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const tierCfg = TIER_CONFIG[tier];
  const overall = report.score.overall;
  const breakdown = report.score.breakdown;

  const subScores = [
    { key: "correctness", label: "Correctness", value: breakdown.correctness, fill: "#22d3ee" },
    { key: "efficiency", label: "Efficiency", value: breakdown.efficiency, fill: "#a78bfa" },
    { key: "clarity", label: "Clarity", value: breakdown.clarity, fill: "#fbbf24" },
    { key: "completeness", label: "Completeness", value: breakdown.completeness, fill: "#34d399" },
  ];

  const difficulty = report.problem.difficulty;
  const diffChip =
    difficulty === "easy"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : difficulty === "medium"
        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
        : "bg-rose-500/15 text-rose-300 border-rose-500/30";

  return (
    <div className="min-h-screen bg-black text-slate-100">
      {/* Sticky header */}
      <header className="border-b border-slate-800/80 bg-black/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-9 h-9 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500 font-mono">
                <span>Session Report</span>
                <span className="text-slate-700">/</span>
                <span className="text-slate-400">#{report.problem.leetcodeNumber}</span>
              </div>
              <h1 className="text-base sm:text-lg font-semibold text-white truncate">
                {report.problem.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-2.5 py-1 capitalize ${diffChip}`}
            >
              {difficulty}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold border rounded-full px-3 py-1 ${tierCfg.chip}`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: tierCfg.ringFill }}
              />
              {overall.toFixed(1)} · {tierCfg.label}
            </span>
            <Button
              onClick={() => router.push("/setup")}
              className="bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white border-0 h-9"
            >
              Next Session
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero score section */}
      <section className="relative overflow-hidden border-b border-slate-900">
        <div className={`absolute inset-0 ${tierCfg.aurora} pointer-events-none`} />
        <div className="absolute inset-0 report-grid-bg pointer-events-none opacity-60" />
        <div className="relative max-w-6xl mx-auto px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-10 lg:gap-14 items-center">
            {/* Big ring */}
            <div className="flex flex-col items-center lg:items-start gap-4 report-fade-up">
              <div className={`relative report-pulse ${tierCfg.glow}`}>
                <ScoreRing
                  value={overall}
                  fill={tierCfg.ringFill}
                  size={240}
                  thickness={16}
                  label="Overall"
                />
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold border rounded-full px-3 py-1 ${tierCfg.chip}`}>
                <Sparkles className="w-3 h-3" />
                {tierCfg.label}
              </span>
            </div>

            {/* Right side: copy + sub rings */}
            <div className="report-fade-up" style={{ animationDelay: "0.12s" }}>
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500 font-mono mb-2">
                Performance Breakdown
              </div>
              <h2 className="report-shimmer-text text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
                {tierCfg.blurb}
              </h2>
              <p className="text-slate-400 text-sm mt-3 max-w-xl">
                A weighted view of how this session performed across the four pillars
                interviewers care about.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 report-stagger">
                {subScores.map((s) => (
                  <div
                    key={s.key}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/40 report-glass p-4 flex items-center justify-center"
                  >
                    <SubScoreRing value={s.value} label={s.label} fill={s.fill} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Insight grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10 report-stagger">
          {(report.strengths?.length ?? 0) > 0 && (
            <InsightCard
              kind="strengths"
              eyebrow="What Worked"
              title="Strengths"
              items={report.strengths}
            />
          )}
          {(report.issues?.length ?? 0) > 0 && (
            <InsightCard
              kind="issues"
              eyebrow="Friction"
              title="Issues Found"
              items={report.issues}
            />
          )}
          {(report.improvements?.length ?? 0) > 0 && (
            <InsightCard
              kind="improvements"
              eyebrow="Next Time"
              title="Improvements"
              items={report.improvements}
            />
          )}
          {(report.missing?.length ?? 0) > 0 && (
            <InsightCard
              kind="missing"
              eyebrow="Gaps"
              title="What's Missing"
              items={report.missing}
            />
          )}
        </div>

        {/* Per-question AI feedback (DSA round) */}
        {(() => {
          const roundReport = report as DsaRoundReport;
          const qs = roundReport.questions;
          const fb = roundReport.questionFeedback;
          if (!qs?.length || !fb || Object.keys(fb).length === 0) return null;
          return (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/15 text-amber-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300 font-medium">
                    Per-Question Breakdown
                  </div>
                  <h3 className="text-base font-semibold text-white">
                    What the AI saw in your code
                  </h3>
                </div>
              </div>
              <div className="space-y-4">
                {qs.map((q, i) => {
                  const f = fb[i];
                  if (!f) return null;
                  const tone =
                    f.score >= 8
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : f.score >= 6
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-red-500/30 bg-red-500/5";
                  return (
                    <Card
                      key={i}
                      className={`bg-slate-900/60 border ${tone} p-5 report-glass`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-medium mb-1">
                            Q{i + 1} · {q.problem.difficulty} · {q.problem.topic}
                          </div>
                          <h4 className="text-base font-semibold text-white truncate">
                            {q.problem.title}
                          </h4>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <span
                            className={`text-2xl font-mono font-bold tabular-nums ${
                              f.score >= 8
                                ? "text-emerald-300"
                                : f.score >= 6
                                  ? "text-amber-300"
                                  : "text-red-300"
                            }`}
                          >
                            {f.score}/10
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                            {q.result || "—"}
                          </span>
                        </div>
                      </div>
                      {f.feedback && (
                        <p className="text-sm text-slate-300 leading-relaxed mb-4">
                          {f.feedback}
                        </p>
                      )}
                      {(f.strengths?.length || f.issues?.length) && (
                        <div className="grid sm:grid-cols-2 gap-3 mb-4">
                          {(f.strengths?.length ?? 0) > 0 && (
                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
                              <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-[0.18em] text-emerald-300 font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                Strengths
                              </div>
                              <ul className="space-y-1.5 text-xs text-emerald-100/90 leading-relaxed">
                                {f.strengths!.map((s, k) => (
                                  <li key={k} className="flex gap-1.5">
                                    <span className="text-emerald-400 shrink-0">·</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {(f.issues?.length ?? 0) > 0 && (
                            <div className="rounded-lg border border-red-500/20 bg-red-500/[0.04] p-3">
                              <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-[0.18em] text-red-300 font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                Issues
                              </div>
                              <ul className="space-y-1.5 text-xs text-red-100/90 leading-relaxed">
                                {f.issues!.map((s, k) => (
                                  <li key={k} className="flex gap-1.5">
                                    <span className="text-red-400 shrink-0">·</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      {q.code && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-slate-400 hover:text-slate-200 transition uppercase tracking-[0.18em] text-[10px] font-medium">
                            View submitted code
                          </summary>
                          <pre className="mt-2 p-3 rounded-lg bg-black/60 border border-slate-800 text-slate-300 text-xs overflow-auto max-h-64 font-mono leading-relaxed">
{q.code}
                          </pre>
                        </details>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Optimal approach summary + complexity + insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <Card className="lg:col-span-2 bg-slate-900/60 border-slate-800/80 p-6 report-glass">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-500/15 text-violet-300">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-violet-300 font-medium">
                  Optimal Path
                </div>
                <h3 className="text-base font-semibold text-white">Approach Summary</h3>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {report.optimalApproach.summary}
            </p>

            {(report.optimalApproach.timeComplexity || report.optimalApproach.spaceComplexity) && (
              <div className="flex flex-wrap gap-2 mt-5">
                {report.optimalApproach.timeComplexity && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    <Clock className="w-3 h-3" />
                    Time · {report.optimalApproach.timeComplexity}
                  </span>
                )}
                {report.optimalApproach.spaceComplexity && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300">
                    <Cpu className="w-3 h-3" />
                    Space · {report.optimalApproach.spaceComplexity}
                  </span>
                )}
              </div>
            )}
          </Card>

          <Card className="bg-slate-900/60 border-slate-800/80 p-6 report-glass">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/15 text-amber-300">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300 font-medium">
                  Key Insights
                </div>
                <h3 className="text-base font-semibold text-white">Mental Model</h3>
              </div>
            </div>
            {(report.optimalApproach.keyInsights?.length ?? 0) > 0 ? (
              <ul className="space-y-2.5">
                {report.optimalApproach.keyInsights.map((insight, i) => (
                  <li key={i} className="text-sm text-slate-300 leading-relaxed flex gap-2.5">
                    <span className="font-mono text-amber-400/80 text-xs mt-0.5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No additional insights available.</p>
            )}
          </Card>
        </div>

        {/* Optimal code reveal */}
        {report.optimalApproach.code && (
          <div className="report-code-frame mb-10">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-mono">
                  Optimal Solution
                </span>
                <span className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  javascript
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {report.optimalApproach.code.split("\n").length} lines
                </span>
              </div>
              <CopyButton code={report.optimalApproach.code} />
            </div>
            <div className="h-[420px] bg-[#060912]">
              <MonacoEditor
                value={report.optimalApproach.code}
                onChange={() => {}}
                language="javascript"
                height="100%"
                readOnly
              />
            </div>
          </div>
        )}

        {/* Recommended next steps */}
        <Card className="bg-slate-900/60 border-slate-800/80 p-6 report-glass mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/15 text-indigo-300">
              <ChevronRight className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-medium">
                Next Steps
              </div>
              <h3 className="text-base font-semibold text-white">Recommended Path Forward</h3>
            </div>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            {report.recommendation?.shouldRetry && (
              <p className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>
                  <strong className="text-white">Retry this problem</strong> in a few days to
                  solidify the pattern.
                </span>
              </p>
            )}
            {(report.recommendation?.suggestedTopics?.length ?? 0) > 0 && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-[0.18em] mb-2 font-mono">
                  Study these topics
                </p>
                <div className="flex flex-wrap gap-2">
                  {report.recommendation.suggestedTopics?.map((topic) => (
                    <Badge
                      key={topic}
                      variant="secondary"
                      className="bg-slate-800/60 text-slate-200 border border-slate-700 capitalize"
                    >
                      {topic.replace(/-/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {report.recommendation?.nextDifficulty && (
              <p className="flex items-center gap-2">
                <span className="text-slate-400">Next target difficulty:</span>
                <Badge className="capitalize">{report.recommendation.nextDifficulty}</Badge>
              </p>
            )}
          </div>
        </Card>

        {/* Single-question follow-ups (HLD/LLD) — interviewer-style stretch Qs */}
        {report.interviewerFollowUps && report.interviewerFollowUps.length > 0 && !(report as any).questions && (
          <div className="mb-10">
            <FollowUpPanel
              followUps={undefined}
              questions={[]}
              flatFollowUps={report.interviewerFollowUps}
              sessionTitle={report.problem.title}
            />
          </div>
        )}

        {/* Reference article — read after attempting */}
        {report.reference?.url && (
          <a
            href={report.reference.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-10 group"
          >
            <Card className="bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-emerald-500/5 border border-indigo-400/25 p-6 report-glass hover:border-indigo-400/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-indigo-500/20 text-indigo-200 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-medium mb-1">
                    Read the reference breakdown
                  </div>
                  <h3 className="text-[15px] font-semibold text-white mb-0.5 truncate">
                    Deep-dive on {report.problem.title}
                  </h3>
                  <p className="text-[12.5px] text-slate-400 truncate">
                    Curated walkthrough on{" "}
                    <span className="text-indigo-300 font-medium">{report.reference.label}</span>
                    {" — "}now that you've attempted, see how the experts solve it.
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </div>
            </Card>
          </a>
        )}

        {/* DSA Round-specific panels */}
        {(report as any).questions && (
          <div className="space-y-6 report-stagger">
            <TimeAnalysisPanel
              questions={(report as any).questions}
              totalAllocated={(report as any).totalAllocatedMinutes || 0}
              totalTaken={(report as any).totalTimeTakenMinutes || 0}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CompanyTagsPanel questions={(report as any).questions} />
              <SimilarProblemsPanel questions={(report as any).questions} />
            </div>

            <FollowUpPanel
              followUps={(report as any).followUps}
              questions={(report as any).questions}
            />

            <WeaknessPanel />

            <CoachingPanel roundId={sessionId} />
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-3 mt-10 mb-10">
          <Button
            onClick={() => router.push("/setup")}
            className="flex-1 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white border-0"
          >
            <ChevronRight className="w-4 h-4 mr-2" />
            New Session
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="flex-1 h-11 border-slate-700 bg-slate-900/40 hover:bg-slate-800/60 text-slate-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
