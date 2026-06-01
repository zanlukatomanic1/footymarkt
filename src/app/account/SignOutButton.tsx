"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();
  const out = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };
  return (
    <button
      onClick={out}
      className="w-full rounded-xl border border-border bg-bg-card py-3 text-sm text-ink-muted hover:text-ink"
    >
      Sign out
    </button>
  );
}
