"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewPostForm() {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setBusy(true);
    setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErr("Not signed in");
      setBusy(false);
      return;
    }
    const { data, error } = await supabase
      .from("forum_posts")
      .insert({ user_id: user.id, title: title.trim(), description: description.trim() })
      .select("id")
      .single();
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    router.push(`/forum/${data.id}`);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-[12px] border border-line bg-card p-5">
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">Question</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={140}
          placeholder="What's your question?"
          className="rounded-[8px] border border-line bg-element px-3 py-2.5 text-[14px] text-ink outline-none focus:border-line-strong"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Add details, context, or your take..."
          className="resize-none rounded-[8px] border border-line bg-element px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-line-strong"
        />
      </div>
      {err && <div className="font-mono text-[11px] text-red-400">{err}</div>}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push("/forum")}
          className="rounded-[8px] border border-line px-4 py-[7px] text-[12.5px] text-ink-muted hover:border-line-strong"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || !title.trim() || !description.trim()}
          className="rounded-[8px] bg-brand px-4 py-[7px] text-[12.5px] font-semibold text-[#080808] disabled:opacity-50"
        >
          {busy ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
