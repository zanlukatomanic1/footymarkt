"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = { type: "idle" | "loading" | "ok" | "err"; msg?: string };

function SyncButton({
  label,
  endpoint,
  onDone,
}: {
  label: string;
  endpoint: string;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<Status>({ type: "idle" });

  const run = async () => {
    setStatus({ type: "loading" });
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ type: "err", msg: json.error ?? `HTTP ${res.status}` });
        return;
      }
      const detail =
        "upserted" in json
          ? `${json.upserted} fixtures synced`
          : `${json.settled} result${json.settled !== 1 ? "s" : ""} settled`;
      setStatus({ type: "ok", msg: detail });
      onDone();
    } catch (e: unknown) {
      setStatus({ type: "err", msg: e instanceof Error ? e.message : "Network error" });
    }
  };

  const isLoading = status.type === "loading";
  const colors = {
    idle: { bg: "#161616", border: "#2a2a2a", color: "#aaa" },
    loading: { bg: "#161616", border: "#333", color: "#666" },
    ok: { bg: "rgba(0,255,135,0.06)", border: "rgba(0,255,135,0.25)", color: "#00ff87" },
    err: { bg: "rgba(255,60,60,0.06)", border: "rgba(255,60,60,0.25)", color: "#ff5555" },
  }[status.type];

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={run}
        disabled={isLoading}
        className="rounded-[8px] border px-4 py-[7px] font-mono text-[12px] font-semibold transition-all duration-150"
        style={{
          background: colors.bg,
          borderColor: colors.border,
          color: colors.color,
          cursor: isLoading ? "default" : "pointer",
        }}
      >
        {isLoading ? "Syncing…" : label}
      </button>
      {status.msg && (
        <span
          className="font-mono text-[11px]"
          style={{ color: status.type === "err" ? "#ff5555" : "#00ff87" }}
        >
          {status.msg}
        </span>
      )}
    </div>
  );
}

export default function SyncButtons() {
  const router = useRouter();
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-ghost">
        football-data.org
      </span>
      <SyncButton
        label="Sync Fixtures"
        endpoint="/api/sync-fixtures"
        onDone={() => router.refresh()}
      />
      <SyncButton
        label="Sync Results"
        endpoint="/api/sync-results"
        onDone={() => router.refresh()}
      />
    </div>
  );
}
