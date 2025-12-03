import { LeaderboardItem } from './LeaderboardItem';

export function Leaderboard({ 
  users, 
  emptyMessage, 
  onShowImage, 
  onItemDoubleClick, 
  showHistory = true,
  headerContent 
}) {
  const sortedUsers = [...users].sort((a, b) => b.totalCalories - a.totalCalories);

  return (
    <div>
      {headerContent}
      <ul className="leaderboard-list">
        {sortedUsers.length === 0 ? (
          <li className="empty-message">{emptyMessage}</li>
        ) : (
          sortedUsers.map((user, index) => (
            <LeaderboardItem
              key={user.name}
              user={user}
              rank={index}
              totalUsers={sortedUsers.length}
              onShowImage={onShowImage}
              onDoubleClick={onItemDoubleClick}
              showHistory={showHistory}
            />
          ))
        )}
      </ul>
    </div>
  );
}
