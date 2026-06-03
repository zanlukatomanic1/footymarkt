import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import TopBar from "@/components/TopBar";
import SpinWheel from "@/components/SpinWheel";

export const metadata = { title: "Daily Spin" };

export default async function SpinPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: hasSpun } = await admin.rpc("has_spun_today", {
    p_user_id: user.id,
  });

  const nextMidnightUTC = new Date();
  nextMidnightUTC.setUTCHours(24, 0, 0, 0);

  return (
    <div>
      <TopBar title="Daily Spin" subtitle="Free coins, once a day" />
      <SpinWheel
        initialHasSpun={hasSpun ?? false}
        nextSpinAt={nextMidnightUTC.toISOString()}
      />
    </div>
  );
}
