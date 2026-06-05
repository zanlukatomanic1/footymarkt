// fm-match-light.jsx — Light mode Match Prediction

const { useState: useStateMatch } = React;

const MATCH = {
  home:'England', homeCode:'ENG', homeFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  away:'France',  awayCode:'FRA', awayFlag:'🇫🇷',
  competition:'WC 2026 · Group D', kickoff:'Jun 20, 2026 · 21:00 BST',
  venue:'SoFi Stadium, Los Angeles',
  hp:46, dp:21, ap:33, totalPreds:3241,
};

const PRED_OPTIONS = [
  { id:'home', label:'Home Win', team:'England', pct:46, reward:200,
    color:'#5A9600', dimColor:'rgba(90,150,0,0.12)', borderColor:'rgba(90,150,0,0.35)', bg:'rgba(90,150,0,0.06)' },
  { id:'draw', label:'Draw',     team:'Neither', pct:21, reward:460,
    color:'#7A8898', dimColor:'rgba(122,136,152,0.10)', borderColor:'rgba(122,136,152,0.28)', bg:'rgba(122,136,152,0.04)' },
  { id:'away', label:'Away Win', team:'France',  pct:33, reward:290,
    color:'#3560D8', dimColor:'rgba(53,96,216,0.12)', borderColor:'rgba(53,96,216,0.35)', bg:'rgba(53,96,216,0.05)' },
];

const PICK_COL = { home:'#5A9600', draw:'#7A8898', away:'#3560D8' };
const PICK_LBL = { home:'England', draw:'Draw', away:'France' };

const RECENT = [
  { user:'xavi_wizard',      pick:'home', ago:'2m ago' },
  { user:'ballond_or99',     pick:'away', ago:'4m ago' },
  { user:'pressing_machine', pick:'home', ago:'5m ago' },
  { user:'tiki_prophet',     pick:'draw', ago:'7m ago' },
  { user:'counterpress_fc',  pick:'away', ago:'9m ago' },
];

function PredCard({ opt, selected, onSelect, anySelected }) {
  const isSelected = selected === opt.id;
  const dimmed = anySelected && !isSelected;
  const [hov, setHov] = useStateMatch(false);
  const L = window.LM;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onSelect(opt.id)}
      style={{
        flex:1, borderRadius:14, padding:'28px 24px', cursor:'pointer',
        background: isSelected ? opt.bg : (hov && !dimmed) ? '#FAFBFD' : L.card,
        border: `1.5px solid ${isSelected ? opt.borderColor : (hov && !dimmed) ? L.border : L.border}`,
        opacity: dimmed ? 0.35 : 1,
        transition: 'all 0.2s',
        display: 'flex', flexDirection: 'column', gap: 12,
        boxShadow: isSelected
          ? `0 0 24px ${opt.color}18, 0 2px 12px rgba(15,22,36,0.08)`
          : hov ? '0 2px 12px rgba(15,22,36,0.07)' : '0 1px 3px rgba(15,22,36,0.04)',
        position: 'relative',
      }}
    >
      {isSelected && (
        <div style={{
          position:'absolute', top:14, right:14,
          display:'flex', alignItems:'center', gap:5,
          background:`${opt.color}15`, border:`1px solid ${opt.color}35`,
          padding:'3px 9px', borderRadius:20,
          fontSize:10, fontWeight:700, color:opt.color, fontFamily:"'DM Mono',monospace",
        }}>
          {FMIcons.check} Locked in
        </div>
      )}

      <div>
        <div style={{ fontSize:10.5, color:window.LM.text3, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:"'DM Mono',monospace", marginBottom:6 }}>{opt.label}</div>
        <div style={{ fontSize:15, fontWeight:600, color: isSelected ? opt.color : window.LM.text }}>{opt.team}</div>
      </div>

      <div style={{ fontFamily:"'DM Mono',monospace", fontVariantNumeric:'tabular-nums' }}>
        <div style={{ fontSize:46, fontWeight:500, color: isSelected ? opt.color : window.LM.text, lineHeight:1, letterSpacing:'-2px' }}>
          {opt.pct}<span style={{ fontSize:22, color:window.LM.text3, letterSpacing:0 }}>%</span>
        </div>
        <div style={{ fontSize:10.5, color:window.LM.text3, marginTop:4 }}>market sentiment</div>
      </div>

      <div style={{ height:1, background:window.LM.border }} />

      <div>
        <div style={{ fontSize:10, color:window.LM.text3, textTransform:'uppercase', letterSpacing:'0.09em', fontFamily:"'DM Mono',monospace", marginBottom:6 }}>If correct</div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ color:opt.color, display:'flex' }}>{FMIcons.coin}</span>
          <span style={{ fontSize:22, fontWeight:700, color:opt.color, fontFamily:"'DM Mono',monospace", fontVariantNumeric:'tabular-nums' }}>+{opt.reward}</span>
          <span style={{ fontSize:11, color:window.LM.text3, alignSelf:'flex-end', marginBottom:2 }}>coins</span>
        </div>
      </div>

      {!isSelected && (
        <div style={{
          marginTop:'auto', padding:'9px 14px', borderRadius:8,
          background: anySelected ? 'transparent' : (hov ? `${opt.color}10` : 'transparent'),
          border: `1px solid ${anySelected ? window.LM.border : (hov ? `${opt.color}30` : window.LM.border)}`,
          textAlign:'center', fontSize:12.5, fontWeight:600,
          color: anySelected ? window.LM.text3sub : (hov ? opt.color : window.LM.text3),
          transition:'all 0.15s',
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
  const L = window.LM;
  const handleSelect = (id) => setSelected(prev => prev === id ? null : id);

  return (
    <FMPageShell active="home" title="Match Prediction" subtitle="WC 2026 · Group D">
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:22, cursor:'pointer', width:'fit-content' }}>
        <span style={{ color:L.text3, display:'flex' }}>{FMIcons.back}</span>
        <span style={{ fontSize:12, color:L.text3, fontFamily:"'DM Mono',monospace" }}>Back to feed</span>
      </div>

      <div style={{ background:L.card, border:`1px solid ${L.border}`, borderRadius:14, padding:'28px 32px', marginBottom:20, boxShadow:'0 1px 4px rgba(15,22,36,0.05)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <FMTag>{MATCH.competition}</FMTag>
            <div style={{ fontSize:11, color:L.text3, fontFamily:"'DM Mono',monospace", marginTop:2 }}>{MATCH.kickoff}</div>
            <div style={{ fontSize:10.5, color:L.text3sub, fontFamily:"'DM Mono',monospace" }}>{MATCH.venue}</div>
          </div>
          <div style={{ fontSize:11, color:L.text3, fontFamily:"'DM Mono',monospace" }}>{MATCH.totalPreds.toLocaleString()} predictions</div>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:24 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:6, flex:1 }}>
            <span style={{ fontSize:36, lineHeight:1 }}>{MATCH.homeFlag}</span>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:L.text, letterSpacing:'-0.5px', lineHeight:1.1 }}>{MATCH.home}</span>
            <span style={{ fontSize:12, color:L.text3, fontFamily:"'DM Mono',monospace", letterSpacing:'0.1em' }}>{MATCH.homeCode}</span>
          </div>
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{ fontSize:11, color:L.text3sub, fontFamily:"'DM Mono',monospace", letterSpacing:'0.18em', marginBottom:8 }}>VS</div>
            <FMSentimentBar home={MATCH.hp} draw={MATCH.dp} away={MATCH.ap} height={4} labels={false} />
            <div style={{ fontSize:10, color:L.text3, marginTop:6, fontFamily:"'DM Mono',monospace" }}>{MATCH.hp}% · {MATCH.dp}% · {MATCH.ap}%</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, flex:1, alignItems:'flex-end' }}>
            <span style={{ fontSize:36, lineHeight:1 }}>{MATCH.awayFlag}</span>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:L.text, letterSpacing:'-0.5px', lineHeight:1.1, textAlign:'right' }}>{MATCH.away}</span>
            <span style={{ fontSize:12, color:L.text3, fontFamily:"'DM Mono',monospace", letterSpacing:'0.1em' }}>{MATCH.awayCode}</span>
          </div>
        </div>
      </div>

      {anySelected && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, padding:'10px 14px', background:`${L.accentBg}`, border:`1px solid ${L.accentBorder}`, borderRadius:10 }}>
          <span style={{ color:L.accent, display:'flex' }}>{FMIcons.lock}</span>
          <span style={{ fontSize:13, color:L.accent, fontWeight:600 }}>Prediction locked in — {PICK_LBL[selected]}</span>
          <button onClick={() => setSelected(null)} style={{ marginLeft:'auto', background:'transparent', border:'none', color:L.text3, cursor:'pointer', fontSize:11, fontFamily:"'DM Mono',monospace", display:'flex', alignItems:'center', gap:4 }}>
            {FMIcons.x} Change
          </button>
        </div>
      )}

      <div style={{ display:'flex', gap:14, marginBottom:22 }}>
        {PRED_OPTIONS.map(opt => <PredCard key={opt.id} opt={opt} selected={selected} onSelect={handleSelect} anySelected={anySelected} />)}
      </div>

      <div>
        <div style={{ fontSize:11, color:L.text3, fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Recent predictions</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {RECENT.map((r,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, background:L.card, border:`1px solid ${L.border}`, borderRadius:20, padding:'5px 10px' }}>
              <div style={{ width:18, height:18, borderRadius:'50%', background:L.borderSub, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:L.text3, fontWeight:700 }}>{r.user[0].toUpperCase()}</div>
              <span style={{ fontSize:11, color:L.text2 }}>{r.user}</span>
              <span style={{ fontSize:10, color:PICK_COL[r.pick], fontFamily:"'DM Mono',monospace", fontWeight:700 }}>{PICK_LBL[r.pick]}</span>
              <span style={{ fontSize:9.5, color:L.text3, fontFamily:"'DM Mono',monospace" }}>{r.ago}</span>
            </div>
          ))}
        </div>
      </div>
    </FMPageShell>
  );
}

Object.assign(window, { FMMatchPrediction });
