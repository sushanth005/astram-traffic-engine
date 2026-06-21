export default function Topbar({ statusText, statusOk, onRecheck, currentTime, theme, onToggleTheme }) {
  return (
    <header className="topbar">
      <div className="brand">
        <img src="/logo.jpeg" alt="ASTRAM Logo" className="brand-logo" />
        <div className="brand-text">
          <div className="name">ASTRAM</div>
          <div className="sub">Instant Traffic Solution for Bengaluru</div>
        </div>
      </div>
      <div className="conn">
        <div className="conn-field">
          <span className={`status-dot ${statusOk ? 'ok' : 'bad'}`} />
          <span className="status-text">{statusText}</span>
        </div>
        <div className="conn-field">
          <label>Local time</label>
          <span className="time-text">{currentTime}</span>
        </div>
        <button className="btn-mini" type="button" onClick={onRecheck}>Recheck</button>
        <button
          className="btn-mini theme-toggle"
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
