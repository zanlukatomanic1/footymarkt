import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_daily_spin", {
    p_user_id: user.id,
  });

  if (error) {
    if (error.message?.includes("already_spun_today")) {
      return NextResponse.json({ error: "already_spun_today" }, { status: 400 });
    }
    console.error("spin rpc error:", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  return NextResponse.json({ coinsWon: data });
}
