export function Tabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'weekly', label: '📅 Weekly' },
    { id: 'monthly', label: '📆 Monthly' },
    { id: 'lifetime', label: '🏆 Lifetime' }
  ];

  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
