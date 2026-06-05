"use client";

import { useState } from "react";

const CopyIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

function CopyButton({ getText, label }: { getText: () => string; label: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(getText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={copy}
      className="flex shrink-0 items-center gap-1.5 rounded-[6px] border border-line px-2.5 py-1 font-mono text-[10.5px] font-medium transition-colors hover:border-brand/40 hover:text-brand"
      style={{ color: copied ? "var(--color-brand)" : "var(--color-ink-faint)" }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "Copied" : label}
    </button>
  );
}

export default function CopyReferralLink({ referralCode }: { referralCode: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-[8px] border border-line bg-element px-3 py-2.5">
        <span className="flex-1 truncate font-mono text-[11px] text-ink-faint">
          footymarkt.com/login?ref={referralCode}
        </span>
        <CopyButton
          getText={() => `${window.location.origin}/login?ref=${referralCode}`}
          label="Copy link"
        />
      </div>
      <div className="flex items-center gap-2 rounded-[8px] border border-line bg-element px-3 py-2.5">
        <span className="flex-1 font-mono text-[11px] text-ink-faint">
          Code: <span className="text-ink">{referralCode}</span>
        </span>
        <CopyButton getText={() => referralCode} label="Copy code" />
      </div>
    </div>
  );
}
