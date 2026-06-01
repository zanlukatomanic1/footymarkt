"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="mt-24 flex flex-col items-center text-center">
      <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-brand text-bg text-2xl font-bold">
        F
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">FootyMarkt</h1>
      <p className="mt-2 max-w-xs text-sm text-ink-muted">
        Predict matches. The crowd sets the odds. Contrarian picks pay more.
      </p>
      <button
        onClick={signIn}
        className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-medium text-bg shadow-card"
      >
        Continue with Google
      </button>
    </div>
  );
}
