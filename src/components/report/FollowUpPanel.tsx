"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { FollowUp, DsaRoundQuestion } from "@/types";
import { MessageSquare, ChevronDown, Lightbulb } from "lucide-react";

interface FollowUpPanelProps {
  followUps: Record<string, FollowUp[]> | undefined;
  questions: DsaRoundQuestion[];
  flatFollowUps?: FollowUp[];
  sessionTitle?: string;
}

const DIFF_STYLES: Record<string, string> = {
  easy: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  medium: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  hard: "bg-rose-500/10 border-rose-500/30 text-rose-300",
};

function FollowUpItem({ fu, idx }: { fu: FollowUp; idx: number }) {
  const [showHint, setShowHint] = useState(false);
  return (
    <div className="group rounded-xl border border-slate-800/70 bg-slate-950/40 hover:border-indigo-500/40 transition p-4">
      <div className="flex items-start gap-3">
        <div className="text-xs font-mono text-slate-500 shrink-0 mt-0.5 w-6">
          {String(idx + 1).padStart(2, "0")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <p className="text-sm text-slate-100 leading-relaxed">{fu.question}</p>
            <span
              className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide border rounded-full px-2 py-0.5 capitalize ${
                DIFF_STYLES[fu.difficulty] || DIFF_STYLES.medium
              }`}
            >
              {fu.difficulty}
            </span>
          </div>
          {fu.hint && (
            <div className="mt-2">
              <button
                onClick={() => setShowHint((v) => !v)}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-300 hover:text-indigo-200 transition"
              >
                <Lightbulb className="w-3 h-3" />
                {showHint ? "Hide hint" : "Show hint"}
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showHint ? "rotate-180" : ""}`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all ${
                  showHint ? "max-h-40 mt-2" : "max-h-0"
                }`}
              >
                <p className="text-xs text-slate-400 leading-relaxed pl-4 border-l-2 border-indigo-500/40 italic">
                  {fu.hint}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FollowUpPanel({ followUps, questions, flatFollowUps, sessionTitle }: FollowUpPanelProps) {
  const hasFlat = Array.isArray(flatFollowUps) && flatFollowUps.length > 0;
  const hasRound = followUps && Object.keys(followUps).length > 0 && questions?.length > 0;
  if (!hasFlat && !hasRound) return null;

  return (
    <Card className="bg-slate-900/60 border-slate-800/80 p-6 report-glass">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/15 text-indigo-300">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-medium">
            Stretch
          </div>
          <h3 className="text-base font-semibold text-white">Interviewer Follow-ups</h3>
        </div>
      </div>

      {hasFlat && (
        <div>
          {sessionTitle && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-300 font-medium truncate">{sessionTitle}</span>
              <span className="ml-auto text-[10px] font-mono text-slate-500">
                {flatFollowUps!.length} follow-up{flatFollowUps!.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div className="space-y-2">
            {flatFollowUps!.map((fu, i) => (
              <FollowUpItem key={i} fu={fu} idx={i} />
            ))}
          </div>
        </div>
      )}

      {hasRound && (
      <div className="space-y-5">
        {questions.map((q, idx) => {
          const qFollowUps = followUps[String(idx)] || [];
          if (qFollowUps.length === 0) return null;
          return (
            <div key={idx}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono text-slate-500">Q{idx + 1}</span>
                <span className="text-xs text-slate-300 font-medium truncate">
                  {q.problem.title}
                </span>
                <span className="ml-auto text-[10px] font-mono text-slate-500">
                  {qFollowUps.length} follow-up{qFollowUps.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {qFollowUps.map((fu, i) => (
                  <FollowUpItem key={i} fu={fu} idx={i} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </Card>
  );
}
