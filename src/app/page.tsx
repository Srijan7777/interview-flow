"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Binary,
  Network,
  Layers3,
  Sparkles,
  Timer,
  FileCode2,
  ChevronRight,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-slate-200">
      {/* Atmosphere layers */}
      <div aria-hidden className="pointer-events-none fixed inset-0 mk-grid opacity-[0.55]" />
      <div aria-hidden className="pointer-events-none fixed inset-0 mk-spotlight mk-aurora" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-[480px] bg-gradient-to-b from-indigo-500/[0.07] via-transparent to-transparent" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 h-[200px] bg-gradient-to-t from-black via-black/80 to-transparent" />

      {/* Nav */}
      <nav className="relative z-20 border-b border-white/5 backdrop-blur-md bg-black/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="relative grid place-items-center w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_0_24px_-6px_rgba(99,102,241,0.8)]">
              <span className="absolute inset-0 rounded-md ring-1 ring-inset ring-white/15" />
              <span className="text-[11px] font-black text-white tracking-tight">IF</span>
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              Interview<span className="text-indigo-300">Flow</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-[13px] text-slate-400">
            <a href="#tracks" className="mk-link hover:text-white transition">Tracks</a>
            <a href="#how" className="mk-link hover:text-white transition">How it works</a>
            <a href="#stack" className="mk-link hover:text-white transition">Stack</a>
            <Link href="/dashboard" className="mk-link hover:text-white transition">
              Dashboard
            </Link>
          </div>

          <NavActions />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-24">
          <div className="max-w-4xl">
            {/* status pill */}
            <div className="mk-rise mk-rise-1 inline-flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-[12px]">
              <span className="relative flex">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mk-pulse" />
              </span>
              <span className="text-slate-300 mk-mono tracking-wider uppercase text-[10.5px]">
                v0.6 · live
              </span>
              <span className="w-px h-3 bg-white/10" />
              <span className="text-slate-400">Now: real interview pacing + zip uploads</span>
            </div>

            <h1 className="mk-rise mk-rise-2 mt-8 mk-display text-[64px] sm:text-[84px] lg:text-[112px] tracking-tighter">
              <span className="mk-text-fade block">Interviews,</span>
              <span className="mk-text-accent block">rehearsed in production.</span>
            </h1>

            <p className="mk-rise mk-rise-3 mt-8 max-w-2xl text-[17px] leading-[1.65] text-slate-400">
              A serious training ground for staff-bound engineers. Real coding,
              real system design, real critique — under real time. No flashcards,
              no fluff, no "ace it in 7 days" promises.
            </p>

            <div className="mk-rise mk-rise-4 mt-10 flex flex-col sm:flex-row gap-3">
              <Link href="/setup">
                <Button
                  size="lg"
                  className="group relative overflow-hidden h-12 px-6 bg-white text-black hover:bg-white/95 text-[14px] font-semibold rounded-md tracking-tight"
                >
                  <span className="absolute inset-0 mk-cta-shimmer pointer-events-none" />
                  <span className="relative">Start a session</span>
                  <ChevronRight className="relative w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-6 border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-slate-200 text-[14px] font-medium rounded-md"
                >
                  See past sessions
                </Button>
              </Link>
            </div>

            {/* hero meta strip */}
            <div className="mk-rise mk-rise-5 mt-14 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-md overflow-hidden">
              {[
                { k: "tracks", v: "DSA · HLD · LLD" },
                { k: "scoring", v: "AI-rubric, 7 axes" },
                { k: "uploads", v: "code · diagrams · zip" },
                { k: "timer", v: "real interview pacing" },
              ].map((item) => (
                <div key={item.k} className="bg-black/40 px-4 py-3.5">
                  <div className="mk-eyebrow text-[10px] mb-1.5">{item.k}</div>
                  <div className="text-[13px] text-slate-200 font-medium">{item.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section id="tracks" className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <div className="mk-eyebrow mb-3">— 01 / Tracks</div>
              <h2 className="text-[40px] lg:text-[52px] mk-display mk-text-fade">
                Three rounds. One session.
              </h2>
            </div>
            <p className="max-w-md text-[14px] leading-relaxed text-slate-400">
              Cover the ground real loops cover. Each track gives you the tools the
              real interviewer expects you to wield — nothing more, nothing less.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <TrackCard
              eyebrow="Track 01"
              title="DSA"
              kicker="Algorithms · Data structures"
              icon={<Binary className="w-5 h-5" />}
              accent="indigo"
              points={[
                "Curated bank with topic rotation",
                "Monaco editor + Judge0 execution",
                "Solved-history skip · weak-topic targeting",
              ]}
              footer="20+ topics · easy → hard"
            />
            <TrackCard
              eyebrow="Track 02"
              title="HLD"
              kicker="High-Level Design"
              icon={<Network className="w-5 h-5" />}
              accent="violet"
              points={[
                "16+ scenarios: Uber, Tinder, top-K, payments",
                "Excalidraw canvas — diagrams scored",
                "Difficulty filter: easy / medium / hard",
              ]}
              footer="45 min · interview pacing"
            />
            <TrackCard
              eyebrow="Track 03"
              title="LLD"
              kicker="Low-Level Design"
              icon={<Layers3 className="w-5 h-5" />}
              accent="emerald"
              points={[
                "OOP + concurrency · 10 scenarios",
                "Upload zip, full repo critique",
                "Class diagrams, contracts, pitfalls",
              ]}
              footer="60 min · code-first"
            />
          </div>
        </div>
      </section>

      {/* Differentiators bento */}
      <section id="how" className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="mb-12">
            <div className="mk-eyebrow mb-3">— 02 / Why this, not yet-another-platform</div>
            <h2 className="text-[40px] lg:text-[52px] mk-display mk-text-fade max-w-3xl">
              Built for the brutal middle of the loop.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            {/* Big tile - AI scoring */}
            <div className="lg:col-span-4 lg:row-span-2 relative overflow-hidden rounded-xl border border-white/8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-8 lg:p-10 mk-edge mk-corners">
              <div className="flex items-center gap-2 text-indigo-300 mk-eyebrow mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                AI Scoring
              </div>
              <h3 className="text-[28px] lg:text-[36px] mk-display tracking-tight text-white mb-4">
                A rubric, not a vibe.
              </h3>
              <p className="text-slate-400 max-w-xl leading-relaxed text-[14px] mb-8">
                Every submission is graded across correctness, clarity,
                trade-offs, scalability, code quality, edge-cases, and
                communication. You see the score, the reasoning, and the gap to
                staff-level — written like a real debrief.
              </p>

              {/* Mock scoring viz */}
              <div className="grid grid-cols-7 gap-1.5 max-w-md">
                {[88, 72, 95, 64, 81, 78, 90].map((v, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="relative h-32 w-full bg-white/[0.03] rounded-sm overflow-hidden">
                      <div
                        className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-indigo-500 via-violet-500 to-emerald-400 opacity-90"
                        style={{ height: `${v}%` }}
                      />
                    </div>
                    <span className="mk-mono text-[10px] text-slate-500">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 mk-mono text-[10px] text-slate-500 max-w-md grid grid-cols-7 gap-1.5">
                {["corr", "clar", "trad", "scal", "code", "edge", "comm"].map((k) => (
                  <div key={k} className="text-center uppercase tracking-wider">{k}</div>
                ))}
              </div>
            </div>

            {/* Pacing */}
            <div className="lg:col-span-2 relative rounded-xl border border-white/8 bg-white/[0.02] p-7 mk-edge">
              <div className="flex items-center gap-2 text-violet-300 mk-eyebrow mb-5">
                <Timer className="w-3.5 h-3.5" />
                Pacing
              </div>
              <h3 className="text-[22px] mk-display text-white mb-3">
                Real clocks. Real pressure.
              </h3>
              <p className="text-[13.5px] text-slate-400 leading-relaxed">
                20 / 35 / 45 minute timers calibrated to actual loop cadence.
                When the bell rings, you submit — same as the room.
              </p>

              <div className="mt-6 flex items-center gap-3">
                <div className="mk-mono text-[11px] text-slate-500 flex-shrink-0">DSA</div>
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[72%] bg-gradient-to-r from-indigo-500 to-violet-500" />
                </div>
                <div className="mk-mono text-[11px] text-indigo-300 tabular-nums">25:14</div>
              </div>
            </div>

            {/* Multi-modal */}
            <div className="lg:col-span-2 relative rounded-xl border border-white/8 bg-white/[0.02] p-7 mk-edge">
              <div className="flex items-center gap-2 text-emerald-300 mk-eyebrow mb-5">
                <FileCode2 className="w-3.5 h-3.5" />
                Multi-modal
              </div>
              <h3 className="text-[22px] mk-display text-white mb-3">
                Code, diagrams, zips.
              </h3>
              <p className="text-[13.5px] text-slate-400 leading-relaxed">
                Submit Monaco buffers, Excalidraw canvases, or whole repository
                archives. Critique tracks all three.
              </p>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {[".js", ".py", ".java", ".cpp", ".excalidraw", ".zip"].map((t) => (
                  <span
                    key={t}
                    className="mk-mono text-[10.5px] px-2 py-1 rounded bg-white/[0.04] border border-white/8 text-slate-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works (timeline) */}
      <section className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="mb-14">
            <div className="mk-eyebrow mb-3">— 03 / Loop</div>
            <h2 className="text-[40px] lg:text-[52px] mk-display mk-text-fade max-w-3xl">
              From cold start to staff-grade in four moves.
            </h2>
          </div>

          <ol className="grid md:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-md overflow-hidden">
            {[
              { n: "01", t: "Configure", d: "Pick experience, track, difficulty band." },
              { n: "02", t: "Solve", d: "Code, diagram, or upload — under the clock." },
              { n: "03", t: "Critique", d: "AI rubric grades every axis. Honestly." },
              { n: "04", t: "Compound", d: "Weak-topic radar steers your next session." },
            ].map((s) => (
              <li key={s.n} className="bg-black/40 p-7">
                <div className="mk-mono text-[11px] text-indigo-300/80 tracking-wider">{s.n}</div>
                <div className="mt-3 text-[18px] font-semibold text-white tracking-tight">{s.t}</div>
                <p className="mt-1.5 text-[13.5px] text-slate-400 leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-indigo-600/[0.18] via-violet-600/[0.10] to-emerald-500/[0.08] p-10 lg:p-16 mk-corners">
            <div className="absolute inset-0 mk-grid-fine opacity-40" aria-hidden />
            <div className="relative max-w-3xl">
              <div className="mk-eyebrow mb-5 text-indigo-200">
                — Ship the loop. Then ship the offer.
              </div>
              <h2 className="text-[44px] lg:text-[64px] mk-display mk-text-fade">
                Stop reading. Start interviewing.
              </h2>
              <p className="mt-6 text-[16px] text-slate-300/90 max-w-xl leading-relaxed">
                Three minutes from now you can be inside a timed round, getting
                graded by an interviewer that doesn't bullshit you.
              </p>
              <div className="mt-9 flex gap-3 flex-wrap">
                <Link href="/setup">
                  <Button
                    size="lg"
                    className="group relative overflow-hidden h-12 px-7 bg-white text-black hover:bg-white/95 text-[14px] font-semibold rounded-md"
                  >
                    <span className="absolute inset-0 mk-cta-shimmer pointer-events-none" />
                    <span className="relative">Start a session</span>
                    <ArrowUpRight className="relative w-4 h-4 ml-1.5" strokeWidth={2.5} />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-6 border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-slate-100 text-[14px] font-medium rounded-md"
                  >
                    Browse past sessions
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech credibility footer */}
      <footer id="stack" className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
          <div className="grid md:grid-cols-3 gap-10 items-end">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="grid place-items-center w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600">
                  <span className="text-[11px] font-black text-white tracking-tight">IF</span>
                </span>
                <span className="text-[15px] font-semibold text-white tracking-tight">
                  InterviewFlow
                </span>
              </div>
              <p className="text-[13px] text-slate-500 leading-relaxed max-w-xs">
                Built by engineers who hated every other prep tool.
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="mk-eyebrow mb-4">Powered by</div>
              <div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-slate-300">
                <StackBadge name="Claude" sub="reasoning + critique" />
                <span className="hidden md:inline-block w-1 h-1 rounded-full bg-white/20" />
                <StackBadge name="Groq" sub="low-latency rounds" />
                <span className="hidden md:inline-block w-1 h-1 rounded-full bg-white/20" />
                <StackBadge name="Judge0" sub="sandboxed execution" />
                <span className="hidden md:inline-block w-1 h-1 rounded-full bg-white/20" />
                <StackBadge name="Excalidraw" sub="design canvas" />
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-[12px] text-slate-500">
            <div className="mk-mono uppercase tracking-wider text-[10.5px]">
              © {new Date().getFullYear()} InterviewFlow · No signup. No tracking. No nonsense.
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mk-pulse" />
              <span className="mk-mono text-[10.5px] uppercase tracking-wider text-slate-400">
                System: nominal
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavActions() {
  const { data: session, status } = useSession();
  if (status === "loading") return null;

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/setup">
          <Button
            size="sm"
            className="relative h-9 px-4 bg-white text-black hover:bg-white/90 text-[13px] font-semibold rounded-md"
          >
            Start session
            <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" strokeWidth={2.5} />
          </Button>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-[13px] text-slate-400 hover:text-white transition mk-link"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className="text-[13px] text-slate-400 hover:text-white transition mk-link">
        Sign in
      </Link>
      <Link href="/setup">
        <Button
          size="sm"
          className="relative h-9 px-4 bg-white text-black hover:bg-white/90 text-[13px] font-semibold rounded-md"
        >
          Start session
          <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" strokeWidth={2.5} />
        </Button>
      </Link>
    </div>
  );
}

function TrackCard({
  eyebrow,
  title,
  kicker,
  icon,
  accent,
  points,
  footer,
}: {
  eyebrow: string;
  title: string;
  kicker: string;
  icon: React.ReactNode;
  accent: "indigo" | "violet" | "emerald";
  points: string[];
  footer: string;
}) {
  const accentMap = {
    indigo: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20",
    violet: "text-violet-300 bg-violet-500/10 border-violet-500/20",
    emerald: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  };
  return (
    <div className="group relative rounded-xl border border-white/8 bg-white/[0.02] p-7 mk-lift mk-edge hover:border-white/15">
      <div className="flex items-start justify-between mb-7">
        <div
          className={`grid place-items-center w-10 h-10 rounded-md border ${accentMap[accent]}`}
        >
          {icon}
        </div>
        <span className="mk-eyebrow text-[10px]">{eyebrow}</span>
      </div>

      <div className="flex items-baseline gap-3 mb-1.5">
        <h3 className="text-[36px] mk-display text-white tracking-tighter">{title}</h3>
        <span className="text-[12px] text-slate-500">{kicker}</span>
      </div>

      <ul className="mt-6 space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-[13.5px] text-slate-300/90">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-500 flex-shrink-0" />
            <span className="leading-relaxed">{p}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between">
        <span className="mk-mono text-[10.5px] text-slate-500 uppercase tracking-wider">
          {footer}
        </span>
        <ArrowUpRight
          className="w-4 h-4 text-slate-500 group-hover:text-white transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          strokeWidth={2}
        />
      </div>
    </div>
  );
}

function StackBadge({ name, sub }: { name: string; sub: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[15px] font-semibold text-white tracking-tight">{name}</span>
      <span className="text-[11.5px] text-slate-500">{sub}</span>
    </div>
  );
}
