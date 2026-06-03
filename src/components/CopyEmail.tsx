"use client";

import { useState } from "react";

const EMAIL = "info@footymarkt.com";

export default function CopyEmail({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={`flex items-center gap-[6px] ${className ?? ""}`}>
      <a
        href={`mailto:${EMAIL}`}
        className="font-mono text-[11px] text-[#2a2a2a] hover:text-[#444] transition-colors"
      >
        {EMAIL}
      </a>
      <button
        onClick={copy}
        title="Copy email"
        className="flex items-center justify-center rounded text-[#2a2a2a] hover:text-[#555] transition-colors"
      >
        {copied ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00ff87" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        )}
      </button>
    </div>
  );
}
