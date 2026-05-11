import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

type UserResult =
  | { ok: true; user: { id: string; email: string; name: string } }
  | { ok: false; error: string };

export async function createCredentialsUser({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}): Promise<UserResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("already registered") ||
      msg.includes("already exists") ||
      msg.includes("user already")
    ) {
      return { ok: false, error: "EMAIL_TAKEN" };
    }
    return { ok: false, error: error.message };
  }

  if (!data.user) {
    return { ok: false, error: "UNKNOWN" };
  }

  return {
    ok: true,
    user: { id: data.user.id, email: data.user.email!, name },
  };
}
