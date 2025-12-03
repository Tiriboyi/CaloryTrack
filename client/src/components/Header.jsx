import { useCountdown } from '../hooks';
import { formatDate } from '../utils';
import { motion } from 'framer-motion';
import { Flame, Calendar, Clock } from 'lucide-react';

export function Header({ theme, onToggleTheme }) {
  const countdown = useCountdown();
  const today = formatDate(new Date());

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative z-10 mb-12 pt-8 text-center"
    >
      <div className="absolute top-0 left-0 w-full h-full bg-accent-primary/5 blur-[100px] -z-10 pointer-events-none" />

      <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-glass-bg border border-glass-border shadow-2xl backdrop-blur-md">
        <div className="bg-gradient-to-br from-accent-primary to-accent-secondary p-3 rounded-xl mr-4 shadow-lg shadow-accent-primary/20">
          <Flame className="w-8 h-8 text-white" fill="currentColor" />
        </div>
        <div className="text-left">
          <h1 className="text-3xl font-bold tracking-tight text-white leading-none mb-1">
            Calorie<span className="text-gradient">Crusher</span>
          </h1>
          <p className="text-xs text-text-secondary font-medium tracking-wide uppercase">
            Elite Fitness Leaderboard
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-glass-bg border border-glass-border text-text-secondary">
          <Calendar className="w-4 h-4 text-accent-secondary" />
          <span>{today}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-glass-bg border border-glass-border text-text-secondary">
          <Clock className="w-4 h-4 text-accent-primary" />
          <span>Reset in: <span className="font-mono font-bold text-white ml-1">{countdown}</span></span>
        </div>
      </div>
    </motion.header>
  );
}
