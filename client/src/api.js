const API_URL = '/api';

export async function fetchWeeklyData() {
  const res = await fetch(`${API_URL}/data`);
  return res.json();
}

export async function fetchMonthlyData() {
  const res = await fetch(`${API_URL}/monthly`);
  return res.json();
}

export async function fetchLifetimeData() {
  const res = await fetch(`${API_URL}/lifetime`);
  return res.json();
}

export async function submitEntry(name, calories, proof) {
  const res = await fetch(`${API_URL}/entry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, calories, proof })
  });
  return res;
}

export async function resetData() {
  const res = await fetch(`${API_URL}/reset`, { method: 'POST' });
  return res.json();
}
