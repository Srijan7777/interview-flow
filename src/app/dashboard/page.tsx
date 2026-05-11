"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import {
  Binary,
  Network,
  Layers3,
  ChevronRight,
  ArrowUpRight,
  Target,
  TrendingDown,
  CircleSlash2,
  Flame,
  Trophy,
  X,
} from "lucide-react";
import {
  getSolvedHistory,
  clearSolvedHistory,
  deriveTrack,
  type SolvedEntry,
} from "@/lib/solved-tracker";
import { getWeakTopics } from "@/lib/weakness-tracker";

type Track = "dsa" | "hld" | "lld";
type Difficulty = "easy" | "medium" | "hard";

interface TrackStats {
  total: number;
  byDifficulty: Record<Difficulty, number>;
  recent: SolvedEntry[];
}

const EMPTY_STATS: TrackStats = {
  total: 0,
  byDifficulty: { easy: 0, medium: 0, hard: 0 },
  recent: [],
};

const TRACK_CONFIG: Record<
  Track,
  {
    label: string;
    sub: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    border: string;
    glow: string;
    chipBg: string;
    href: string;
  }
> = {
  dsa: {
    label: "DSA",
    sub: "Algorithms · Data structures",
    desc: "Curated problem bank with timed rounds.",
    icon: Binary,
    accent: "text-indigo-300",
    border: "border-indigo-400/30 hover:border-indigo-400/60",
    glow: "from-indigo-500/15 via-indigo-500/5 to-transparent",
    chipBg: "bg-indigo-500/15 text-indigo-200",
    href: "/setup",
  },
  hld: {
    label: "HLD",
    sub: "High-Level Design",
    desc: "System design scenarios graded by AI.",
    icon: Network,
    accent: "text-violet-300",
    border: "border-violet-400/30 hover:border-violet-400/60",
    glow: "from-violet-500/15 via-violet-500/5 to-transparent",
    chipBg: "bg-violet-500/15 text-violet-200",
    href: "/setup",
  },
  lld: {
    label: "LLD",
    sub: "Low-Level Design",
    desc: "Object-oriented design with zip uploads.",
    icon: Layers3,
    accent: "text-emerald-300",
    border: "border-emerald-400/30 hover:border-emerald-400/60",
    glow: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    chipBg: "bg-emerald-500/15 text-emerald-200",
    href: "/setup",
  },
};

const DIFF_CHIP: Record<Difficulty, string> = {
  easy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  hard: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

function computeStats(history: SolvedEntry[]): {
  byTrack: Record<Track, TrackStats>;
  totals: { solved: number; sessions: number };
} {
  const empty = (): TrackStats => ({
    total: 0,
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
    recent: [],
  });
  const byTrack: Record<Track, TrackStats> = {
    dsa: empty(),
    hld: empty(),
    lld: empty(),
  };

  // Sort newest-first for "recent" lists
  const ordered = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let solved = 0;
  for (const entry of ordered) {
    const track = deriveTrack(entry);
    const bucket = byTrack[track];
    bucket.total += 1;
    const d = (entry.difficulty as Difficulty) || "medium";
    if (d === "easy" || d === "medium" || d === "hard") {
      bucket.byDifficulty[d] += 1;
    }
    if (bucket.recent.length < 5) bucket.recent.push(entry);
    if (entry.result === "solved") solved += 1;
  }

  return {
    byTrack,
    totals: {
      solved,
      sessions: history.length,
    },
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<SolvedEntry[]>([]);
  const [weakTopics, setWeakTopics] = useState<
    { topic: string; avgScore: number; count: number }[]
  >([]);

  useEffect(() => {
    setHistory(getSolvedHistory());
    setWeakTopics(getWeakTopics(5));
    setMounted(true);
  }, []);

  const { byTrack, totals } = computeStats(history);

  const handleClear = () => {
    if (
      confirm(
        "Clear ALL solved history? This wipes your dashboard data. Cannot be undone."
      )
    ) {
      clearSolvedHistory();
      setHistory([]);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-slate-200">
      {/* Atmosphere */}
      <div aria-hidden className="pointer-events-none fixed inset-0 mk-grid opacity-[0.45]" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-gradient-to-b from-indigo-500/[0.07] via-transparent to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-600/[0.06] blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.05] blur-[120px]"
      />

      {/* Nav */}
      <nav className="relative z-20 border-b border-white/5 backdrop-blur-md bg-black/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
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
              href="/"
              className="text-[13px] text-slate-400 hover:text-white transition mk-link hidden sm:block"
            >
              Home
            </Link>

            {session?.user && (
              <div className="hidden sm:flex items-center gap-2.5 pl-4 border-l border-white/10">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name || "user"}
                    className="w-7 h-7 rounded-full ring-1 ring-white/10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full grid place-items-center bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white">
                    {(session.user.name || session.user.email || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <span className="text-[13px] text-slate-200 font-medium max-w-[140px] truncate">
                  {session.user.name || session.user.email}
                </span>
              </div>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-[13px] text-slate-400 hover:text-white transition mk-link hidden sm:block"
            >
              Sign out
            </button>
            <Link href="/setup">
              <Button
                size="sm"
                className="h-9 px-4 bg-white text-black hover:bg-white/90 text-[13px] font-semibold rounded-md"
              >
                Start session
                <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" strokeWidth={2.5} />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-14 lg:py-20">
        {/* Identity / header */}
        <div className="mb-12 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="mk-rise mk-rise-1 mk-eyebrow mb-4">
              — Signed in as{" "}
              <span className="text-indigo-300 normal-case tracking-normal">
                {session?.user?.name || session?.user?.email || "…"}
              </span>
            </div>
            <h1 className="mk-rise mk-rise-2 mk-display text-[44px] sm:text-[60px] lg:text-[76px] tracking-tighter mk-text-fade max-w-3xl">
              Dashboard
            </h1>
            <p className="mk-rise mk-rise-3 mt-5 max-w-xl text-[15px] text-slate-400 leading-relaxed">
              Your training arc. Progress is stored locally on this device for now.
            </p>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="text-[12px] text-slate-500 hover:text-rose-300 transition flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              clear all history
            </button>
          )}
        </div>

        {/* Top stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
          <StatPill
            label="Total solved"
            value={mounted ? totals.solved : 0}
            unit={totals.solved === 1 ? "problem" : "problems"}
            accent="emerald"
            icon={Trophy}
          />
          <StatPill
            label="Sessions"
            value={mounted ? totals.sessions : 0}
            unit={totals.sessions === 1 ? "attempt" : "attempts"}
            accent="indigo"
            icon={Flame}
          />
          <StatPill
            label="DSA · solved"
            value={byTrack.dsa.total}
            unit="rounds"
            accent="indigo"
            icon={Binary}
          />
          <StatPill
            label="Design · solved"
            value={byTrack.hld.total + byTrack.lld.total}
            unit="scenarios"
            accent="violet"
            icon={Network}
          />
        </div>

        {/* 3 track blocks */}
        <section className="mb-14">
          <div className="flex items-baseline gap-3 mb-6">
            <span className="mk-mono text-[12px] text-indigo-300/80 tracking-wider tabular-nums">
              01
            </span>
            <h2 className="text-[22px] font-semibold tracking-tight text-white">
              By track
            </h2>
            <p className="text-[13px] text-slate-500 ml-auto">
              Solved counts and difficulty mix per round type
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TrackCard track="dsa" stats={byTrack.dsa} />
            <TrackCard track="hld" stats={byTrack.hld} />
            <TrackCard track="lld" stats={byTrack.lld} />
          </div>
        </section>

        {/* Weak topics */}
        <section className="mb-14">
          <div className="flex items-baseline gap-3 mb-6">
            <span className="mk-mono text-[12px] text-rose-300/80 tracking-wider tabular-nums">
              02
            </span>
            <h2 className="text-[22px] font-semibold tracking-tight text-white">
              Weak-topic radar
            </h2>
            <p className="text-[13px] text-slate-500 ml-auto">
              Topics with the lowest average scores across your sessions
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-rose-500/[0.05] via-white/[0.02] to-transparent p-6">
            {!mounted ? (
              <div className="text-[13px] text-slate-500">Loading…</div>
            ) : weakTopics.length === 0 ? (
              <div className="flex items-center gap-3 text-[13.5px] text-slate-400">
                <CircleSlash2 className="w-4 h-4 text-slate-600" />
                <span>
                  No weak-topic data yet. After a few sessions, your softest
                  spots will show up here automatically.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {weakTopics.map((w, i) => (
                  <div
                    key={w.topic}
                    className="flex items-center gap-3 rounded-lg border border-rose-400/20 bg-rose-500/[0.06] px-4 py-3"
                  >
                    <span className="mk-mono text-[10.5px] text-rose-300/70 tabular-nums w-6 shrink-0">
                      0{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] text-rose-100 capitalize font-medium truncate">
                        {w.topic.replace(/-/g, " ")}
                      </div>
                      <div className="text-[11px] text-rose-300/70 mk-mono">
                        {w.count} session{w.count === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mk-mono text-[11px] text-rose-300 tabular-nums">
                      <TrendingDown className="w-3 h-3" />
                      {w.avgScore.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Empty-state CTA */}
        {mounted && history.length === 0 && (
          <div className="mt-16 relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-indigo-600/[0.18] via-violet-600/[0.08] to-emerald-500/[0.06] p-10 lg:p-14 mk-corners text-center">
            <div className="absolute inset-0 mk-grid-fine opacity-30" aria-hidden />
            <div className="relative max-w-xl mx-auto">
              <div className="mk-eyebrow mb-4 text-indigo-200">
                — No data on this device yet
              </div>
              <h3 className="text-[28px] mk-display tracking-tighter text-white mb-3">
                Run your first session.
              </h3>
              <p className="text-[14px] text-slate-300/90 leading-relaxed mb-7">
                The dashboard fills up the moment you complete a round. Pick a
                track, hit the timer, and your progress lands here.
              </p>
              <Link href="/setup">
                <Button
                  size="lg"
                  className="h-12 px-7 bg-white text-black hover:bg-white/95 text-[14px] font-semibold rounded-md"
                >
                  Start a session
                  <ChevronRight className="w-4 h-4 ml-1.5" strokeWidth={2.5} />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatPill({
  label,
  value,
  unit,
  accent,
  icon: Icon,
}: {
  label: string;
  value: number;
  unit: string;
  accent: "indigo" | "violet" | "emerald";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const accentMap = {
    indigo: "text-indigo-300 from-indigo-500/[0.08]",
    violet: "text-violet-300 from-violet-500/[0.08]",
    emerald: "text-emerald-300 from-emerald-500/[0.08]",
  };
  return (
    <div
      className={`relative rounded-lg border border-white/10 bg-gradient-to-br ${accentMap[accent].split(" ")[1]} via-white/[0.02] to-transparent p-5 overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="mk-eyebrow text-slate-400">{label}</div>
        <Icon className={`w-3.5 h-3.5 ${accentMap[accent].split(" ")[0]}`} />
      </div>
      <div className="mk-display text-[36px] tabular-nums text-white tracking-tighter leading-none">
        {value}
      </div>
      <div className="mt-1 text-[12px] text-slate-500">{unit}</div>
    </div>
  );
}

function TrackCard({ track, stats }: { track: Track; stats: TrackStats }) {
  const cfg = TRACK_CONFIG[track];
  const Icon = cfg.icon;
  const total = stats.total;
  const max = Math.max(stats.byDifficulty.easy, stats.byDifficulty.medium, stats.byDifficulty.hard, 1);

  return (
    <div
      className={`group relative rounded-xl border ${cfg.border} bg-white/[0.02] p-7 transition-all overflow-hidden`}
    >
      {/* Glow */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cfg.glow} opacity-60`}
      />

      <div className="relative">
        {/* Header row */}
        <div className="flex items-start justify-between mb-6">
          <div
            className={`grid place-items-center w-11 h-11 rounded-md border border-white/10 bg-white/[0.04] ${cfg.accent}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <Link
            href={cfg.href}
            className={`mk-link text-[12px] flex items-center gap-1 ${cfg.accent} hover:text-white transition`}
          >
            practice
            <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Title */}
        <div className="flex items-baseline gap-2.5 mb-1">
          <h3 className="text-[36px] mk-display tracking-tighter text-white">
            {cfg.label}
          </h3>
          <span className="text-[12px] text-slate-500">{cfg.sub}</span>
        </div>
        <p className="text-[12.5px] text-slate-400 mb-6">{cfg.desc}</p>

        {/* Big number */}
        <div className="flex items-baseline gap-2.5 mb-6">
          <span className="mk-display text-[56px] tabular-nums text-white tracking-tighter leading-none">
            {total}
          </span>
          <span className="text-[13px] text-slate-500">
            {total === 1 ? "problem solved" : "problems solved"}
          </span>
        </div>

        {/* Difficulty breakdown — bars + counts */}
        <div className="space-y-2.5 mb-6">
          {(["easy", "medium", "hard"] as const).map((d) => {
            const n = stats.byDifficulty[d];
            const pct = total === 0 ? 0 : (n / max) * 100;
            return (
              <div key={d} className="flex items-center gap-3">
                <span
                  className={`mk-mono text-[10.5px] uppercase tracking-wider w-14 shrink-0 ${
                    d === "easy"
                      ? "text-emerald-300/80"
                      : d === "medium"
                        ? "text-amber-300/80"
                        : "text-rose-300/80"
                  }`}
                >
                  {d}
                </span>
                <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      d === "easy"
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-300"
                        : d === "medium"
                          ? "bg-gradient-to-r from-amber-500 to-amber-300"
                          : "bg-gradient-to-r from-rose-500 to-rose-300"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span
                  className={`mk-mono text-[12px] tabular-nums w-6 text-right ${
                    n === 0 ? "text-slate-600" : "text-slate-200"
                  }`}
                >
                  {n}
                </span>
              </div>
            );
          })}
        </div>

        {/* Recent list */}
        {stats.recent.length > 0 ? (
          <div className="pt-5 border-t border-white/5">
            <div className="mk-eyebrow text-[10px] mb-3">Recent</div>
            <ul className="space-y-1.5">
              {stats.recent.slice(0, 4).map((entry) => (
                <li
                  key={`${entry.problemId}-${entry.date}`}
                  className="flex items-center justify-between gap-2 text-[12.5px] text-slate-400 hover:text-slate-200 transition"
                >
                  <span className="truncate">{entry.title}</span>
                  <span
                    className={`mk-mono text-[9.5px] uppercase px-1.5 py-0.5 rounded shrink-0 ${
                      DIFF_CHIP[(entry.difficulty as Difficulty) || "medium"]
                    } border`}
                  >
                    {entry.difficulty}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="pt-5 border-t border-white/5 flex items-center gap-2 text-[12px] text-slate-500">
            <Target className="w-3.5 h-3.5" />
            Nothing solved yet on this track.
          </div>
        )}
      </div>
    </div>
  );
}
