// fm-app.jsx — Showcase: all 6 pages stacked with labels

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
  return (
    <div className="sec-wrap">
      <div className="sec-label">
        <span className="sec-num">{page.num}</span>
        <span className="sec-name">— {page.name}</span>
        <span style={{ fontSize: 11, color: '#2a2a2a', fontFamily: "'DM Mono',monospace" }}>{page.desc}</span>
        <div className="sec-line"></div>
      </div>
      <div className="mockup">
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
  return (
    <div className="showcase">
      <header className="showcase-hd">
        <h1>Footy<em>Markt</em></h1>
        <p>Design mockups · 6 pages · WC 2026 prediction market · Interactive</p>
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
