import { useCountdown } from '../hooks';
import { formatDate } from '../utils';

export function Header({ theme, onToggleTheme }) {
  const countdown = useCountdown();
  const today = formatDate(new Date());

  return (
    <header>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="theme-toggle" onClick={onToggleTheme}>
          <span>{theme === 'dark' ? '🌗' : '🌓'}</span>
        </button>
      </div>
      <h1>💪 Calorie Crusher</h1>
      <p className="subtitle">Friendly competition only—no shaming, just sweating (or napping)!</p>
      <p className="header-info">📅 {today}</p>
      <p className="countdown-text">
        ⏰ Time to Midnight: <span style={{ fontWeight: 'bold' }}>{countdown}</span>
      </p>
      <p className="reset-info">Resets every Monday at 00:00</p>
    </header>
  );
}
