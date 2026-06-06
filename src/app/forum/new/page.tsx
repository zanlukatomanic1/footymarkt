import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/TopBar";
import NewPostForm from "./NewPostForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New post" };

export default async function NewForumPostPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <TopBar title="New post" subtitle="Ask a question or start a thread" />
      <div className="p-[22px] md:p-6 max-w-2xl">
        <NewPostForm />
      </div>
    </>
  );
}
