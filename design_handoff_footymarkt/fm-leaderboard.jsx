// fm-leaderboard.jsx — Leaderboard page

const { useState: useStateLB } = React;

const LB_DATA = [
  { rank:1,  username:'xavi_wizard',       coins:48250, correct:142, total:183, rate:77.6 },
  { rank:2,  username:'ballond_or99',       coins:41800, correct:134, total:178, rate:75.3 },
  { rank:3,  username:'pressing_machine',   coins:37600, correct:128, total:171, rate:74.9 },
  { rank:4,  username:'tiki_prophet',       coins:33200, correct:115, total:162, rate:71.0 },
  { rank:5,  username:'counterpress_fc',    coins:29700, correct:108, total:158, rate:68.4 },
  { rank:6,  username:'gegenpresser',       coins:26400, correct:99,  total:153, rate:64.7 },
  { rank:7,  username:'false_nine_fc',      coins:23100, correct:92,  total:147, rate:62.6 },
  { rank:8,  username:'sweeper_stopper',    coins:19800, correct:85,  total:142, rate:59.9 },
  { rank:9,  username:'raumdeuter_x',       coins:17200, correct:79,  total:138, rate:57.2 },
  { rank:10, username:'libero_dreams',      coins:15600, correct:73,  total:134, rate:54.5 },
];
const ME = { rank:47, username:'you', coins:2450, correct:31, total:58, rate:53.4, isMe:true };

const MEDAL = { 1:'🥇', 2:'🥈', 3:'🥉' };
const MEDAL_COLOR = { 1:'#FFD700', 2:'#a8a8a8', 3:'#cd8a3a' };
const MEDAL_BG    = { 1:'rgba(255,215,0,0.05)', 2:'rgba(168,168,168,0.04)', 3:'rgba(205,130,58,0.05)' };
const MEDAL_BORDER= { 1:'rgba(255,215,0,0.14)', 2:'rgba(168,168,168,0.12)', 3:'rgba(205,130,58,0.13)' };

function LBRow({ row, cols }) {
  const mc = MEDAL_COLOR[row.rank];
  const isTop3 = row.rank <= 3;
  return (
    <tr style={{
      background: row.isMe ? 'rgba(0,255,135,0.04)' : isTop3 ? MEDAL_BG[row.rank] : 'transparent',
      borderBottom: '1px solid #181818',
      transition: 'background 0.1s',
    }}>
      {/* Rank */}
      <td style={{ padding: '12px 16px 12px 20px', width: 60 }}>
        {isTop3 ? (
          <span style={{ fontSize: 17 }}>{MEDAL[row.rank]}</span>
        ) : (
          <span style={{ fontSize: 12, color: row.isMe ? '#00ff87' : '#3a3a3a', fontFamily: "'DM Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>
            #{row.rank}
          </span>
        )}
      </td>
      {/* User */}
      <td style={{ padding: '12px 16px', borderLeft: isTop3 ? `2px solid ${mc}` : row.isMe ? '2px solid rgba(0,255,135,0.5)' : '2px solid transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: row.isMe ? 'linear-gradient(135deg,#00ff87,#4d7cff)' : isTop3 ? `linear-gradient(135deg,${mc}60,${mc}20)` : '#1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: row.isMe ? '#0a0a0a' : isTop3 ? mc : '#3a3a3a',
            flexShrink: 0,
          }}>
            {row.username[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: row.isMe ? 600 : 500, color: row.isMe ? '#00ff87' : isTop3 ? mc : '#ccc' }}>
              {row.isMe ? 'you (me)' : row.username}
            </div>
            {row.isMe && <div style={{ fontSize: 9.5, color: '#2e2e2e', fontFamily: "'DM Mono',monospace", marginTop: 1 }}>your position</div>}
          </div>
        </div>
      </td>
      {/* Coins */}
      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
          <span style={{ color: '#00ff87', display: 'flex', opacity: 0.7 }}>{FMIcons.coin}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: isTop3 ? mc : row.isMe ? '#00ff87' : '#ccc', fontFamily: "'DM Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>
            {row.coins.toLocaleString()}
          </span>
        </div>
      </td>
      {/* Correct */}
      <td style={{ padding: '12px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: 12.5, color: '#888', fontFamily: "'DM Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>
          {row.correct}<span style={{ color: '#333' }}>/{row.total}</span>
        </span>
      </td>
      {/* Rate */}
      <td style={{ padding: '12px 20px 12px 0', textAlign: 'right' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
          <span style={{
            fontSize: 12.5, fontWeight: 600, fontFamily: "'DM Mono',monospace", fontVariantNumeric: 'tabular-nums',
            color: row.rate >= 70 ? '#00ff87' : row.rate >= 60 ? '#a8d8a8' : '#888',
          }}>
            {row.rate}%
          </span>
          {row.rate >= 70 && <span style={{ color: '#00ff87', display: 'flex', opacity: 0.7 }}>{FMIcons.up}</span>}
        </div>
      </td>
    </tr>
  );
}

function FMLeaderboard() {
  const [period, setPeriod] = useStateLB('wc2026');
  const [sortCol, setSortCol] = useStateLB('coins');
  const [sortAsc, setSortAsc] = useStateLB(false);

  const sorted = [...LB_DATA].sort((a, b) => {
    const diff = a[sortCol] - b[sortCol];
    return sortAsc ? diff : -diff;
  });

  const toggleSort = (col) => {
    if (sortCol === col) setSortAsc(v => !v);
    else { setSortCol(col); setSortAsc(false); }
  };

  const TH = ({ col, children, align = 'right' }) => (
    <th onClick={() => toggleSort(col)} style={{
      padding: '0 20px 0 0', textAlign: align,
      fontSize: 10.5, color: sortCol === col ? '#00ff87' : '#333',
      fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em',
      textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        {sortCol === col && <span style={{ display: 'flex', color: '#00ff87' }}>{sortAsc ? FMIcons.up : FMIcons.down}</span>}
      </span>
    </th>
  );

  return (
    <FMPageShell active="leaderboard" title="Leaderboard" subtitle="WC 2026 · Updated in real-time">
      {/* Period tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {[['wc2026','WC 2026'],['alltime','All Time'],['week','This Week']].map(([k,l]) => (
          <button key={k} onClick={() => setPeriod(k)} style={{
            background: period===k ? '#00ff87' : 'transparent',
            color: period===k ? '#080808' : '#4a4a4a',
            border: `1px solid ${period===k ? '#00ff87' : '#222'}`,
            padding: '5px 13px', borderRadius: 6, fontSize: 12,
            fontWeight: period===k ? 600 : 400, cursor: 'pointer',
          }}>{l}</button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#141414', border: '1px solid #1e1e1e', borderRadius: 8, padding: '5px 12px' }}>
          <span style={{ fontSize: 11, color: '#3a3a3a', fontFamily: "'DM Mono',monospace" }}>1,284 players · WC 2026</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
              <th style={{ padding: '12px 16px 12px 20px', textAlign: 'left', fontSize: 10.5, color: '#333', fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase', width: 60 }}>Rank</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10.5, color: '#333', fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Player</th>
              <TH col="coins">Coins</TH>
              <TH col="correct" align="center">Correct</TH>
              <TH col="rate">Win Rate</TH>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => <LBRow key={row.rank} row={row} />)}
          </tbody>
        </table>

        {/* Gap / ellipsis */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #181818', borderBottom: '1px solid #181818', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
          <span style={{ fontSize: 10.5, color: '#2a2a2a', fontFamily: "'DM Mono',monospace" }}>· · · ranks 11–46 · · ·</span>
          <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
        </div>

        {/* Pinned user row */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <LBRow row={ME} />
          </tbody>
        </table>
      </div>
    </FMPageShell>
  );
}

Object.assign(window, { FMLeaderboard });
