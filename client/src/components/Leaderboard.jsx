import { LeaderboardItem } from './LeaderboardItem';
import { motion, AnimatePresence } from 'framer-motion';

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
      <motion.ul
        layout
        className="list-none space-y-3"
      >
        <AnimatePresence mode='popLayout'>
          {sortedUsers.length === 0 ? (
            <motion.li
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-text-tertiary p-12 bg-bg-tertiary/10 rounded-xl border border-dashed border-white/10"
            >
              {emptyMessage}
            </motion.li>
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
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
