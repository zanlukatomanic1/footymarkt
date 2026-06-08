import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const homeTeam = sp.get("homeTeam") ?? "Home";
  const awayTeam = sp.get("awayTeam") ?? "Away";
  const homeCode = sp.get("homeCode") ?? "HOM";
  const awayCode = sp.get("awayCode") ?? "AWY";
  const pick = sp.get("pick") as "home" | "draw" | "away" | null;
  const bet = sp.get("bet") ?? "100";
  const payout = sp.get("payout") ?? "—";
  const home = parseFloat(sp.get("home") ?? "33");
  const draw = parseFloat(sp.get("draw") ?? "34");
  const away = parseFloat(sp.get("away") ?? "33");
  const comp = sp.get("comp") ?? "FIFA World Cup 2026";
  const multiplier = sp.get("mult") ?? "";

  const pickLabel =
    pick === "home" ? homeTeam : pick === "away" ? awayTeam : pick === "draw" ? "Draw" : null;

  const pickPct = pick === "home" ? home : pick === "away" ? away : pick === "draw" ? draw : 0;

  const BRAND = "#00ff87";
  const HOME_COLOR = "#00ff87";
  const DRAW_COLOR = "#888888";
  const AWAY_COLOR = "#4d7cff";
  const pickColor = pick === "home" ? HOME_COLOR : pick === "away" ? AWAY_COLOR : DRAW_COLOR;

  const barTotal = home + draw + away || 1;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          background: "#070707",
          padding: "48px 60px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle radial glow behind pick */}
        {pick && (
          <div
            style={{
              position: "absolute",
              top: -100,
              left: pick === "home" ? 0 : pick === "away" ? 600 : 300,
              width: 600,
              height: 600,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${pickColor}12 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Top row: comp badge + branding */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#141414",
              border: "1px solid #1e1e1e",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 18,
              color: BRAND,
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}
          >
            {comp}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.5px",
            }}
          >
            <span style={{ color: BRAND }}>Footy</span>
            <span style={{ color: "#ffffff" }}>Markt</span>
          </div>
        </div>

        {/* Teams row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 48,
            marginBottom: 36,
            flex: 1,
          }}
        >
          {/* Home team */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 42,
                fontWeight: 800,
                color: pick === "home" ? HOME_COLOR : "#ffffff",
                letterSpacing: "-1px",
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              {homeTeam}
            </div>
            <div
              style={{
                fontSize: 18,
                color: "#666666",
                letterSpacing: "0.12em",
                fontWeight: 600,
              }}
            >
              {homeCode}
            </div>
          </div>

          {/* VS */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                fontSize: 24,
                color: "#444444",
                letterSpacing: "0.2em",
                fontWeight: 600,
              }}
            >
              VS
            </div>
          </div>

          {/* Away team */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 42,
                fontWeight: 800,
                color: pick === "away" ? AWAY_COLOR : "#ffffff",
                letterSpacing: "-1px",
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              {awayTeam}
            </div>
            <div
              style={{
                fontSize: 18,
                color: "#666666",
                letterSpacing: "0.12em",
                fontWeight: 600,
              }}
            >
              {awayCode}
            </div>
          </div>
        </div>

        {/* Sentiment bar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              height: 14,
              borderRadius: 999,
              overflow: "hidden",
              gap: 2,
              background: "#1a1a1a",
            }}
          >
            <div
              style={{
                flex: home / barTotal,
                background: `${HOME_COLOR}aa`,
                borderRadius: "999px 0 0 999px",
              }}
            />
            <div
              style={{
                flex: draw / barTotal,
                background: "#555555",
              }}
            />
            <div
              style={{
                flex: away / barTotal,
                background: `${AWAY_COLOR}aa`,
                borderRadius: "0 999px 999px 0",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            <span style={{ color: HOME_COLOR }}>{home.toFixed(0)}% {homeCode}</span>
            <span style={{ color: "#888888" }}>{draw.toFixed(0)}% Draw</span>
            <span style={{ color: AWAY_COLOR }}>{away.toFixed(0)}% {awayCode}</span>
          </div>
        </div>

        {/* Pick info bar */}
        {pick && pickLabel && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#141414",
              border: `1px solid ${pickColor}40`,
              borderRadius: 14,
              padding: "16px 24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  background: `${pickColor}18`,
                  border: `1px solid ${pickColor}40`,
                  borderRadius: 8,
                  padding: "4px 12px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: pickColor,
                  letterSpacing: "0.04em",
                }}
              >
                MY PICK
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: pickColor }}>
                {pickLabel}
              </div>
              <div
                style={{
                  fontSize: 15,
                  color: "#666666",
                  fontWeight: 600,
                }}
              >
                {pickPct.toFixed(0)}% of market
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ fontSize: 13, color: "#666666", fontWeight: 600 }}>Wagered</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#ffffff" }}>{bet}</div>
              </div>
              <div
                style={{
                  width: 1,
                  height: 36,
                  background: "#1e1e1e",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ fontSize: 13, color: "#666666", fontWeight: 600 }}>
                  Payout{multiplier ? ` (${multiplier}×)` : ""}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: pickColor }}>
                  +{payout}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generic CTA when no pick */}
        {!pick && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#141414",
              border: `1px solid ${BRAND}30`,
              borderRadius: 14,
              padding: "18px 24px",
              fontSize: 20,
              fontWeight: 700,
              color: BRAND,
            }}
          >
            Place your prediction on FootyMarkt
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
