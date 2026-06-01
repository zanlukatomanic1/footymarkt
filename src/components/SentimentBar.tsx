type Props = {
  home: number;
  draw: number;
  away: number;
  height?: number;
  labels?: boolean;
};

export default function SentimentBar({ home, draw, away, height = 5, labels = true }: Props) {
  return (
    <div>
      <div
        style={{ height, borderRadius: 999, overflow: "hidden", gap: "1px" }}
        className="flex bg-[#111]"
      >
        <div
          style={{
            flex: home || 0.01,
            background: "rgba(0,255,135,0.65)",
            borderRadius: "999px 0 0 999px",
            transition: "flex 0.7s ease",
          }}
        />
        <div
          style={{
            flex: draw || 0.01,
            background: "#353535",
            transition: "flex 0.7s ease",
          }}
        />
        <div
          style={{
            flex: away || 0.01,
            background: "rgba(77,124,255,0.65)",
            borderRadius: "0 999px 999px 0",
            transition: "flex 0.7s ease",
          }}
        />
      </div>
      {labels && (
        <div className="mt-2 flex justify-between">
          <div>
            <div className="font-mono text-[12.5px] font-semibold tabular-nums text-brand">
              {home.toFixed(0)}%
            </div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint">
              Home
            </div>
          </div>
          <div className="text-center">
            <div className="font-mono text-[12.5px] font-semibold tabular-nums text-ink-dim">
              {draw.toFixed(0)}%
            </div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint">
              Draw
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[12.5px] font-semibold tabular-nums text-accent">
              {away.toFixed(0)}%
            </div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint">
              Away
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
