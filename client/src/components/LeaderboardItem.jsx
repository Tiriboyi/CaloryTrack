import { useState } from 'react';
import { getBadges } from '../utils';

export function LeaderboardItem({ user, rank, totalUsers, onShowImage, onDoubleClick, showHistory = true }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const badge = getBadges(rank, totalUsers);
  const badgeEmoji = badge ? badge.split(' ')[0] : '';
  const badgeText = badge ? badge.substring(2) : '';

  return (
    <li
      className={`leaderboard-item rank-${rank + 1}`}
      onDoubleClick={() => onDoubleClick?.(user.name, user.totalCalories)}
    >
      <div className="rank">#{rank + 1}</div>
      <div className="user-info">
        <div className="user-name">
          {user.name}
          {badge && <span className="badge-icon" title={badge}>{badgeEmoji}</span>}
        </div>
        {badge && <div className="badge-text">{badgeText}</div>}
        
        {showHistory && user.logs && (
          <>
            <button
              className="history-toggle"
              onClick={() => setHistoryOpen(!historyOpen)}
            >
              View History ({user.logs.length})
            </button>
            <div className={`history-panel ${historyOpen ? 'show' : ''}`}>
              {user.logs.map((log, idx) => (
                <div key={idx} className="history-entry">
                  <span>{log.date.split(',')[0]} - {log.calories} cal</span>
                  {log.proof && (
                    <img
                      src={log.proof}
                      className="thumbnail"
                      onClick={() => onShowImage(log.proof)}
                      title="View Proof"
                      alt="Proof"
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        
        {!showHistory && user.entries !== undefined && (
          <div className="entries-text">{user.entries} entries</div>
        )}
      </div>
      <div className="calories">
        {user.totalCalories}
        <span> kcal</span>
      </div>
    </li>
  );
}
