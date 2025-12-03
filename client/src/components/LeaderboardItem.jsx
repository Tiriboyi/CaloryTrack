import { useState } from 'react';
import { getBadges } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, History, Trophy, Medal } from 'lucide-react';

export function LeaderboardItem({ user, rank, totalUsers, onShowImage, onDoubleClick, showHistory = true }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const badge = getBadges(rank, totalUsers);

  // Custom Rank Icons
  const getRankIcon = (r) => {
    if (r === 0) return <Trophy className="w-6 h-6 text-yellow-400" fill="currentColor" />;
    if (r === 1) return <Medal className="w-6 h-6 text-gray-300" fill="currentColor" />;
    if (r === 2) return <Medal className="w-6 h-6 text-amber-600" fill="currentColor" />;
    return <span className="text-lg font-bold text-text-tertiary">#{r + 1}</span>;
  };

  const getRankStyles = (r) => {
    if (r === 0) return "bg-gradient-to-r from-yellow-500/10 to-transparent border-l-4 border-yellow-500";
    if (r === 1) return "bg-gradient-to-r from-gray-400/10 to-transparent border-l-4 border-gray-400";
    if (r === 2) return "bg-gradient-to-r from-amber-600/10 to-transparent border-l-4 border-amber-600";
    return "border-l-4 border-transparent hover:bg-white/5";
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`mb-3 rounded-xl overflow-hidden transition-all ${getRankStyles(rank)} bg-bg-tertiary/30 backdrop-blur-sm border border-white/5`}
      onDoubleClick={() => onDoubleClick?.(user.name, user.totalCalories)}
    >
      <div className="p-4 flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-bg-tertiary border border-white/5 shadow-inner">
          {getRankIcon(rank)}
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white truncate">{user.name}</h3>
            {badge && <span className="text-xs px-2 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary border border-accent-primary/20">{badge}</span>}
          </div>

          {!showHistory && user.entries !== undefined && (
            <div className="text-xs text-text-tertiary">{user.entries} entries</div>
          )}

          {showHistory && user.logs && (
            <button
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent-primary transition-colors"
              onClick={() => setHistoryOpen(!historyOpen)}
            >
              <History className="w-3 h-3" />
              {historyOpen ? 'Hide History' : `View History (${user.logs.length})`}
              {historyOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        <div className="text-right">
          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
            {user.totalCalories.toLocaleString()}
          </div>
          <div className="text-xs text-text-tertiary font-medium uppercase tracking-wider">kcal</div>
        </div>
      </div>

      <AnimatePresence>
        {showHistory && historyOpen && user.logs && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black/20 border-t border-white/5"
          >
            <div className="p-4 space-y-3">
              {user.logs.map((log, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full bg-accent-secondary/50"></div>
                    <div>
                      <div className="text-white font-medium">{log.calories} kcal</div>
                      <div className="text-xs text-text-tertiary">{log.date.split(',')[0]}</div>
                    </div>
                  </div>

                  {log.proof && (
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      src={log.proof}
                      className="w-12 h-12 object-cover rounded-lg cursor-pointer border border-white/10 shadow-sm"
                      onClick={() => onShowImage(log.proof)}
                      title="View Proof"
                      alt="Proof"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
