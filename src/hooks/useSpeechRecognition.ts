"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Recognition = any;

interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(opts: {
  onFinal: (text: string) => void;
  lang?: string;
}): UseSpeechRecognitionResult {
  const { onFinal, lang = "en-US" } = opts;
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const wantListenRef = useRef(false);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);

    const rec: Recognition = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (event: any) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const text = r[0]?.transcript || "";
        if (r.isFinal) finalChunk += text;
        else interimChunk += text;
      }
      if (finalChunk) {
        onFinalRef.current(finalChunk.trim());
        setInterim("");
      } else {
        setInterim(interimChunk);
      }
    };

    rec.onerror = (e: any) => {
      const err = e?.error || "unknown";
      if (err === "no-speech" || err === "aborted") return;
      setError(err);
      setListening(false);
      wantListenRef.current = false;
    };

    rec.onend = () => {
      if (wantListenRef.current) {
        try {
          rec.start();
        } catch {
          setListening(false);
          wantListenRef.current = false;
        }
      } else {
        setListening(false);
        setInterim("");
      }
    };

    recRef.current = rec;
    return () => {
      wantListenRef.current = false;
      try {
        rec.stop();
      } catch {}
      recRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    setError(null);
    if (!recRef.current) return;
    wantListenRef.current = true;
    try {
      recRef.current.start();
      setListening(true);
    } catch {
      // already started
      setListening(true);
    }
  }, []);

  const stop = useCallback(() => {
    wantListenRef.current = false;
    if (!recRef.current) return;
    try {
      recRef.current.stop();
    } catch {}
    setListening(false);
    setInterim("");
  }, []);

  const reset = useCallback(() => {
    setInterim("");
    setError(null);
  }, []);

  return { supported, listening, interim, error, start, stop, reset };
}
