import { useState, useEffect, useRef } from 'react';
import { formatLeaderDuration } from '../utils';

export function useLeaderDuration(users) {
  const [leaderInfo, setLeaderInfo] = useState({ name: null, duration: '' });
  const leaderSinceRef = useRef(null);
  const currentLeaderRef = useRef(null);

  useEffect(() => {
    if (!users || users.length === 0) {
      setLeaderInfo({ name: null, duration: '' });
      currentLeaderRef.current = null;
      leaderSinceRef.current = null;
      return;
    }

    const sortedUsers = [...users].sort((a, b) => b.totalCalories - a.totalCalories);
    const leader = sortedUsers[0];

    // Check if leader has changed
    if (currentLeaderRef.current !== leader.name) {
      currentLeaderRef.current = leader.name;
      leaderSinceRef.current = Date.now();
    }

    const updateDuration = () => {
      if (leaderSinceRef.current && currentLeaderRef.current) {
        const elapsed = Date.now() - leaderSinceRef.current;
        setLeaderInfo({
          name: currentLeaderRef.current,
          duration: formatLeaderDuration(elapsed)
        });
      }
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [users]);

  return leaderInfo;
}
