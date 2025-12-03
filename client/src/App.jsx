import { useState, useEffect, useRef, useCallback } from 'react';
import { Header, EntryForm, Leaderboard, Tabs, ImageModal, CalorieChecker, StatsDashboard } from './components';
import { useLeaderDuration } from './hooks';
import { fetchWeeklyData, fetchMonthlyData, fetchLifetimeData, resetData } from './api';
import { motion } from 'framer-motion';
import { Crown, RotateCcw, Utensils, Activity } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('weekly');
  const [weeklyData, setWeeklyData] = useState({ users: [], lastReset: Date.now() });
  const [monthlyData, setMonthlyData] = useState({ users: [], month: '' });
  const [lifetimeData, setLifetimeData] = useState({ users: [] });
  const [modalImage, setModalImage] = useState(null);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const entryFormRef = useRef(null);

  const leaderInfo = useLeaderDuration(weeklyData.users);

  const loadAllData = useCallback(async () => {
    try {
      const [weekly, monthly, lifetime] = await Promise.all([
        fetchWeeklyData(),
        fetchMonthlyData(),
        fetchLifetimeData()
      ]);
      setWeeklyData(weekly);
      setMonthlyData(monthly);
      setLifetimeData(lifetime);

      // Check for weekly reset
      checkWeeklyReset(weekly.lastReset);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }, []);

  const checkWeeklyReset = async (lastReset) => {
    const now = new Date();
    const lastResetDate = new Date(lastReset);

    // Get current Monday 00:00
    const currentMonday = new Date(now);
    const day = currentMonday.getDay();
    const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1);
    currentMonday.setDate(diff);
    currentMonday.setHours(0, 0, 0, 0);

    // If last reset was before this week's Monday, reset
    if (lastResetDate < currentMonday) {
      console.log("Weekly Reset Triggered!");
      try {
        const result = await resetData();
        setWeeklyData({ users: [], lastReset: result.lastReset });
        alert("It's a new week! Leaderboard has been reset. Good luck! 🚀");
      } catch (err) {
        console.error('Error resetting:', err);
      }
    }
  };

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleReset = async () => {
    if (confirm('Clear all data? This cannot be undone.')) {
      try {
        await resetData();
        loadAllData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleItemDoubleClick = (name, calories) => {
    entryFormRef.current?.setFormValues(name, calories);
    entryFormRef.current?.scrollIntoView();
  };

  const handleApplyCalculatorTotal = (totalCalories) => {
    entryFormRef.current?.setFormValues('', totalCalories);
    entryFormRef.current?.scrollIntoView();
    setIsFoodModalOpen(false);
  };

  const renderLeaderStatus = () => {
    if (!leaderInfo.name) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2 text-sm mb-6 p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 text-yellow-200"
      >
        <Crown className="w-4 h-4 text-yellow-400" fill="currentColor" />
        <span>
          <strong className="text-white">{leaderInfo.name}</strong> has been leading for{' '}
          <strong className="text-yellow-400">{leaderInfo.duration}</strong>
        </span>
      </motion.div>
    );
  };

  return (
    <>
      <Header />

      <main className="max-w-3xl mx-auto px-5 pb-20">
        <div className="flex justify-end mb-4">
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setIsFoodModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20 hover:bg-accent-secondary/20 transition-all text-sm font-medium"
          >
            <Utensils className="w-4 h-4" />
            Check Food Calories
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setIsStatsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 hover:bg-accent-primary/20 transition-all text-sm font-medium ml-3"
          >
            <Activity className="w-4 h-4" />
            Insights
          </motion.button>
        </div>

        <EntryForm ref={entryFormRef} onSubmitSuccess={loadAllData} />

        <section className="relative">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-white">Leaderboards</h2>
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-tertiary hover:text-danger transition-colors bg-white/5 hover:bg-danger/10 rounded-lg border border-white/5 hover:border-danger/20"
              onClick={handleReset}
            >
              <RotateCcw className="w-3 h-3" />
              Reset Demo
            </button>
          </div>

          <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="glass-panel rounded-3xl p-6 min-h-[400px]">
            {activeTab === 'weekly' && (
              <Leaderboard
                users={weeklyData.users}
                emptyMessage="No entries yet. Be the first! 🏋️"
                onShowImage={setModalImage}
                onItemDoubleClick={handleItemDoubleClick}
                showHistory={true}
                headerContent={renderLeaderStatus()}
              />
            )}

            {activeTab === 'monthly' && (
              <Leaderboard
                users={monthlyData.users}
                emptyMessage="No entries this month yet. 📅"
                onShowImage={setModalImage}
                showHistory={false}
                headerContent={
                  <p className="text-center text-text-secondary text-sm mb-6 italic">{monthlyData.month}</p>
                }
              />
            )}

            {activeTab === 'lifetime' && (
              <Leaderboard
                users={lifetimeData.users}
                emptyMessage="No lifetime data yet. 🏆"
                onShowImage={setModalImage}
                showHistory={false}
                headerContent={
                  <p className="text-center text-text-secondary text-sm mb-6 italic">All-time champions 🌟</p>
                }
              />
            )}
          </div>
        </section>
      </main>

      <ImageModal imageSrc={modalImage} onClose={() => setModalImage(null)} />
      <CalorieChecker
        isOpen={isFoodModalOpen}
        onClose={() => setIsFoodModalOpen(false)}
        onApply={handleApplyCalculatorTotal}
      />
      <StatsDashboard
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        weeklyData={weeklyData}
        monthlyData={monthlyData}
        lifetimeData={lifetimeData}
      />
    </>
  );
}

export default App;
