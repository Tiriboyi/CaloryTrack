import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { X, TrendingUp, Activity, Users, Flame } from 'lucide-react';
import { Tabs } from './Tabs';

export function StatsDashboard({ isOpen, onClose, weeklyData, monthlyData, lifetimeData }) {
    const [activeTab, setActiveTab] = useState('weekly');

    const currentData = useMemo(() => {
        if (activeTab === 'weekly') return weeklyData;
        if (activeTab === 'monthly') return monthlyData;
        if (activeTab === 'lifetime') return lifetimeData;
        return weeklyData;
    }, [activeTab, weeklyData, monthlyData, lifetimeData]);

    const stats = useMemo(() => {
        if (!currentData?.users) return null;

        const totalCalories = currentData.users.reduce((acc, user) => acc + user.totalCalories, 0);
        const totalWorkouts = currentData.users.reduce((acc, user) => acc + (user.logs?.length || 0), 0);
        const activeUsers = currentData.users.length;

        // Prepare data for charts
        const topUsers = [...currentData.users]
            .sort((a, b) => b.totalCalories - a.totalCalories)
            .slice(0, 5)
            .map(user => ({
                name: user.name,
                calories: user.totalCalories
            }));

        // Aggregate daily activity
        const dailyMap = {};
        currentData.users.forEach(user => {
            user.logs?.forEach(log => {
                const day = log.date.split(',')[0];
                dailyMap[day] = (dailyMap[day] || 0) + log.calories;
            });
        });

        const dailyActivity = Object.entries(dailyMap).map(([day, calories]) => ({
            day,
            calories
        }));

        return {
            totalCalories,
            totalWorkouts,
            activeUsers,
            topUsers,
            dailyActivity
        };
    }, [currentData]);

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass-panel w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="w-6 h-6 text-accent-primary" />
                        Community Insights
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-6 h-6 text-text-secondary" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

                    <div className="space-y-8">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <MetricCard
                                title="Total Burned"
                                value={stats?.totalCalories.toLocaleString()}
                                unit="kcal"
                                icon={<Flame className="w-5 h-5 text-orange-500" />}
                                color="from-orange-500/20 to-red-500/5"
                            />
                            <MetricCard
                                title="Total Workouts"
                                value={stats?.totalWorkouts}
                                unit="sessions"
                                icon={<TrendingUp className="w-5 h-5 text-green-500" />}
                                color="from-green-500/20 to-emerald-500/5"
                            />
                            <MetricCard
                                title="Active Members"
                                value={stats?.activeUsers}
                                unit="users"
                                icon={<Users className="w-5 h-5 text-blue-500" />}
                                color="from-blue-500/20 to-indigo-500/5"
                            />
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Top Performers Chart */}
                            <div className="bg-bg-tertiary/30 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-6">Top Performers</h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats?.topUsers} layout="vertical" margin={{ left: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                                            <XAxis type="number" stroke="#52525b" fontSize={12} tickFormatter={(val) => `${val / 1000}k`} />
                                            <YAxis dataKey="name" type="category" stroke="#ffffff" fontSize={12} width={100} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                                                itemStyle={{ color: '#fff' }}
                                                cursor={{ fill: '#ffffff05' }}
                                            />
                                            <Bar dataKey="calories" fill="#ff4d4d" radius={[0, 4, 4, 0]} barSize={32} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Activity Trend */}
                            <div className="bg-bg-tertiary/30 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-6">Activity Trend</h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats?.dailyActivity}>
                                            <defs>
                                                <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ff8c42" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#ff8c42" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                            <XAxis dataKey="day" stroke="#52525b" fontSize={12} />
                                            <YAxis stroke="#52525b" fontSize={12} tickFormatter={(val) => `${val / 1000}k`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Area type="monotone" dataKey="calories" stroke="#ff8c42" fillOpacity={1} fill="url(#colorCalories)" strokeWidth={3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

function MetricCard({ title, value, unit, icon, color }) {
    return (
        <div className={`p-5 rounded-2xl bg-gradient-to-br ${color} border border-white/5 flex items-center gap-4`}>
            <div className="p-3 rounded-xl bg-black/20 backdrop-blur-sm">
                {icon}
            </div>
            <div>
                <p className="text-text-secondary text-xs font-medium uppercase tracking-wider">{title}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">{value}</span>
                    <span className="text-xs text-text-tertiary">{unit}</span>
                </div>
            </div>
        </div>
    );
}
