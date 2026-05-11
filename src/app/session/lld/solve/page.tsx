"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, UploadCloud, Code2, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { SessionStartResponse } from "@/types";
import SessionTimer from "@/components/session/SessionTimer";
import JSZip from "jszip";
import { recordSolved } from "@/lib/solved-tracker";

function LLDSolvePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionData, setSessionData] = useState<SessionStartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [parsedCode, setParsedCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const sessionId = searchParams.get("sessionId");
        if (!sessionId) {
          throw new Error("No session ID provided");
        }

        // Try localStorage first (from lld/read page)
        const cached = localStorage.getItem(`lld-session-${sessionId}`);
        if (cached) {
          setSessionData(JSON.parse(cached));
          setLoading(false);
          return;
        }

        // Fallback to API if not in localStorage
        const response = await fetch(`/api/session/read?sessionId=${sessionId}`);
        if (!response.ok) throw new Error("Session not found");

        const data = await response.json();
        setSessionData(data);
      } catch (error) {
        console.error("Failed to fetch session:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [searchParams]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith(".zip")) {
      alert("Please upload a .zip file");
      return;
    }
    
    setZipFile(file);
    
    try {
      const zip = await JSZip.loadAsync(file);
      let combinedCode = "";
      
      const filePromises: Promise<void>[] = [];
      
      zip.forEach((relativePath, zipEntry) => {
        // Skip directories and common binary/build folders
        if (zipEntry.dir) return;
        if (relativePath.includes("node_modules/") || 
            relativePath.includes(".git/") ||
            relativePath.includes("dist/") ||
            relativePath.includes("build/") ||
            relativePath.includes("target/") ||
            relativePath.includes("out/")) return;
            
        // Only include source code files
        const ext = relativePath.split(".").pop()?.toLowerCase();
        const validExts = ["ts", "tsx", "js", "jsx", "java", "cpp", "c", "h", "hpp", "py", "go", "rs", "cs", "rb", "php", "swift", "kt"];
        
        if (ext && validExts.includes(ext)) {
          filePromises.push(
            zipEntry.async("string").then(content => {
              combinedCode += `\n\n// --- File: ${relativePath} ---\n${content}`;
            })
          );
        }
      });
      
      await Promise.all(filePromises);
      
      if (!combinedCode.trim()) {
        alert("No valid source files found in the zip. Please ensure you zip your source code.");
        setZipFile(null);
        setParsedCode("");
      } else {
        setParsedCode(combinedCode.trim());
      }
    } catch (err) {
      console.error("Error parsing zip file:", err);
      alert("Failed to parse the zip file. It might be corrupted.");
      setZipFile(null);
      setParsedCode("");
    }
  };

  const handleSubmit = async () => {
    if (!sessionData || !parsedCode || !sessionData.lldScenario) return;
    
    setIsSubmitting(true);
    
    try {
      const timeTakenMinutes = Math.floor(
        (Date.now() - new Date(sessionData.startedAt).getTime()) / 60000
      );

      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          type: "lld",
          scenario: sessionData.lldScenario,
          code: parsedCode,
          experience: searchParams.get("exp") || "1-3",
          timeTakenMinutes,
          allocatedMinutes: Math.round(sessionData.duration / 60),
        }),
      });

      if (!response.ok) throw new Error("Failed to generate report");

      // Record locally for the dashboard
      recordSolved({
        problemId: sessionData.lldScenario.id,
        title: sessionData.lldScenario.title,
        leetcodeNumber: 0,
        topic: "low-level-design",
        difficulty: sessionData.lldScenario.difficulty,
        result: "solved",
        date: new Date().toISOString(),
        track: "lld",
      });

      router.push(`/report/${sessionData.sessionId}`);
    } catch (error) {
      console.error("Failed to submit solution:", error);
      alert("Failed to submit solution and generate report. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Skeleton className="h-8 w-64" />
      </div>
    );
  }

  if (!sessionData || !sessionData.lldScenario) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="bg-slate-900 border-slate-800 max-w-md p-6 text-center flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Session Expired</h2>
          <p className="text-slate-400 text-sm text-center mb-4">
            Your session is no longer available — this can happen after the server restarts.
            Please start a new session.
          </p>
          <Button onClick={() => router.push("/setup")} className="w-full">
            Start New Session
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-black/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const sessionId = searchParams.get("sessionId");
              const exp = searchParams.get("exp") || "1-3";
              router.push(`/session/lld/read?sessionId=${sessionId}&exp=${exp}`);
            }}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            title="Back to problem statement"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            View Problem
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">LLD: {sessionData.lldScenario.title}</h1>
          </div>
          <SessionTimer durationSeconds={sessionData.duration} onExpire={() => {}} />
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Submit Your Solution</h2>
          <p className="text-slate-400">
            For Low-Level Design (LLD) questions, it's best to use your own local IDE where you can structure multiple files, classes, and interfaces properly.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
              <Code2 className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1. Code Locally</h3>
            <p className="text-sm text-slate-400">
              Open your favorite IDE (VS Code, IntelliJ, etc.). Create a project and implement your solution with appropriate Object-Oriented Design principles.
            </p>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
              <UploadCloud className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">2. Zip & Upload</h3>
            <p className="text-sm text-slate-400">
              Compress your source code directory into a .zip file and upload it below. Our AI will analyze your architecture, patterns, and code quality.
            </p>
          </Card>
        </div>

        <Card className="bg-slate-900 border-slate-800 p-8 border-dashed border-2 text-center">
          <input
            type="file"
            accept=".zip"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          
          {!zipFile ? (
            <div className="flex flex-col items-center justify-center py-8">
              <UploadCloud className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Upload Source Code ZIP</h3>
              <p className="text-slate-400 mb-6 text-sm max-w-sm">
                Ensure your ZIP contains standard source files (.ts, .java, .py, etc.). Build folders (node_modules, target) will be ignored.
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Select ZIP File
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">File Uploaded Successfully</h3>
              <p className="text-slate-400 mb-2">{zipFile.name}</p>
              
              {parsedCode ? (
                <Badge variant="outline" className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  Code Extracted Successfully
                </Badge>
              ) : (
                <Badge variant="outline" className="mb-6 bg-red-500/10 text-red-400 border-red-500/20">
                  Extracting... or failed
                </Badge>
              )}
              
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setZipFile(null);
                    setParsedCode("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="border-slate-700 hover:bg-slate-800 text-white"
                >
                  Change File
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!parsedCode || isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Grading Solution...
                    </>
                  ) : (
                    "Submit for AI Grading"
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function LLDSolvePageWithSuspense() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LLDSolvePage />
    </Suspense>
  );
}
