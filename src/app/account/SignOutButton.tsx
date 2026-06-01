"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();
  const out = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };
  return (
    <button
      onClick={out}
      className="w-full rounded-[8px] border border-line bg-card py-[10px] text-[13px] text-ink-faint transition-colors hover:text-ink"
    >
      Sign out
    </button>
  );
}
