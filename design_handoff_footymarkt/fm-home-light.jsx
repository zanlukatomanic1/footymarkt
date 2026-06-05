// fm-home-light.jsx — Light mode Home Feed

const { useState: useStateHome } = React;

const MATCHES = [
  { id:1, home:'England',  homeCode:'ENG', homeFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', away:'France',      awayCode:'FRA', awayFlag:'🇫🇷', competition:'WC 2026 · Group D', kickoff:'Today · 21:00', hp:46, dp:21, ap:33, vol:3241, predicted:false },
  { id:2, home:'Brazil',   homeCode:'BRA', homeFlag:'🇧🇷', away:'Argentina',  awayCode:'ARG', awayFlag:'🇦🇷', competition:'WC 2026 · Group A', kickoff:'Today · 18:00', hp:42, dp:26, ap:32, vol:5847, predicted:true, myPick:'home' },
  { id:3, home:'Germany',  homeCode:'GER', homeFlag:'🇩🇪', away:'Spain',      awayCode:'ESP', awayFlag:'🇪🇸', competition:'WC 2026 · Group C', kickoff:'Jun 22 · 15:00', hp:38, dp:28, ap:34, vol:2109, predicted:false },
  { id:4, home:'Portugal', homeCode:'POR', homeFlag:'🇵🇹', away:'Netherlands',awayCode:'NED', awayFlag:'🇳🇱', competition:'WC 2026 · Group B', kickoff:'Jun 22 · 21:00', hp:44, dp:22, ap:34, vol:1876, predicted:false },
  { id:5, home:'Morocco',  homeCode:'MAR', homeFlag:'🇲🇦', away:'USA',        awayCode:'USA', awayFlag:'🇺🇸', competition:'WC 2026 · Group F', kickoff:'Jun 23 · 15:00', hp:35, dp:30, ap:35, vol:987,  predicted:false },
  { id:6, home:'Mexico',   homeCode:'MEX', homeFlag:'🇲🇽', away:'Canada',     awayCode:'CAN', awayFlag:'🇨🇦', competition:'WC 2026 · Group E', kickoff:'Jun 23 · 21:00', hp:48, dp:24, ap:28, vol:4521, predicted:false },
];

const PICK_COLOR = { home: window.LM.accent, draw:'#888', away: window.LM.blue };
const PICK_LABEL = (m, p) => ({ home: m.homeCode, draw: 'DRAW', away: m.awayCode })[p];

function MatchCard({ match }) {
  const [predicted, setPredicted] = useStateHome(match.predicted);
  const [myPick, setMyPick]       = useStateHome(match.myPick || null);
  const [hov, setHov]             = useStateHome(false);
  const predict = (pick) => { setPredicted(true); setMyPick(pick); };
  const L = window.LM;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#FAFBFD' : L.card,
        border: `1px solid ${hov ? '#D4DCE8' : L.border}`,
        borderRadius: 12, padding: '18px 18px 16px', cursor: 'default',
        display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
        boxShadow: hov ? '0 2px 12px rgba(15,22,36,0.07)' : '0 1px 3px rgba(15,22,36,0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10.5, color: L.text3, fontFamily: "'DM Mono',monospace", letterSpacing: '0.04em' }}>{match.competition}</span>
        <span style={{ fontSize: 10.5, color: L.text3, fontFamily: "'DM Mono',monospace" }}>{match.kickoff}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>{match.homeFlag}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: L.text, letterSpacing: '-0.2px', lineHeight: 1.2 }}>{match.home}</span>
          <span style={{ fontSize: 9.5, color: L.text3, fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em' }}>{match.homeCode}</span>
        </div>
        <span style={{ fontSize: 10, color: L.text3sub, fontFamily: "'DM Mono',monospace", letterSpacing: '0.12em', flexShrink: 0 }}>VS</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, alignItems: 'flex-end' }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>{match.awayFlag}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: L.text, letterSpacing: '-0.2px', lineHeight: 1.2, textAlign: 'right' }}>{match.away}</span>
          <span style={{ fontSize: 9.5, color: L.text3, fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em' }}>{match.awayCode}</span>
        </div>
      </div>

      <FMSentimentBar home={match.hp} draw={match.dp} away={match.ap} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
        <span style={{ fontSize: 10.5, color: L.text3, fontFamily: "'DM Mono',monospace" }}>
          {match.vol.toLocaleString()} preds
        </span>
        {predicted ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: `${PICK_COLOR[myPick]}12`, border: `1px solid ${PICK_COLOR[myPick]}30`,
            padding: '4px 10px', borderRadius: 6,
            fontSize: 10.5, fontWeight: 700, color: PICK_COLOR[myPick],
            fontFamily: "'DM Mono',monospace", letterSpacing: '0.06em',
          }}>
            {FMIcons.check} {PICK_LABEL(match, myPick)}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 5 }}>
            {[['home', match.homeCode, L.accent], ['draw', 'D', L.text3], ['away', match.awayCode, L.blue]].map(([k, lbl, col]) => (
              <button key={k} onClick={() => predict(k)} style={{
                background: 'transparent', border: `1px solid ${col}38`,
                color: col, padding: '4px 9px', borderRadius: 6,
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Mono',monospace", letterSpacing: '0.06em',
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
  const L = window.LM;

  return (
    <FMPageShell active="home" title="Today's Matches" subtitle="WC 2026 · 6 open predictions">
      <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
        {[
          { label:'Predictions', val:'31',    sub:'total' },
          { label:'Correct',     val:'17',    sub:'53.4%' },
          { label:'Coins',       val:'2,450', sub:'balance', accent:true },
          { label:'Rank',        val:'#47',   sub:'global' },
        ].map(s => (
          <div key={s.label} style={{ flex:1, background:L.card, border:`1px solid ${L.border}`, borderRadius:10, padding:'12px 14px', boxShadow:'0 1px 3px rgba(15,22,36,0.04)' }}>
            <div style={{ fontSize:10, color:L.text3, textTransform:'uppercase', letterSpacing:'0.09em', fontFamily:"'DM Mono',monospace", marginBottom:5 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:s.accent ? L.accent : L.text, fontFamily:"'DM Mono',monospace", fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{s.val}</div>
            <div style={{ fontSize:10.5, color:L.text3, marginTop:3, fontFamily:"'DM Mono',monospace" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:22, alignItems:'center' }}>
        {[['all','All'],['today','Today'],['tomorrow','Tomorrow'],['week','This Week']].map(([k,lbl]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            background: filter===k ? L.accent : 'transparent',
            color: filter===k ? '#fff' : L.text2,
            border: `1px solid ${filter===k ? L.accent : L.border}`,
            padding:'5px 13px', borderRadius:6, fontSize:12,
            fontWeight: filter===k ? 600 : 400, cursor:'pointer',
          }}>{lbl}</button>
        ))}
        <div style={{ flex:1 }} />
        <span style={{ fontSize:11, color:L.text3, fontFamily:"'DM Mono',monospace" }}>Sorted by kickoff ↑</span>
      </div>

      <FMDivider label="Today · Jun 20 · 2 matches" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {MATCHES.slice(0,2).map(m => <MatchCard key={m.id} match={m} />)}
        <div style={{ background:L.borderSub, border:`1px dashed ${L.border}`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', minHeight:180 }}>
          <span style={{ fontSize:11, color:L.text3sub, fontFamily:"'DM Mono',monospace" }}>No more today</span>
        </div>
      </div>

      <FMDivider label="Jun 22–23 · 4 matches" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {MATCHES.slice(2).map(m => <MatchCard key={m.id} match={m} />)}
      </div>
    </FMPageShell>
  );
}

Object.assign(window, { FMHomeFeed });
