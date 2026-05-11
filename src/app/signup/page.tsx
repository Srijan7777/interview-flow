import { Suspense } from "react";
import SignupForm from "./signup-form";

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageSkeleton />}>
      <SignupForm />
    </Suspense>
  );
}

function SignupPageSkeleton() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full h-96 animate-pulse" />
    </div>
  );
}
