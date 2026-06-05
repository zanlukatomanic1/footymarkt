// fm-app-light.jsx — Light mode showcase entry

const { useState: useStateApp } = React;

const PAGES = [
  { num:'01', name:'Home Feed',        desc:'Match grid with 3-way sentiment bars and inline prediction' },
  { num:'02', name:'Match Prediction', desc:'Large team hero with three clickable prediction cards' },
  { num:'03', name:'Leaderboard',      desc:'Sortable table · top 3 medals · user row pinned at bottom' },
  { num:'04', name:'Private Leagues',  desc:'League cards, create modal with generated invite code, join flow' },
  { num:'05', name:'League Detail',    desc:'League standings + member list with copyable invite code' },
  { num:'06', name:'Admin Panel',      desc:'Match result management with dropdown and save confirmation' },
];

function Section({ page, children }) {
  const L = window.LM;
  return (
    <div className="sec-wrap">
      <div className="sec-label">
        <span className="sec-num" style={{ color: L.accent }}>{page.num}</span>
        <span className="sec-name">{page.name}</span>
        <span style={{ fontSize:11, color:L.text3sub, fontFamily:"'DM Mono',monospace" }}>{page.desc}</span>
        <div className="sec-line" style={{ background: L.border }}></div>
      </div>
      <div className="mockup" style={{ background: L.bg, border:`1px solid ${L.border}` }}>
        {children}
      </div>
    </div>
  );
}

function LeaguesController() {
  const [view, setView] = useStateApp('list');
  if (view === 'detail') return <FMLeagueDetail onBack={() => setView('list')} />;
  return <FMPrivateLeagues onViewLeague={() => setView('detail')} />;
}

function App() {
  const L = window.LM;
  return (
    <div className="showcase">
      <header className="showcase-hd">
        <h1 style={{ color: L.text }}>
          Footy<em style={{ color: L.accent }}>Markt</em>
          <span style={{ marginLeft:16, fontSize:22, fontWeight:400, color:L.text3, letterSpacing:'-0.5px', fontFamily:"'DM Mono',monospace" }}>Light</span>
        </h1>
        <p style={{ color:L.text3 }}>Design mockups · 6 pages · WC 2026 prediction market · Interactive</p>
      </header>

      <Section page={PAGES[0]}><FMHomeFeed /></Section>
      <Section page={PAGES[1]}><FMMatchPrediction /></Section>
      <Section page={PAGES[2]}><FMLeaderboard /></Section>
      <Section page={PAGES[3]}><LeaguesController /></Section>
      <Section page={PAGES[4]}><FMLeagueDetail onBack={() => {}} /></Section>
      <Section page={PAGES[5]}><FMAdminPage /></Section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
