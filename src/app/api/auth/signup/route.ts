import { NextRequest } from "next/server";
import { createCredentialsUser } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, password } = (body ?? {}) as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    return Response.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }
  if (name.trim().length < 2) {
    return Response.json({ error: "Name is too short" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const result = await createCredentialsUser({ name, email, password });
  if (!result.ok) {
    if (result.error === "EMAIL_TAKEN") {
      return Response.json(
        { error: "An account with that email already exists" },
        { status: 409 }
      );
    }
    console.error("[signup] Supabase error:", result.error);
    return Response.json({ error: result.error }, { status: 500 });
  }

  return Response.json({ ok: true, user: result.user });
}
