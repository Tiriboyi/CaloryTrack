import { useState, useEffect, useRef, useCallback } from 'react';
import { Header, EntryForm, Leaderboard, Tabs, ImageModal } from './components';
import { useTheme, useLeaderDuration } from './hooks';
import { fetchWeeklyData, fetchMonthlyData, fetchLifetimeData, resetData } from './api';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('weekly');
  const [weeklyData, setWeeklyData] = useState({ users: [], lastReset: Date.now() });
  const [monthlyData, setMonthlyData] = useState({ users: [], month: '' });
  const [lifetimeData, setLifetimeData] = useState({ users: [] });
  const [modalImage, setModalImage] = useState(null);
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

  const renderLeaderStatus = () => {
    if (!leaderInfo.name) return null;
    return (
      <div className="leader-status">
        👑 <strong>{leaderInfo.name}</strong> has been leading for{' '}
        <strong style={{ color: 'var(--accent)' }}>{leaderInfo.duration}</strong>
      </div>
    );
  };

  return (
    <>
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main>
        <EntryForm ref={entryFormRef} onSubmitSuccess={loadAllData} />

        <section>
          <h2 className="section-title">
            Leaderboards
            <button className="reset-btn" onClick={handleReset}>
              Reset Demo
            </button>
          </h2>

          <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className={`tab-content ${activeTab === 'weekly' ? 'active' : ''}`}>
            <Leaderboard
              users={weeklyData.users}
              emptyMessage="No entries yet. Be the first! 🏋️"
              onShowImage={setModalImage}
              onItemDoubleClick={handleItemDoubleClick}
              showHistory={true}
              headerContent={renderLeaderStatus()}
            />
          </div>

          <div className={`tab-content ${activeTab === 'monthly' ? 'active' : ''}`}>
            <Leaderboard
              users={monthlyData.users}
              emptyMessage="No entries this month yet. 📅"
              onShowImage={setModalImage}
              showHistory={false}
              headerContent={
                <p className="month-label">{monthlyData.month}</p>
              }
            />
          </div>

          <div className={`tab-content ${activeTab === 'lifetime' ? 'active' : ''}`}>
            <Leaderboard
              users={lifetimeData.users}
              emptyMessage="No lifetime data yet. 🏆"
              onShowImage={setModalImage}
              showHistory={false}
              headerContent={
                <p className="month-label">All-time champions 🌟</p>
              }
            />
          </div>
        </section>
      </main>

      <ImageModal imageSrc={modalImage} onClose={() => setModalImage(null)} />
    </>
  );
}

export default App;
