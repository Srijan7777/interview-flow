"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPlus, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") || "/setup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Could not create account.");
      setLoading(false);
      return;
    }

    // Account created — sign the user in immediately.
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Account created, but sign-in failed. Try logging in.");
      setLoading(false);
      router.push("/login");
      return;
    }

    router.push(callbackUrl);
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setOauthLoading(provider);
    await signIn(provider, { callbackUrl });
  };

  const anyLoading = loading || oauthLoading !== null;

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
        </div>
      </nav>

      {/* Main */}
      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Eyebrow + title */}
          <div className="mb-10">
            <div className="mk-eyebrow mb-4">— Create account</div>
            <h1 className="mk-display text-[44px] tracking-tighter mk-text-fade mb-4">
              Get started.
            </h1>
            <p className="text-[15px] text-slate-400 leading-relaxed">
              Spin up an account in seconds and start tracking your interview prep.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] backdrop-blur-sm p-8 mb-6 hover:border-white/20 transition-all">
            {error && (
              <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* OAuth */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={anyLoading}
                className="w-full h-11 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white font-medium flex items-center justify-center gap-3 transition disabled:opacity-50"
              >
                <GoogleIcon className="w-4 h-4" />
                {oauthLoading === "google" ? "Redirecting…" : "Continue with Google"}
              </button>
              <button
                type="button"
                onClick={() => handleOAuth("github")}
                disabled={anyLoading}
                className="w-full h-11 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white font-medium flex items-center justify-center gap-3 transition disabled:opacity-50"
              >
                <GitHubIcon className="w-4 h-4" />
                {oauthLoading === "github" ? "Redirecting…" : "Continue with GitHub"}
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0a0a0a] px-3 mk-mono text-[10.5px] uppercase tracking-wider text-slate-500">
                  or with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block mk-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2.5">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={anyLoading}
                  required
                  minLength={2}
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:bg-indigo-500/5 transition disabled:opacity-50"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block mk-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={anyLoading}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:bg-indigo-500/5 transition disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block mk-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="at least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={anyLoading}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:bg-indigo-500/5 transition disabled:opacity-50"
                />
              </div>

              {/* Confirm */}
              <div>
                <label htmlFor="confirm" className="block mk-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2.5">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  placeholder="repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={anyLoading}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:bg-indigo-500/5 transition disabled:opacity-50"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={anyLoading || !name || !email || !password || !confirm}
                className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-medium h-11 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? "Creating account…" : "Create account"}
                <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </form>
          </div>

          {/* Cross link */}
          <div className="text-center text-[13px] text-slate-400">
            <p>
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-300 hover:text-indigo-200 transition mk-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.3-3.2-.2-.4-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
