// fm-home.jsx — Home Feed page

const { useState: useStateHome } = React;

const MATCHES = [
  { id:1, home:'England',    homeCode:'ENG', homeFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', away:'France',      awayCode:'FRA', awayFlag:'🇫🇷', competition:'WC 2026 · Group D', kickoff:'Today · 21:00', hp:46, dp:21, ap:33, vol:3241, predicted:false },
  { id:2, home:'Brazil',     homeCode:'BRA', homeFlag:'🇧🇷', away:'Argentina',  awayCode:'ARG', awayFlag:'🇦🇷', competition:'WC 2026 · Group A', kickoff:'Today · 18:00', hp:42, dp:26, ap:32, vol:5847, predicted:true, myPick:'home' },
  { id:3, home:'Germany',    homeCode:'GER', homeFlag:'🇩🇪', away:'Spain',       awayCode:'ESP', awayFlag:'🇪🇸', competition:'WC 2026 · Group C', kickoff:'Jun 22 · 15:00', hp:38, dp:28, ap:34, vol:2109, predicted:false },
  { id:4, home:'Portugal',   homeCode:'POR', homeFlag:'🇵🇹', away:'Netherlands', awayCode:'NED', awayFlag:'🇳🇱', competition:'WC 2026 · Group B', kickoff:'Jun 22 · 21:00', hp:44, dp:22, ap:34, vol:1876, predicted:false },
  { id:5, home:'Morocco',    homeCode:'MAR', homeFlag:'🇲🇦', away:'USA',          awayCode:'USA', awayFlag:'🇺🇸', competition:'WC 2026 · Group F', kickoff:'Jun 23 · 15:00', hp:35, dp:30, ap:35, vol:987,  predicted:false },
  { id:6, home:'Mexico',     homeCode:'MEX', homeFlag:'🇲🇽', away:'Canada',      awayCode:'CAN', awayFlag:'🇨🇦', competition:'WC 2026 · Group E', kickoff:'Jun 23 · 21:00', hp:48, dp:24, ap:28, vol:4521, predicted:false },
];

const PICK_COLOR = { home:'#00ff87', draw:'#666', away:'#4d7cff' };
const PICK_LABEL = (m, p) => ({ home: m.homeCode, draw: 'DRAW', away: m.awayCode })[p];

function MatchCard({ match }) {
  const [predicted, setPredicted] = useStateHome(match.predicted);
  const [myPick, setMyPick]       = useStateHome(match.myPick || null);
  const [hov, setHov]             = useStateHome(false);

  const predict = (pick) => { setPredicted(true); setMyPick(pick); };

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#171717' : '#141414',
        border: `1px solid ${hov ? '#2c2c2c' : '#1e1e1e'}`,
        borderRadius: 12, padding: '18px 18px 16px', cursor: 'default',
        display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'background 0.15s, border-color 0.15s',
        boxShadow: hov ? '0 0 0 1px rgba(0,255,135,0.04)' : 'none',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10.5, color: '#3a3a3a', fontFamily: "'DM Mono',monospace", letterSpacing: '0.04em' }}>{match.competition}</span>
        <span style={{ fontSize: 10.5, color: '#3a3a3a', fontFamily: "'DM Mono',monospace" }}>{match.kickoff}</span>
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>{match.homeFlag}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0', letterSpacing: '-0.2px', lineHeight: 1.2 }}>{match.home}</span>
          <span style={{ fontSize: 9.5, color: '#333', fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em' }}>{match.homeCode}</span>
        </div>
        <span style={{ fontSize: 10, color: '#2a2a2a', fontFamily: "'DM Mono',monospace", letterSpacing: '0.12em', flexShrink: 0 }}>VS</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, alignItems: 'flex-end' }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>{match.awayFlag}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0', letterSpacing: '-0.2px', lineHeight: 1.2, textAlign: 'right' }}>{match.away}</span>
          <span style={{ fontSize: 9.5, color: '#333', fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em' }}>{match.awayCode}</span>
        </div>
      </div>

      {/* Sentiment bar */}
      <FMSentimentBar home={match.hp} draw={match.dp} away={match.ap} />

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
        <span style={{ fontSize: 10.5, color: '#2e2e2e', fontFamily: "'DM Mono',monospace" }}>
          {match.vol.toLocaleString()} preds
        </span>
        {predicted ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: `${PICK_COLOR[myPick]}12`,
            border: `1px solid ${PICK_COLOR[myPick]}30`,
            padding: '4px 10px', borderRadius: 6,
            fontSize: 10.5, fontWeight: 700, color: PICK_COLOR[myPick],
            fontFamily: "'DM Mono',monospace", letterSpacing: '0.06em',
          }}>
            {FMIcons.check} {PICK_LABEL(match, myPick)}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 5 }}>
            {[['home', match.homeCode, '#00ff87'], ['draw', 'D', '#555'], ['away', match.awayCode, '#4d7cff']].map(([k, lbl, col]) => (
              <button key={k} onClick={() => predict(k)} style={{
                background: 'transparent', border: `1px solid ${col}28`,
                color: col, padding: '4px 9px', borderRadius: 6,
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Mono',monospace", letterSpacing: '0.06em',
                transition: 'border-color 0.12s, color 0.12s',
              }}>
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FMHomeFeed() {
  const [filter, setFilter] = useStateHome('all');

  return (
    <FMPageShell active="home" title="Today's Matches" subtitle="WC 2026 · 6 open predictions">
      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Predictions', val: '31', sub: 'total' },
          { label: 'Correct', val: '17', sub: '53.4%' },
          { label: 'Coins', val: '2,450', sub: 'balance', accent: true },
          { label: 'Rank', val: '#47', sub: 'global' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: '#141414', border: '1px solid #1e1e1e', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.09em', fontFamily: "'DM Mono',monospace", marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.accent ? '#00ff87' : '#d0d0d0', fontFamily: "'DM Mono',monospace", fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 10.5, color: '#3a3a3a', marginTop: 3, fontFamily: "'DM Mono',monospace" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, alignItems: 'center' }}>
        {[['all','All'],['today','Today'],['tomorrow','Tomorrow'],['week','This Week']].map(([k, lbl]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            background: filter === k ? '#00ff87' : 'transparent',
            color: filter === k ? '#080808' : '#4a4a4a',
            border: `1px solid ${filter === k ? '#00ff87' : '#222'}`,
            padding: '5px 13px', borderRadius: 6, fontSize: 12,
            fontWeight: filter === k ? 600 : 400, cursor: 'pointer',
          }}>
            {lbl}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#333', fontFamily: "'DM Mono',monospace" }}>Sorted by kickoff ↑</span>
      </div>

      {/* Today */}
      <FMDivider label="Today · Jun 20 · 2 matches" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {MATCHES.slice(0,2).map(m => <MatchCard key={m.id} match={m} />)}
        <div style={{ background: '#0d0d0d', border: '1px dashed #1a1a1a', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, opacity: 0.5 }}>
          <span style={{ fontSize: 11, color: '#2a2a2a', fontFamily: "'DM Mono',monospace" }}>No more today</span>
        </div>
      </div>

      {/* Upcoming */}
      <FMDivider label="Jun 22–23 · 4 matches" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {MATCHES.slice(2).map(m => <MatchCard key={m.id} match={m} />)}
      </div>
    </FMPageShell>
  );
}

Object.assign(window, { FMHomeFeed });
