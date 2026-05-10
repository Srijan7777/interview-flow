"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, Mic, MicOff, AlertCircle } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface HLDFieldModalProps {
  open: boolean;
  title: string;
  placeholder: string;
  initialValue: string;
  onSave: (value: string) => void;
  onClose: () => void;
  hint?: string;
}

export default function HLDFieldModal({
  open,
  title,
  placeholder,
  initialValue,
  onSave,
  onClose,
  hint,
}: HLDFieldModalProps) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { supported, listening, interim, error, start, stop } =
    useSpeechRecognition({
      onFinal: (text) => {
        setValue((prev) => {
          const sep = prev && !/\s$/.test(prev) ? " " : "";
          return prev + sep + text;
        });
      },
    });

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  useEffect(() => {
    if (!open && listening) stop();
  }, [open, listening, stop]);

  if (!open) return null;

  const handleSave = () => {
    if (listening) stop();
    onSave(value);
    onClose();
  };

  const handleCancel = () => {
    if (listening) stop();
    onClose();
  };

  const toggleMic = () => {
    if (listening) stop();
    else start();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div className="session-pane w-full max-w-3xl max-h-[90vh] flex flex-col reveal-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b hairline border-b-slate-800/60">
          <div className="flex items-center gap-3">
            <span className="session-eyebrow">Editing</span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {supported && (
              <button
                onClick={toggleMic}
                title={listening ? "Stop dictation" : "Dictate (speech-to-text)"}
                className={`h-8 px-3 rounded-md ring-1 transition flex items-center gap-2 text-[12px] font-medium ${
                  listening
                    ? "ring-rose-500/60 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                    : "ring-slate-800 text-slate-300 hover:ring-violet-500/40 hover:bg-violet-500/10 hover:text-white"
                }`}
              >
                {listening ? (
                  <>
                    <span className="relative flex w-2 h-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                    </span>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Listening</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Dictate</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleCancel}
              className="w-8 h-8 rounded-md ring-1 ring-slate-800 hover:ring-slate-600 hover:bg-slate-800/60 text-slate-400 hover:text-white transition flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hint */}
        {hint && (
          <div className="px-6 pt-4">
            <div className="flex gap-3 p-3 rounded-md bg-violet-500/[0.06] ring-1 ring-violet-500/20">
              <Lightbulb className="w-4 h-4 text-violet-300 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-violet-100 leading-relaxed">
                {hint}
              </p>
            </div>
          </div>
        )}

        {/* Textarea */}
        <div className="px-6 py-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative flex-1 flex flex-col">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              autoFocus
              spellCheck={false}
              className={`flex-1 w-full p-4 bg-black/50 ring-1 rounded-md text-[13px] text-white placeholder-slate-600 focus:outline-none resize-none min-h-[300px] leading-relaxed font-mono thin-scroll transition ${
                listening
                  ? "ring-rose-500/50 focus:ring-rose-500/60"
                  : "ring-slate-800 focus:ring-violet-500/50"
              }`}
            />
            {listening && interim && (
              <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-md bg-rose-500/10 ring-1 ring-rose-500/30 pointer-events-none">
                <p className="text-[12px] text-rose-100/90 italic leading-relaxed">
                  <span className="text-[10px] uppercase tracking-wider text-rose-300 mr-2">
                    transcribing
                  </span>
                  {interim}
                </p>
              </div>
            )}
          </div>
          {error && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-rose-300">
              <AlertCircle className="w-3 h-3" />
              <span>
                {error === "not-allowed"
                  ? "Mic permission denied. Enable in browser settings."
                  : error === "audio-capture"
                  ? "No microphone found."
                  : `Speech recognition error: ${error}`}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-500">
            <span>
              {supported
                ? "Tip: click Dictate to speak your design. Edits stay editable while listening."
                : "Tip: use markdown bullets, code fences, and arrows freely."}
            </span>
            <span className="num-badge">{value.length} chars</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t hairline border-t-slate-800/60">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1 border-slate-700 hover:bg-slate-800/60"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30"
          >
            Save Section
          </Button>
        </div>
      </div>
    </div>
  );
}
