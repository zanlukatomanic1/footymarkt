// fm-admin-light.jsx — Light mode Admin Panel

const { useState: useStateAdmin } = React;

const ADMIN_MATCHES = [
  { id:1, home:'Qatar',    away:'Ecuador',    competition:'WC 2026 · Group H', kickoff:'Jun 14 · 18:00', result:null },
  { id:2, home:'England',  away:'France',     competition:'WC 2026 · Group D', kickoff:'Jun 20 · 21:00', result:null },
  { id:3, home:'Brazil',   away:'Argentina',  competition:'WC 2026 · Group A', kickoff:'Jun 21 · 18:00', result:null },
  { id:4, home:'Germany',  away:'Spain',      competition:'WC 2026 · Group C', kickoff:'Jun 22 · 15:00', result:null },
  { id:5, home:'USA',      away:'Mexico',     competition:'WC 2026 · Group E', kickoff:'Jun 22 · 21:00', result:'home' },
  { id:6, home:'Portugal', away:'Netherlands',competition:'WC 2026 · Group B', kickoff:'Jun 22 · 21:00', result:'away' },
  { id:7, home:'Morocco',  away:'Canada',     competition:'WC 2026 · Group F', kickoff:'Jun 23 · 15:00', result:null },
  { id:8, home:'Japan',    away:'Uruguay',    competition:'WC 2026 · Group G', kickoff:'Jun 23 · 21:00', result:'draw' },
];

const RESULT_OPTS  = [{ value:'', label:'— Pending —' },{ value:'home', label:'Home Win' },{ value:'draw', label:'Draw' },{ value:'away', label:'Away Win' }];
const RESULT_COLOR = { home:'#5A9600', draw:'#7A8898', away:'#3560D8' };
const RESULT_LABEL = { home:'Home Win', draw:'Draw', away:'Away Win' };
const RESULT_BG    = { home:'rgba(90,150,0,0.09)', draw:'rgba(122,136,152,0.09)', away:'rgba(53,96,216,0.09)' };
const RESULT_BORD  = { home:'rgba(90,150,0,0.22)', draw:'rgba(122,136,152,0.22)', away:'rgba(53,96,216,0.22)' };

function AdminRow({ match:initMatch }) {
  const [match, setMatch]   = useStateAdmin(initMatch);
  const [draft, setDraft]   = useStateAdmin(initMatch.result || '');
  const [saved, setSaved]   = useStateAdmin(!!initMatch.result);
  const [saving, setSaving] = useStateAdmin(false);
  const [hov, setHov]       = useStateAdmin(false);
  const L = window.LM;

  const isDirty  = draft !== (match.result || '');
  const hasSaved = saved && match.result;
  const rc = RESULT_COLOR[match.result] || L.text3;

  const handleSave = () => {
    if (!draft) return;
    setSaving(true);
    setTimeout(() => { setMatch(m => ({ ...m, result:draft })); setSaved(true); setSaving(false); }, 600);
  };

  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: hasSaved ? L.accentBg : hov ? L.bg : 'transparent',
      borderBottom: `1px solid ${L.borderSub}`, transition:'background 0.1s',
    }}>
      <td style={{ padding:'13px 16px 13px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13.5, fontWeight:600, color:L.text }}>{match.home}</span>
          <span style={{ fontSize:10, color:L.text3, fontFamily:"'DM Mono',monospace", letterSpacing:'0.1em', padding:'1px 6px', background:L.bg, border:`1px solid ${L.border}`, borderRadius:4 }}>vs</span>
          <span style={{ fontSize:13.5, fontWeight:600, color:L.text }}>{match.away}</span>
        </div>
      </td>
      <td style={{ padding:'13px 16px' }}>
        <span style={{ fontSize:11, color:L.text3, fontFamily:"'DM Mono',monospace" }}>{match.competition}</span>
      </td>
      <td style={{ padding:'13px 16px' }}>
        <span style={{ fontSize:11.5, color:L.text2, fontFamily:"'DM Mono',monospace", fontVariantNumeric:'tabular-nums' }}>{match.kickoff}</span>
      </td>
      <td style={{ padding:'13px 16px', textAlign:'center' }}>
        {match.result ? (
          <span style={{ fontSize:11, fontWeight:700, fontFamily:"'DM Mono',monospace", color:rc, background:RESULT_BG[match.result], border:`1px solid ${RESULT_BORD[match.result]}`, padding:'3px 9px', borderRadius:5, letterSpacing:'0.05em' }}>
            {RESULT_LABEL[match.result]}
          </span>
        ) : (
          <span style={{ fontSize:11, color:L.text3sub, fontFamily:"'DM Mono',monospace" }}>—</span>
        )}
      </td>
      <td style={{ padding:'13px 14px' }}>
        <select value={draft} onChange={e => { setDraft(e.target.value); setSaved(false); }} style={{
          background:L.card, border:`1px solid ${isDirty ? L.border : L.border}`,
          color: draft ? (RESULT_COLOR[draft] || L.text2) : L.text3,
          borderRadius:7, padding:'7px 10px', fontSize:12,
          fontFamily:"'DM Mono',monospace", cursor:'pointer', outline:'none',
          minWidth:130, appearance:'none', WebkitAppearance:'none',
        }}>
          {RESULT_OPTS.map(o => (
            <option key={o.value} value={o.value} style={{ background:'#fff', color: o.value ? RESULT_COLOR[o.value] : '#888' }}>{o.label}</option>
          ))}
        </select>
      </td>
      <td style={{ padding:'13px 20px 13px 10px' }}>
        {hasSaved && !isDirty ? (
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:L.accentBg, border:`1px solid ${L.accentBorder}`, borderRadius:7 }}>
            <span style={{ color:L.accent, display:'flex' }}>{FMIcons.check}</span>
            <span style={{ fontSize:11.5, color:L.accent, fontFamily:"'DM Mono',monospace", fontWeight:600 }}>Saved</span>
          </div>
        ) : (
          <button onClick={handleSave} disabled={!draft || saving} style={{
            background: draft && !saving ? L.accent : L.borderSub,
            color: draft && !saving ? '#fff' : L.text3sub,
            border:'none', borderRadius:7, padding:'6px 16px', fontSize:12.5,
            fontWeight:600, cursor: draft && !saving ? 'pointer' : 'default',
            transition:'all 0.15s', whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif",
          }}>
            {saving ? 'Saving…' : 'Save Result'}
          </button>
        )}
      </td>
    </tr>
  );
}

function FMAdminPage() {
  const L = window.LM;
  const pending = ADMIN_MATCHES.filter(m => !m.result).length;
  const settled = ADMIN_MATCHES.filter(m => m.result).length;

  return (
    <FMPageShell active="admin" title="Match Results" subtitle="Admin · WC 2026">
      <div style={{ display:'flex', gap:12, marginBottom:24 }}>
        {[
          { label:'Total Matches',        val: ADMIN_MATCHES.length,  color:L.text },
          { label:'Settled',              val: settled,               color:L.accent },
          { label:'Pending',              val: pending,               color:L.text2 },
          { label:'Predictions Affected', val:'14,582',               color:L.blue },
        ].map(s => (
          <div key={s.label} style={{ flex:1, background:L.card, border:`1px solid ${L.border}`, borderRadius:10, padding:'14px 16px', boxShadow:'0 1px 3px rgba(15,22,36,0.04)' }}>
            <div style={{ fontSize:10, color:L.text3, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:"'DM Mono',monospace", marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:700, color:s.color, fontFamily:"'DM Mono',monospace", fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ background:L.card, border:`1px solid ${L.border}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(15,22,36,0.05)' }}>
        <div style={{ padding:'14px 20px', borderBottom:`1px solid ${L.border}`, background:L.bg, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, fontWeight:600, color:L.text }}>Matches</span>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:L.accentVivid }} />
            <span style={{ fontSize:10.5, color:L.text3, fontFamily:"'DM Mono',monospace" }}>{settled} settled · {pending} pending</span>
          </div>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${L.border}`, background:L.bg }}>
              {['Match','Competition','Kickoff','Current Result','Set Result','Action'].map((h,i) => (
                <th key={h} style={{
                  padding:`11px ${i===5?'20px':'16px'} 11px ${i===0?'20px':'16px'}`,
                  textAlign: i>=3 ? 'center' : 'left',
                  fontSize:10, color:L.text3, fontFamily:"'DM Mono',monospace",
                  letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ADMIN_MATCHES.map(m => <AdminRow key={m.id} match={m} />)}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:L.border }} />
        <span style={{ fontSize:11, color:L.text3, fontFamily:"'DM Mono',monospace" }}>Settling a result triggers coin payouts for all correct predictions in that match.</span>
      </div>
    </FMPageShell>
  );
}

Object.assign(window, { FMAdminPage });
