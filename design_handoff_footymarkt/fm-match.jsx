// fm-match.jsx — Match Prediction Page

const { useState: useStateMatch } = React;

const MATCH = {
  home: 'England', homeCode: 'ENG', homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  away: 'France',  awayCode: 'FRA', awayFlag: '🇫🇷',
  competition: 'WC 2026 · Group D', kickoff: 'Jun 20, 2026 · 21:00 BST',
  venue: 'SoFi Stadium, Los Angeles',
  hp: 46, dp: 21, ap: 33,
  totalPreds: 3241,
};

const PRED_OPTIONS = [
  { id:'home', label:'Home Win', team:'England', pct:46, reward:200, color:'#00ff87', dimColor:'rgba(0,255,135,0.15)', borderColor:'rgba(0,255,135,0.4)', bg:'rgba(0,255,135,0.06)' },
  { id:'draw', label:'Draw',     team:'Neither', pct:21, reward:460, color:'#888',    dimColor:'rgba(136,136,136,0.12)', borderColor:'rgba(136,136,136,0.3)', bg:'rgba(136,136,136,0.04)' },
  { id:'away', label:'Away Win', team:'France',  pct:33, reward:290, color:'#4d7cff', dimColor:'rgba(77,124,255,0.15)', borderColor:'rgba(77,124,255,0.4)', bg:'rgba(77,124,255,0.06)' },
];

const RECENT = [
  { user:'xavi_wizard',      pick:'home', ago:'2m ago' },
  { user:'ballond_or99',     pick:'away', ago:'4m ago' },
  { user:'pressing_machine', pick:'home', ago:'5m ago' },
  { user:'tiki_prophet',     pick:'draw', ago:'7m ago' },
  { user:'counterpress_fc',  pick:'away', ago:'9m ago' },
];

const PICK_COL = { home:'#00ff87', draw:'#888', away:'#4d7cff' };
const PICK_LBL = { home:'England', draw:'Draw', away:'France' };

function PredCard({ opt, selected, onSelect, anySelected }) {
  const isSelected = selected === opt.id;
  const dimmed = anySelected && !isSelected;
  const [hov, setHov] = useStateMatch(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onSelect(opt.id)}
      style={{
        flex: 1, borderRadius: 14, padding: '28px 24px', cursor: 'pointer',
        background: isSelected ? opt.bg : (hov && !dimmed) ? '#171717' : '#141414',
        border: `1.5px solid ${isSelected ? opt.borderColor : (hov && !dimmed) ? '#2a2a2a' : '#1e1e1e'}`,
        opacity: dimmed ? 0.35 : 1,
        transition: 'all 0.2s',
        display: 'flex', flexDirection: 'column', gap: 12,
        boxShadow: isSelected ? `0 0 24px ${opt.color}12, 0 0 0 1px ${opt.color}18` : 'none',
        position: 'relative',
      }}
    >
      {isSelected && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          display: 'flex', alignItems: 'center', gap: 5,
          background: `${opt.color}20`, border: `1px solid ${opt.color}40`,
          padding: '3px 9px', borderRadius: 20,
          fontSize: 10, fontWeight: 700, color: opt.color, fontFamily: "'DM Mono',monospace",
        }}>
          {FMIcons.check} Locked in
        </div>
      )}

      <div>
        <div style={{ fontSize: 10.5, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'DM Mono',monospace", marginBottom: 6 }}>{opt.label}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: isSelected ? opt.color : '#ccc' }}>{opt.team}</div>
      </div>

      {/* Big percentage */}
      <div style={{ fontFamily: "'DM Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>
        <div style={{ fontSize: 46, fontWeight: 500, color: isSelected ? opt.color : '#d0d0d0', lineHeight: 1, letterSpacing: '-2px' }}>
          {opt.pct}<span style={{ fontSize: 22, color: '#444', letterSpacing: 0 }}>%</span>
        </div>
        <div style={{ fontSize: 10.5, color: '#333', marginTop: 4 }}>market sentiment</div>
      </div>

      <div style={{ height: 1, background: '#1a1a1a' }} />

      {/* Reward */}
      <div>
        <div style={{ fontSize: 10, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.09em', fontFamily: "'DM Mono',monospace", marginBottom: 6 }}>If correct</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: opt.color, display: 'flex' }}>{FMIcons.coin}</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: opt.color, fontFamily: "'DM Mono',monospace', fontVariantNumeric: 'tabular-nums'" }}>+{opt.reward}</span>
          <span style={{ fontSize: 11, color: '#3a3a3a', alignSelf: 'flex-end', marginBottom: 2 }}>coins</span>
        </div>
      </div>

      {!isSelected && (
        <div style={{
          marginTop: 'auto', padding: '9px 14px', borderRadius: 8,
          background: anySelected ? 'transparent' : (hov ? `${opt.color}18` : 'transparent'),
          border: `1px solid ${anySelected ? '#1a1a1a' : (hov ? `${opt.color}35` : '#1e1e1e')}`,
          textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: anySelected ? '#2a2a2a' : (hov ? opt.color : '#3a3a3a'),
          transition: 'all 0.15s',
        }}>
          {anySelected ? '—' : `Pick ${opt.team}`}
        </div>
      )}
    </div>
  );
}

function FMMatchPrediction() {
  const [selected, setSelected] = useStateMatch(null);
  const anySelected = selected !== null;

  const handleSelect = (id) => {
    setSelected(prev => prev === id ? null : id);
  };

  return (
    <FMPageShell active="home" title="Match Prediction" subtitle="WC 2026 · Group D">
      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 22, cursor: 'pointer', width: 'fit-content' }}>
        <span style={{ color: '#3a3a3a', display: 'flex' }}>{FMIcons.back}</span>
        <span style={{ fontSize: 12, color: '#3a3a3a', fontFamily: "'DM Mono',monospace" }}>Back to feed</span>
      </div>

      {/* Match hero */}
      <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 14, padding: '28px 32px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FMTag>{MATCH.competition}</FMTag>
            <div style={{ fontSize: 11, color: '#3a3a3a', fontFamily: "'DM Mono',monospace", marginTop: 2 }}>{MATCH.kickoff}</div>
            <div style={{ fontSize: 10.5, color: '#2e2e2e', fontFamily: "'DM Mono',monospace" }}>{MATCH.venue}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#3a3a3a', display: 'flex', fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{MATCH.totalPreds.toLocaleString()} predictions</span>
          </div>
        </div>

        {/* Teams row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <span style={{ fontSize: 36, lineHeight: 1 }}>{MATCH.homeFlag}</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{MATCH.home}</span>
            <span style={{ fontSize: 12, color: '#3a3a3a', fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em' }}>{MATCH.homeCode}</span>
          </div>

          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: '#2a2a2a', fontFamily: "'DM Mono',monospace", letterSpacing: '0.18em', marginBottom: 8 }}>VS</div>
            <FMSentimentBar home={MATCH.hp} draw={MATCH.dp} away={MATCH.ap} height={4} labels={false} />
            <div style={{ fontSize: 10, color: '#2a2a2a', marginTop: 6, fontFamily: "'DM Mono',monospace" }}>
              {MATCH.hp}% · {MATCH.dp}% · {MATCH.ap}%
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, alignItems: 'flex-end' }}>
            <span style={{ fontSize: 36, lineHeight: 1 }}>{MATCH.awayFlag}</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1, textAlign: 'right' }}>{MATCH.away}</span>
            <span style={{ fontSize: 12, color: '#3a3a3a', fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em' }}>{MATCH.awayCode}</span>
          </div>
        </div>
      </div>

      {/* Prediction cards */}
      {anySelected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 14px', background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.15)', borderRadius: 10 }}>
          <span style={{ color: '#00ff87', display: 'flex' }}>{FMIcons.lock}</span>
          <span style={{ fontSize: 13, color: '#00ff87', fontWeight: 600 }}>Prediction locked in — {PICK_LBL[selected]}</span>
          <button onClick={() => setSelected(null)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#3a3a3a', cursor: 'pointer', fontSize: 11, fontFamily: "'DM Mono',monospace", display: 'flex', alignItems: 'center', gap: 4 }}>
            {FMIcons.x} Change
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
        {PRED_OPTIONS.map(opt => (
          <PredCard key={opt.id} opt={opt} selected={selected} onSelect={handleSelect} anySelected={anySelected} />
        ))}
      </div>

      {/* Recent activity */}
      <div>
        <div style={{ fontSize: 11, color: '#2e2e2e', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Recent predictions</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {RECENT.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#141414', border: '1px solid #1e1e1e', borderRadius: 20, padding: '5px 10px' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#555', fontWeight: 700 }}>{r.user[0].toUpperCase()}</div>
              <span style={{ fontSize: 11, color: '#555' }}>{r.user}</span>
              <span style={{ fontSize: 10, color: PICK_COL[r.pick], fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{PICK_LBL[r.pick]}</span>
              <span style={{ fontSize: 9.5, color: '#2e2e2e', fontFamily: "'DM Mono',monospace" }}>{r.ago}</span>
            </div>
          ))}
        </div>
      </div>
    </FMPageShell>
  );
}

Object.assign(window, { FMMatchPrediction });
