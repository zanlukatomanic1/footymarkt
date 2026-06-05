// fm-shared-light.jsx — Light mode shared components

const { useState, useEffect, useRef } = React;

const FMIcons = {
  home:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 2l9 7.5V21a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  trophy:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M6 3h12v7a6 6 0 0 1-12 0V3z"/><path d="M6 5H3a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3"/><path d="M18 5h3a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3"/></svg>,
  shield:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  user:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  admin:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  settings:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  coin:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2-1 2-2.5 2.5-2.5 1-2.5 2.5 1.1 2 2.5 2 2.5-.9 2.5-2"/><path d="M12 7v1M12 16v1"/></svg>,
  copy:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  check:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  plus:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  x:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chevron: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  bell:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  back:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  lock:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  up:      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  down:    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
};

// Light mode palette
const LM = {
  bg:            '#F2F5FA',
  card:          '#FFFFFF',
  sidebar:       '#161616',
  sidebarBorder: '#252525',
  border:        '#E3E8F0',
  borderSub:     '#EDF0F6',
  topbar:        '#FFFFFF',
  accent:        '#5A9600',       // green text on light bg
  accentVivid:   '#74C200',       // decorative / icons
  accentBg:      'rgba(90,150,0,0.08)',
  accentBorder:  'rgba(90,150,0,0.22)',
  blue:          '#3560D8',
  text:          '#0F1624',
  text2:         '#5A6478',
  text3:         '#96A0B0',
  text3sub:      '#C8D0DC',
  gold:          '#B8860A',
  silver:        '#787878',
  bronze:        '#966220',
};

function FMLogo() {
  return (
    <img src="uploads/logo.png" alt="FootyMarkt"
      style={{ width: 128, height: 'auto', display: 'block' }} />
  );
}

const NAV = [
  { id:'home',        label:'Home',        icon:'home' },
  { id:'leaderboard', label:'Leaderboard', icon:'trophy' },
  { id:'leagues',     label:'My Leagues',  icon:'shield' },
  { id:'profile',     label:'Profile',     icon:'user' },
  { id:'admin',       label:'Admin',       icon:'admin' },
];

function FMSidebar({ active }) {
  return (
    <aside style={{
      width: 220, minWidth: 220, height: '100%', flexShrink: 0,
      background: LM.sidebar, borderRight: `1px solid ${LM.sidebarBorder}`,
      display: 'flex', flexDirection: 'column', padding: '20px 0 14px',
    }}>
      <div style={{ padding: '0 18px 20px' }}><FMLogo /></div>

      <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV.map(item => {
          const on = active === item.id;
          return (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px',
              borderRadius: 8, cursor: 'pointer',
              background: on ? 'rgba(116,194,0,0.12)' : 'transparent',
              color: on ? LM.accentVivid : '#4a4a4a',
              fontSize: 13.5, fontWeight: on ? 600 : 400,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, opacity: on ? 1 : 0.6 }}>
                {FMIcons[item.icon]}
              </span>
              {item.label}
              {on && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: LM.accentVivid, flexShrink: 0 }} />}
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '10px 10px 0', borderTop: `1px solid ${LM.sidebarBorder}`, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 11px', borderRadius: 8, cursor: 'pointer', color: '#383838', fontSize: 13 }}>
          {FMIcons.settings}<span>Settings</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 11px', marginTop: 2, borderRadius: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${LM.accentVivid}, #4d7cff)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10.5, fontWeight: 700, color: '#fff',
          }}>Y</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#aaa' }}>you</div>
            <div style={{ fontSize: 10.5, color: '#3a3a3a', fontFamily: "'DM Mono',monospace" }}>2,450 coins</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function FMTopBar({ title, subtitle, coins = 2450 }) {
  return (
    <div style={{
      height: 56, flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px',
      borderBottom: `1px solid ${LM.border}`, background: LM.topbar,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontSize: 14, fontWeight: 600, color: LM.text, letterSpacing: '-0.2px' }}>{title}</div>}
        {subtitle && <div style={{ fontSize: 10.5, color: LM.text3, marginTop: 1, fontFamily: "'DM Mono',monospace" }}>{subtitle}</div>}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: LM.bg, border: `1px solid ${LM.border}`, borderRadius: 8, padding: '5px 12px',
      }}>
        <span style={{ color: LM.accent, display: 'flex' }}>{FMIcons.coin}</span>
        <span style={{ color: LM.accent, fontSize: 12.5, fontFamily: "'DM Mono',monospace", fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {coins.toLocaleString()}
        </span>
        <span style={{ color: LM.text3sub, fontSize: 12 }}>·</span>
        <span style={{ color: LM.text3, fontSize: 11.5 }}>@you</span>
      </div>
      <div style={{ position: 'relative', width: 32, height: 32, background: LM.bg, border: `1px solid ${LM.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <span style={{ color: LM.text3, display: 'flex' }}>{FMIcons.bell}</span>
        <div style={{ position: 'absolute', top: 5, right: 6, width: 6, height: 6, borderRadius: '50%', background: LM.accentVivid, border: `1.5px solid ${LM.topbar}` }} />
      </div>
    </div>
  );
}

function FMPageShell({ active, title, subtitle, coins, children }) {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <FMSidebar active={active} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: LM.bg, minWidth: 0 }}>
        <FMTopBar title={title} subtitle={subtitle} coins={coins} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function FMSentimentBar({ home, draw, away, height = 5, labels = true }) {
  return (
    <div>
      <div style={{ display: 'flex', height, borderRadius: 999, overflow: 'hidden', background: LM.borderSub, gap: '1px' }}>
        <div style={{ flex: home, background: 'rgba(90,150,0,0.7)', borderRadius: '999px 0 0 999px', transition: 'flex .7s ease' }} />
        <div style={{ flex: draw, background: '#C8D0DC', transition: 'flex .7s ease' }} />
        <div style={{ flex: away, background: 'rgba(53,96,216,0.65)', borderRadius: '0 999px 999px 0', transition: 'flex .7s ease' }} />
      </div>
      {labels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: LM.accent, fontFamily: "'DM Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{home}%</div>
            <div style={{ fontSize: 9, color: LM.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Home</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: LM.text3, fontFamily: "'DM Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{draw}%</div>
            <div style={{ fontSize: 9, color: LM.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Draw</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: LM.blue, fontFamily: "'DM Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{away}%</div>
            <div style={{ fontSize: 9, color: LM.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Away</div>
          </div>
        </div>
      )}
    </div>
  );
}

function FMTag({ children, color = '#3A7200', bg = 'rgba(90,150,0,0.10)' }) {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 4, color, background: bg, fontFamily: "'DM Mono',monospace", whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

function FMDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 14px' }}>
      <span style={{ fontSize: 10.5, color: LM.text3, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: LM.border }} />
    </div>
  );
}

Object.assign(window, {
  FMIcons, FMLogo, FMSidebar, FMTopBar, FMPageShell, FMSentimentBar, FMTag, FMDivider, LM,
});
