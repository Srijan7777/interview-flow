"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import {
  Binary,
  Network,
  Layers3,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Target,
  RefreshCw,
  ArrowUpRight,
  CircleSlash2,
  TrendingDown,
} from "lucide-react";
import { getWeakTopics } from "@/lib/weakness-tracker";

type Difficulty = "easy" | "medium" | "hard";
const ALL_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

type BankPreviewProblem = {
  id: string;
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  companies: string[];
  interviewSignal: string;
};

const EXPERIENCE_LEVELS = [
  { value: "0-1", label: "0–1 yr", desc: "New grad / intern", band: "L3" },
  { value: "1-3", label: "1–3 yrs", desc: "Early career", band: "L4" },
  { value: "3-5", label: "3–5 yrs", desc: "Mid-level", band: "L5" },
  { value: "5+", label: "5+ yrs", desc: "Senior · Staff", band: "L6+" },
];

const INTERVIEW_TYPES = [
  {
    id: "dsa",
    label: "DSA",
    desc: "Algorithms · Data structures",
    icon: Binary,
    blurb: "Curated bank, weak-topic radar, executed by Judge0.",
    timer: "20 / 35 / 45 min",
    available: true,
  },
  {
    id: "hld",
    label: "HLD",
    desc: "High-Level Design",
    icon: Network,
    blurb: "16+ scenarios. Excalidraw canvas. Difficulty filter.",
    timer: "45 min",
    available: true,
  },
  {
    id: "lld",
    label: "LLD",
    desc: "Low-Level Design",
    icon: Layers3,
    blurb: "OOP + concurrency. Upload zips for a full critique.",
    timer: "60 min",
    available: true,
  },
  {
    id: "full",
    label: "Full Mock",
    desc: "3-Round combined",
    icon: Sparkles,
    blurb: "Coding + design + behavioral, back-to-back.",
    timer: "Soon",
    available: false,
  },
];

export default function SetupPage() {
  const router = useRouter();
  const [experience, setExperience] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty[]>([...ALL_DIFFICULTIES]);
  const [bankPreview, setBankPreview] = useState<BankPreviewProblem[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const showsDifficulty = type === "hld" || type === "lld";

  const toggleDifficulty = (d: Difficulty) => {
    setDifficulty((prev) => {
      if (prev.includes(d)) {
        // require at least one
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== d);
      }
      return [...prev, d];
    });
  };

  const handleStart = () => {
    if (!experience || !type) return;
    const params = new URLSearchParams({ exp: experience });
    if (showsDifficulty && difficulty.length > 0 && difficulty.length < 3) {
      params.set("difficulty", difficulty.join(","));
    } else if (showsDifficulty && difficulty.length === ALL_DIFFICULTIES.length) {
      // all selected — pass nothing (server treats absent as "all")
    }
    router.push(`/session/${type}?${params.toString()}`);
  };

  const loadBankPreview = async () => {
    setLoadingPreview(true);
    try {
      const response = await fetch("/api/problems/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 5 }),
      });
      if (!response.ok) return;
      const data = await response.json();
      setBankPreview(data.problems || []);
    } catch (error) {
      console.error("Failed to load DSA bank preview:", error);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (type === "dsa") loadBankPreview();
  }, [type]);

  const ready = experience && type;

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-slate-200">
      {/* Atmosphere */}
      <div aria-hidden className="pointer-events-none fixed inset-0 mk-grid opacity-[0.45]" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-gradient-to-b from-indigo-500/[0.08] via-transparent to-transparent" />
      <div aria-hidden className="pointer-events-none fixed -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-600/[0.08] blur-[120px]" />
      <div aria-hidden className="pointer-events-none fixed -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.05] blur-[120px]" />

      {/* Header */}
      <nav className="relative z-20 border-b border-white/5 backdrop-blur-md bg-black/30">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="grid place-items-center w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_0_24px_-6px_rgba(99,102,241,0.8)]">
              <span className="text-[11px] font-black text-white tracking-tight">IF</span>
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              Interview<span className="text-indigo-300">Flow</span>
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <Link
              href="/dashboard"
              className="text-[13px] text-slate-400 hover:text-white transition mk-link"
            >
              Dashboard
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-[13px] text-slate-400 hover:text-white transition mk-link"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 py-14 lg:py-20">
        {/* Eyebrow + title */}
        <div className="mb-12">
          <div className="mk-rise mk-rise-1 mk-eyebrow mb-4">— Configure session</div>
          <h1 className="mk-rise mk-rise-2 mk-display text-[44px] sm:text-[60px] lg:text-[76px] tracking-tighter mk-text-fade max-w-3xl">
            Pick your loop. We'll bring the heat.
          </h1>
          <p className="mk-rise mk-rise-3 mt-5 max-w-xl text-[15px] text-slate-400 leading-relaxed">
            Three controls. No signup. The clock starts the moment you hit
            <span className="mk-mono text-slate-300"> start session</span>.
          </p>
        </div>

        {/* Stats row */}
        <div className="mk-rise mk-rise-3 mb-14">
          <StatsRow />
        </div>

        {/* Step 1 — Experience */}
        <Step
          n="01"
          title="Experience"
          hint="Calibrates problem depth and pacing."
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {EXPERIENCE_LEVELS.map((exp) => {
              const active = experience === exp.value;
              return (
                <button
                  key={exp.value}
                  onClick={() => setExperience(exp.value)}
                  className={`group relative text-left p-5 rounded-lg border transition-all overflow-hidden ${
                    active
                      ? "border-indigo-400/60 bg-gradient-to-b from-indigo-500/15 to-violet-500/5"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
                  }`}
                >
                  {active && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-4 h-4 text-indigo-300" strokeWidth={2.5} />
                    </div>
                  )}
                  <div className="mk-mono text-[10.5px] uppercase tracking-wider text-slate-500 mb-2.5">
                    {exp.band}
                  </div>
                  <div
                    className={`text-[20px] mk-display tracking-tight mb-1 ${
                      active ? "text-white" : "text-slate-100"
                    }`}
                  >
                    {exp.label}
                  </div>
                  <div className="text-[12.5px] text-slate-400">{exp.desc}</div>
                </button>
              );
            })}
          </div>
        </Step>

        {/* Step 2 — Type */}
        <Step
          n="02"
          title="Track"
          hint="Each track is its own ritual. Pick the one you'll regret skipping."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INTERVIEW_TYPES.map((t) => {
              const Icon = t.icon;
              const active = type === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => t.available && setType(t.id)}
                  disabled={!t.available}
                  className={`group relative text-left p-6 rounded-lg border transition-all overflow-hidden ${
                    !t.available
                      ? "border-white/5 bg-white/[0.01] opacity-50 cursor-not-allowed"
                      : active
                        ? "border-violet-400/60 bg-gradient-to-br from-violet-500/15 via-indigo-500/8 to-emerald-500/5"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className={`grid place-items-center w-10 h-10 rounded-md border ${
                        active
                          ? "border-violet-400/40 bg-violet-500/10 text-violet-200"
                          : "border-white/10 bg-white/[0.03] text-slate-400"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      {!t.available && (
                        <Badge
                          variant="secondary"
                          className="bg-white/5 text-slate-400 border-white/10 text-[10.5px] uppercase tracking-wider"
                        >
                          Soon
                        </Badge>
                      )}
                      {active && (
                        <CheckCircle2
                          className="w-4 h-4 text-violet-300"
                          strokeWidth={2.5}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2.5 mb-1.5">
                    <h3 className="text-[26px] mk-display tracking-tighter text-white">
                      {t.label}
                    </h3>
                    <span className="text-[12px] text-slate-500">{t.desc}</span>
                  </div>

                  <p className="text-[13px] text-slate-400 leading-relaxed mb-4">
                    {t.blurb}
                  </p>

                  <div className="mk-mono text-[10.5px] text-slate-500 uppercase tracking-wider">
                    Timer · {t.timer}
                  </div>
                </button>
              );
            })}
          </div>
        </Step>

        {/* Step 3 — Difficulty (HLD/LLD only) */}
        {showsDifficulty && (
          <Step
            n="03"
            title="Difficulty"
            hint="Filter the scenario pool. Defaults to everything."
          >
            <div className="flex flex-wrap items-center gap-2.5">
              {ALL_DIFFICULTIES.map((d) => {
                const on = difficulty.includes(d);
                const accent =
                  d === "easy"
                    ? "from-emerald-500/20 to-emerald-500/5 text-emerald-200 border-emerald-400/40"
                    : d === "medium"
                      ? "from-amber-500/20 to-amber-500/5 text-amber-200 border-amber-400/40"
                      : "from-rose-500/20 to-rose-500/5 text-rose-200 border-rose-400/40";
                return (
                  <button
                    key={d}
                    onClick={() => toggleDifficulty(d)}
                    aria-pressed={on}
                    className={`group flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full border text-[13px] font-medium transition-all ${
                      on
                        ? `bg-gradient-to-b ${accent}`
                        : "bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        on
                          ? d === "easy"
                            ? "bg-emerald-300"
                            : d === "medium"
                              ? "bg-amber-300"
                              : "bg-rose-300"
                          : "bg-slate-600"
                      }`}
                    />
                    <span className="capitalize">{d}</span>
                    {on && (
                      <CheckCircle2 className="w-3.5 h-3.5 opacity-80" strokeWidth={2.5} />
                    )}
                  </button>
                );
              })}

              {difficulty.length < ALL_DIFFICULTIES.length && (
                <button
                  onClick={() => setDifficulty([...ALL_DIFFICULTIES])}
                  className="ml-2 inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-200 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  reset
                </button>
              )}
            </div>

            <p className="mt-4 text-[12.5px] text-slate-500 mk-mono">
              {difficulty.length === ALL_DIFFICULTIES.length
                ? "→ Pulling from the full pool."
                : `→ Filtering to: ${difficulty.join(" · ")}`}
            </p>
          </Step>
        )}

        {/* DSA bank preview */}
        {type === "dsa" && (
          <Step
            n="03"
            title="Curated bank preview"
            hint="A taste of what tomorrow's session might pull from."
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadBankPreview}
                className="h-8 px-3 border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-slate-300 text-[12px]"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 mr-1.5 ${loadingPreview ? "animate-spin" : ""}`}
                />
                {loadingPreview ? "Loading" : "Refresh"}
              </Button>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {bankPreview.map((problem) => (
                <div
                  key={problem.id}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:border-white/20 transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <h3 className="text-[14px] font-semibold text-white tracking-tight leading-snug">
                      {problem.title}
                    </h3>
                    <span
                      className={`mk-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        problem.difficulty === "easy"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : problem.difficulty === "medium"
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-rose-500/15 text-rose-300"
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-500 mb-3 capitalize">
                    {problem.topic.replace(/-/g, " ")}
                  </p>
                  <p className="text-[12.5px] text-slate-400 leading-relaxed line-clamp-2 mb-3.5">
                    {problem.interviewSignal}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {problem.companies.slice(0, 3).map((company) => (
                      <span
                        key={company}
                        className="mk-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/8 text-slate-400"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Step>
        )}

        {/* CTA */}
        <div className="mt-16 sticky bottom-6 z-20">
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl p-4 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    ready ? "bg-emerald-400 mk-pulse" : "bg-slate-600"
                  }`}
                />
                <div className="min-w-0">
                  <div className="mk-mono text-[10.5px] uppercase tracking-wider text-slate-500">
                    {ready ? "Ready" : "Pick experience + track"}
                  </div>
                  <div className="text-[13px] text-slate-200 truncate">
                    {ready ? (
                      <span>
                        <span className="mk-mono text-indigo-300">{type?.toUpperCase()}</span>
                        <span className="text-slate-500"> · </span>
                        <span>{experience}</span>
                        {showsDifficulty && (
                          <>
                            <span className="text-slate-500"> · </span>
                            <span className="mk-mono text-slate-300 text-[12px]">
                              {difficulty.length === 3 ? "all" : difficulty.join("·")}
                            </span>
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-500">Configuration incomplete</span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleStart}
                disabled={!ready}
                size="lg"
                className="group relative overflow-hidden h-12 px-7 bg-white text-black hover:bg-white/95 disabled:bg-white/10 disabled:text-slate-500 disabled:cursor-not-allowed text-[14px] font-semibold rounded-md"
              >
                {ready && (
                  <span className="absolute inset-0 mk-cta-shimmer pointer-events-none" />
                )}
                <span className="relative">Start session</span>
                <ChevronRight
                  className="relative w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2.5}
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-10 mb-6 text-[12px] text-slate-500 mk-mono uppercase tracking-wider">
          → tip · the clock is the rubric. respect it.
        </div>
      </main>
    </div>
  );
}

function Step({
  n,
  title,
  hint,
  children,
  action,
}: {
  n: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="mk-mono text-[12px] text-indigo-300/80 tracking-wider tabular-nums">
              {n}
            </span>
            <h2 className="text-[22px] font-semibold tracking-tight text-white">
              {title}
            </h2>
          </div>
          {hint && (
            <p className="mt-1.5 text-[13px] text-slate-400 leading-relaxed">
              {hint}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatsRow() {
  const [weak, setWeak] = useState<{ topic: string; avgScore: number; count: number }[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setWeak(getWeakTopics(3));
    setMounted(true);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* Dashboard link */}
      <Link
        href="/dashboard"
        className="group relative rounded-lg border border-white/10 bg-gradient-to-br from-emerald-500/[0.08] via-white/[0.02] to-transparent p-5 overflow-hidden hover:border-emerald-400/30 transition"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="mk-eyebrow flex items-center gap-2 text-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Your progress
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
        </div>
        <div className="mk-display text-[28px] text-white tracking-tighter leading-tight">
          See your progress
        </div>
        <p className="mt-1.5 text-[12px] text-slate-400">
          Streaks, solved history, topic coverage — open the dashboard.
        </p>
      </Link>

      {/* Weak topics */}
      <div className="lg:col-span-2 relative rounded-lg border border-white/10 bg-gradient-to-br from-rose-500/[0.06] via-white/[0.02] to-transparent p-5 overflow-hidden">
        <div className="mk-eyebrow flex items-center gap-2 text-rose-200 mb-3">
          <Target className="w-3.5 h-3.5" />
          Weak-topic radar · top 3
        </div>
        {weak.length === 0 ? (
          <div className="flex items-center gap-3 text-[13px] text-slate-400">
            <CircleSlash2 className="w-4 h-4 text-slate-600" />
            <span>
              No data yet. After a few sessions, your softest spots show up here automatically.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {weak.map((w, i) => (
              <div
                key={w.topic}
                className="group flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-md border border-rose-400/20 bg-rose-500/[0.06]"
              >
                <span className="mk-mono text-[10px] text-rose-300/70 tabular-nums">
                  0{i + 1}
                </span>
                <span className="text-[13px] text-rose-100 capitalize font-medium">
                  {w.topic.replace(/-/g, " ")}
                </span>
                <span className="flex items-center gap-1 mk-mono text-[10.5px] text-rose-300/80 tabular-nums">
                  <TrendingDown className="w-3 h-3" />
                  {w.avgScore.toFixed(1)}
                </span>
              </div>
            ))}
            <Link
              href="/dashboard"
              className="ml-1 inline-flex items-center gap-1 text-[12px] text-slate-400 hover:text-white transition mk-link"
            >
              full breakdown
              <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
