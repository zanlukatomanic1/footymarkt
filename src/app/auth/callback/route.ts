import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("username")
          .eq("id", user.id)
          .single();
        if (!profile?.username) {
          // New user — check for a pending referral cookie
          const cookieStore = cookies();
          const pendingRef = cookieStore.get("pending_ref")?.value;
          const refParam = pendingRef ? `?ref=${encodeURIComponent(pendingRef)}` : "";

          // Clear the cookie
          const response = NextResponse.redirect(`${origin}/username${refParam}`);
          response.cookies.set("pending_ref", "", { maxAge: 0, path: "/" });
          return response;
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
