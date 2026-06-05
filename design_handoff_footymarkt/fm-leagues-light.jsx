// fm-leagues-light.jsx — Light mode Private Leagues + League Detail

const { useState: useStateLG } = React;

const MY_LEAGUES = [
  { id:1, name:'Office WC 2026',         members:12, myRank:3,  leader:'sarah_fc',    coins:6100 },
  { id:2, name:'Twitter Football Heads', members:48, myRank:11, leader:'xavi_wizard',  coins:2200 },
  { id:3, name:"Uni Mates '26",          members:8,  myRank:1,  leader:'you',          coins:4800 },
];

const LEAGUE_DETAIL = {
  name:'Office WC 2026', inviteCode:'OFC-2026-X7K9', members:12, totalPreds:847,
  leaderboard:[
    { rank:1, username:'sarah_fc',    coins:8400, correct:42, rate:72.4 },
    { rank:2, username:'mike_united', coins:7200, correct:38, rate:69.1 },
    { rank:3, username:'you',         coins:6100, correct:31, rate:65.3, isMe:true },
    { rank:4, username:'dan_rovers',  coins:5600, correct:28, rate:62.2 },
    { rank:5, username:'emma_city',   coins:4900, correct:25, rate:59.5 },
    { rank:6, username:'pete_park',   coins:4200, correct:22, rate:57.9 },
    { rank:7, username:'anna_villa',  coins:3800, correct:19, rate:54.3 },
  ],
  members_list:['sarah_fc','mike_united','you','dan_rovers','emma_city','pete_park','anna_villa','raj_utd','lucy_wolves','tom_saints','chris_boro','nina_lfc'],
};

const RANK_COLOR = { 1:'#B8860A', 2:'#787878', 3:'#966220' };

function CreateLeagueModal({ onClose }) {
  const [name, setName]       = useStateLG('');
  const [created, setCreated] = useStateLG(false);
  const [code, setCode]       = useStateLG('');
  const L = window.LM;

  const handleCreate = () => {
    if (!name.trim()) return;
    const c = 'FM-' + name.slice(0,3).toUpperCase().replace(/[^A-Z]/g,'X') + '-' + Math.random().toString(36).slice(2,6).toUpperCase();
    setCode(c); setCreated(true);
  };

  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(15,22,36,0.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:L.card, border:`1px solid ${L.border}`, borderRadius:16, padding:'28px 28px 24px', width:400, boxShadow:'0 12px 40px rgba(15,22,36,0.16)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:L.text }}>Create a League</div>
            <div style={{ fontSize:11, color:L.text3, marginTop:3, fontFamily:"'DM Mono',monospace" }}>Invite friends with a code</div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:L.text3, cursor:'pointer', display:'flex', padding:4 }}>{FMIcons.x}</button>
        </div>

        {!created ? (
          <>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, color:L.text3, fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.09em', display:'block', marginBottom:7 }}>League name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Office WC 2026"
                style={{ width:'100%', background:L.bg, border:`1px solid ${L.border}`, borderRadius:8, padding:'10px 14px', fontSize:13.5, color:L.text, fontFamily:"'DM Sans',sans-serif", outline:'none' }} />
            </div>
            <button onClick={handleCreate} style={{
              width:'100%', background: name.trim() ? L.accent : L.borderSub,
              color: name.trim() ? '#fff' : L.text3sub, border:'none', borderRadius:8,
              padding:'11px', fontSize:13.5, fontWeight:600, cursor: name.trim() ? 'pointer' : 'default', transition:'all 0.15s',
            }}>Create League</button>
          </>
        ) : (
          <div>
            <div style={{ background:L.accentBg, border:`1px solid ${L.accentBorder}`, borderRadius:10, padding:'16px 18px', marginBottom:16 }}>
              <div style={{ fontSize:11, color:L.accent, fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
                {FMIcons.check} League created!
              </div>
              <div style={{ fontSize:15, fontWeight:600, color:L.text, marginBottom:12 }}>{name}</div>
              <div style={{ fontSize:11, color:L.text3, fontFamily:"'DM Mono',monospace", marginBottom:8 }}>Invite code</div>
              <div style={{ display:'flex', alignItems:'center', gap:10, background:L.bg, border:`1px solid ${L.border}`, borderRadius:8, padding:'10px 14px' }}>
                <code style={{ flex:1, fontFamily:"'DM Mono',monospace", fontSize:16, letterSpacing:'0.08em', color:L.accent, fontWeight:600 }}>{code}</code>
                <button style={{ background:'transparent', border:'none', color:L.text3, cursor:'pointer', display:'flex', gap:4, alignItems:'center', fontSize:11, fontFamily:"'DM Mono',monospace" }}>{FMIcons.copy} Copy</button>
              </div>
            </div>
            <button onClick={onClose} style={{ width:'100%', background:L.bg, color:L.text2, border:`1px solid ${L.border}`, borderRadius:8, padding:'10px', fontSize:13, fontWeight:500, cursor:'pointer' }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

function LeagueCard({ league, onView }) {
  const [hov, setHov] = useStateLG(false);
  const L = window.LM;
  const rc = league.myRank <= 3 ? RANK_COLOR[league.myRank] : L.text3;

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: hov ? '#FAFBFD' : L.card, border:`1px solid ${hov ? '#D4DCE8' : L.border}`,
      borderRadius:12, padding:'20px', cursor:'default',
      transition:'all 0.15s', display:'flex', flexDirection:'column', gap:14,
      boxShadow: hov ? '0 2px 12px rgba(15,22,36,0.08)' : '0 1px 3px rgba(15,22,36,0.04)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:14.5, fontWeight:700, color:L.text, letterSpacing:'-0.2px', marginBottom:4 }}>{league.name}</div>
          <div style={{ fontSize:11, color:L.text3, fontFamily:"'DM Mono',monospace" }}>{league.members} members</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
          <div style={{ fontSize:22, fontWeight:700, color:rc, fontFamily:"'DM Mono',monospace", fontVariantNumeric:'tabular-nums', lineHeight:1 }}>#{league.myRank}</div>
          <div style={{ fontSize:9.5, color:L.text3, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'DM Mono',monospace" }}>your rank</div>
        </div>
      </div>
      <div style={{ height:1, background:L.border }} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:11, color:L.text3 }}>
          Leader: <span style={{ color: league.leader==='you' ? L.accent : L.text2, fontWeight:500 }}>{league.leader}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ color:L.accent, display:'flex', opacity:0.7 }}>{FMIcons.coin}</span>
          <span style={{ fontSize:12, color:L.text2, fontFamily:"'DM Mono',monospace", fontVariantNumeric:'tabular-nums' }}>{league.coins.toLocaleString()}</span>
        </div>
      </div>
      <button onClick={() => onView(league)} style={{
        background:'transparent', border:`1px solid ${hov ? L.border : L.border}`, color: hov ? L.text : L.text3,
        padding:'8px 14px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', width:'100%',
        display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all 0.15s',
      }}>View League {FMIcons.chevron}</button>
    </div>
  );
}

function FMPrivateLeagues({ onViewLeague }) {
  const [showCreate, setShowCreate] = useStateLG(false);
  const [showJoin, setShowJoin]     = useStateLG(false);
  const [joinCode, setJoinCode]     = useStateLG('');
  const L = window.LM;

  return (
    <FMPageShell active="leagues" title="My Leagues" subtitle="3 leagues · 68 total players">
      <div style={{ position:'relative' }}>
        {showCreate && <CreateLeagueModal onClose={() => setShowCreate(false)} />}
        <div style={{ display:'flex', gap:10, marginBottom:24, alignItems:'center' }}>
          <button onClick={() => { setShowCreate(true); setShowJoin(false); }} style={{ display:'flex', alignItems:'center', gap:7, background:L.accent, color:'#fff', border:'none', padding:'9px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
            {FMIcons.plus} Create League
          </button>
          <button onClick={() => setShowJoin(v => !v)} style={{ display:'flex', alignItems:'center', gap:7, background:'transparent', color:L.text2, border:`1px solid ${L.border}`, padding:'9px 16px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' }}>
            Join League
          </button>
          {showJoin && (
            <div style={{ display:'flex', gap:8, alignItems:'center', marginLeft:4 }}>
              <input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Enter invite code…"
                style={{ background:L.card, border:`1px solid ${L.border}`, borderRadius:8, padding:'9px 14px', fontSize:13, color:L.text, fontFamily:"'DM Mono',monospace", outline:'none', width:200 }} />
              <button style={{ background: joinCode.trim() ? L.accent : L.borderSub, color: joinCode.trim() ? '#fff' : L.text3sub, border:'none', padding:'9px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>Join →</button>
            </div>
          )}
        </div>
        <FMDivider label={`My Leagues · ${MY_LEAGUES.length} active`} />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {MY_LEAGUES.map(lg => <LeagueCard key={lg.id} league={lg} onView={onViewLeague} />)}
        </div>
      </div>
    </FMPageShell>
  );
}

function FMLeagueDetail({ onBack }) {
  const [copied, setCopied] = useStateLG(false);
  const L = window.LM;
  const lg = LEAGUE_DETAIL;
  const handleCopy = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <FMPageShell active="leagues" title={lg.name} subtitle={`${lg.members} members · ${lg.totalPreds} predictions`}>
      <div onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:22, cursor:'pointer', width:'fit-content' }}>
        <span style={{ color:L.text3, display:'flex' }}>{FMIcons.back}</span>
        <span style={{ fontSize:12, color:L.text3, fontFamily:"'DM Mono',monospace" }}>My Leagues</span>
      </div>

      <div style={{ background:L.card, border:`1px solid ${L.border}`, borderRadius:14, padding:'22px 24px', marginBottom:22, display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 4px rgba(15,22,36,0.05)' }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:L.text, letterSpacing:'-0.5px', marginBottom:5 }}>{lg.name}</div>
          <div style={{ display:'flex', gap:16 }}>
            <span style={{ fontSize:12, color:L.text3, fontFamily:"'DM Mono',monospace" }}>{lg.members} members</span>
            <span style={{ fontSize:12, color:L.text3, fontFamily:"'DM Mono',monospace" }}>{lg.totalPreds} predictions</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, background:L.bg, border:`1px solid ${L.border}`, borderRadius:10, padding:'10px 16px' }}>
          <div>
            <div style={{ fontSize:9.5, color:L.text3, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:"'DM Mono',monospace", marginBottom:4 }}>Invite code</div>
            <code style={{ fontSize:15, fontFamily:"'DM Mono',monospace", letterSpacing:'0.1em', color:L.accent, fontWeight:600 }}>{lg.inviteCode}</code>
          </div>
          <button onClick={handleCopy} style={{ display:'flex', alignItems:'center', gap:5, background: copied ? L.accentBg : L.card, border:`1px solid ${copied ? L.accentBorder : L.border}`, color: copied ? L.accent : L.text3, padding:'6px 10px', borderRadius:7, fontSize:11, fontFamily:"'DM Mono',monospace", cursor:'pointer', transition:'all 0.15s' }}>
            {copied ? FMIcons.check : FMIcons.copy}{copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16 }}>
        <div style={{ background:L.card, border:`1px solid ${L.border}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(15,22,36,0.05)' }}>
          <div style={{ padding:'14px 20px 12px', borderBottom:`1px solid ${L.border}`, background:L.bg, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:600, color:L.text }}>League Standings</span>
            <span style={{ fontSize:10.5, color:L.text3, fontFamily:"'DM Mono',monospace" }}>WC 2026</span>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${L.borderSub}`, background:L.bg }}>
                {['Rank','Player','Coins','Correct','Rate'].map((h,i) => (
                  <th key={h} style={{ padding:'9px 16px', textAlign: i>1?'right':(i===1?'left':'center'), fontSize:10, color:L.text3, fontFamily:"'DM Mono',monospace", letterSpacing:'0.09em', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lg.leaderboard.map(row => (
                <tr key={row.rank} style={{ borderBottom:`1px solid ${L.borderSub}`, background: row.isMe ? L.accentBg : 'transparent' }}>
                  <td style={{ padding:'10px 16px', textAlign:'center', borderLeft:`2px solid ${row.rank<=3?RANK_COLOR[row.rank]:row.isMe?L.accentBorder:'transparent'}` }}>
                    {row.rank<=3 ? <span style={{ fontSize:14 }}>{'🥇🥈🥉'[row.rank-1]}</span> : <span style={{ fontSize:11, color:L.text3, fontFamily:"'DM Mono',monospace" }}>#{row.rank}</span>}
                  </td>
                  <td style={{ padding:'10px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background: row.isMe ? `linear-gradient(135deg,${L.accentVivid},${L.blue})` : L.borderSub, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color: row.isMe ? '#fff' : L.text3, flexShrink:0 }}>
                        {row.username[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize:12.5, fontWeight: row.isMe?600:400, color: row.isMe?L.accent:row.rank<=3?RANK_COLOR[row.rank]:L.text }}>
                        {row.isMe ? 'you' : row.username}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding:'10px 16px', textAlign:'right', fontSize:12, fontFamily:"'DM Mono',monospace", color:L.text2, fontVariantNumeric:'tabular-nums' }}>{row.coins.toLocaleString()}</td>
                  <td style={{ padding:'10px 16px', textAlign:'right', fontSize:12, fontFamily:"'DM Mono',monospace", color:L.text3, fontVariantNumeric:'tabular-nums' }}>{row.correct}</td>
                  <td style={{ padding:'10px 16px', textAlign:'right', fontSize:12, fontFamily:"'DM Mono',monospace", color: row.rate>=65?L.accent:L.text3, fontVariantNumeric:'tabular-nums' }}>{row.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background:L.card, border:`1px solid ${L.border}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(15,22,36,0.05)' }}>
          <div style={{ padding:'14px 16px 12px', borderBottom:`1px solid ${L.border}`, background:L.bg, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:600, color:L.text }}>Members</span>
            <span style={{ fontSize:10.5, color:L.text3, fontFamily:"'DM Mono',monospace" }}>{lg.members} / 50</span>
          </div>
          <div style={{ padding:'8px 0' }}>
            {lg.members_list.map((m,i) => (
              <div key={m} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 16px', background: m==='you' ? L.accentBg : 'transparent' }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background: m==='you' ? `linear-gradient(135deg,${L.accentVivid},${L.blue})` : L.borderSub, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color: m==='you' ? '#fff' : L.text3, flexShrink:0 }}>
                  {m[0].toUpperCase()}
                </div>
                <span style={{ fontSize:12.5, flex:1, color: m==='you' ? L.accent : L.text2 }}>{m==='you' ? 'you' : m}</span>
                {i<3 && <span style={{ fontSize:12, color:RANK_COLOR[i+1] }}>#{i+1}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </FMPageShell>
  );
}

Object.assign(window, { FMPrivateLeagues, FMLeagueDetail });
