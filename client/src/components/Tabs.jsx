import { motion } from 'framer-motion';

export function Tabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'lifetime', label: 'Lifetime' }
  ];

  return (
    <div className="flex justify-center mb-8">
      <div className="flex p-1 bg-bg-tertiary/50 backdrop-blur-sm rounded-full border border-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative px-6 py-2.5 rounded-full text-sm font-medium transition-colors z-0
              ${activeTab === tab.id ? 'text-white' : 'text-text-secondary hover:text-white'}
            `}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full -z-10 shadow-lg shadow-accent-primary/25"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
