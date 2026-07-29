import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Detect backend based on current location
const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5003/api`;


function StatusBadge({ status }) {
  const map = {
    running: 'bg-green-500/10 text-green-700 border-green-600/20',
    warning: 'bg-yellow-500/10 text-yellow-700 border-yellow-600/20',
    crashed: 'bg-red-500/10 text-red-700 border-red-600/20',
    exited: 'bg-gray-200 text-gray-600 border-gray-200',
    created: 'bg-[#2496ED]/10 text-[#2496ED] border-[#2496ED]/20',
    unknown: 'bg-purple-500/10 text-purple-700 border-purple-600/20',
  };

  const icon = { running: '', warning: '', crashed: '', exited: '', created: '', unknown: '' };


  return (
    <span className={`px-2 py-1 rounded-full text-xs border font-semibold ${map[status] || map.unknown}`}>
      {icon[status] || icon.unknown} {status}
    </span>
  );
}

function HealthBar({ value = 0 }) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const color = safeValue >= 80 ? 'bg-green-600' : safeValue >= 50 ? 'bg-yellow-600' : 'bg-red-600';

  return (
    <div className="flex items-center gap-2 w-full" title={`Health: ${safeValue}%`}>
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${safeValue}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8">{safeValue}%</span>
    </div>
  );
}

export default function Dashboard({ user, onNavigate }) {
  const [containers, setContainers] = useState([]);
  const [alerts, setAlerts] = useState([]); // Alerts will be fetched from backend
  const [activeTab, setActiveTab] = useState('dashboard');
  const [history, setHistory] = useState([]); // History for charts, will be empty initially
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [costData, setCostData] = useState({ totalSavedToday: 0, optimizations: [], securityIssues: [] });
  const [securitySummary, setSecuritySummary] = useState({
    criticalVulnerabilities: 0,
    openPorts: 0,
    rootContainers: 0,
    missingLimits: 0,
    latestTagCount: 0,
  });
  const [users, setUsers] = useState([]); // State for admin user list
  const [reportLoading, setReportLoading] = useState(false);
  const [sendingReports, setSendingReports] = useState({});
  const isFetching = useRef(false);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const [containersRes, alertsRes, costRes, securityRes] = await Promise.all([
          fetch(`${API_BASE}/docker/containers`, { headers }),
          fetch(`${API_BASE}/alerts`, { headers }),
          fetch(`${API_BASE}/metrics/cost`, { headers }),
          fetch(`${API_BASE}/security/scan`, { headers }),
        ]);

        const containersData = containersRes.ok ? await containersRes.json() : [];
        const alertsData = alertsRes.ok ? await alertsRes.json() : [];
        const costMetrics = costRes.ok ? await costRes.json() : {};
        const securityData = securityRes.ok ? await securityRes.json() : {};

        if (Array.isArray(containersData)) setContainers(containersData);
        if (Array.isArray(alertsData)) setAlerts(alertsData);

        setCostData({
          totalSavedToday: costMetrics?.totalSavedToday || 0,
          optimizations: costMetrics?.optimizations || [],
          securityIssues: costMetrics?.securityIssues || [],
        });

        setSecuritySummary({
          criticalVulnerabilities: securityData?.criticalVulnerabilities || 0,
          openPorts: securityData?.openPorts || 0,
          rootContainers: securityData?.rootContainers || 0,
          missingLimits: securityData?.missingLimits || 0,
          latestTagCount: securityData?.latestTagCount || 0,
        });

        // Update Analytics History (Live Session)
        if (Array.isArray(containersData) && containersData.length > 0) {
          const avgCpu =
            containersData.reduce((acc, c) => acc + (c.cpu || 0), 0) / containersData.length;
          const avgMem =
            containersData.reduce((acc, c) => acc + (c.memory || 0), 0) / containersData.length;

          setHistory((prev) => {
            const newPoint = {
              time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
              cpu: Math.round(avgCpu),
              memory: Math.round(avgMem),
            };

            // Sirf aakhri 20 points rakhen chart ko clean rakhne ke liye
            return [...prev.slice(-19), newPoint];
          });
        }

        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // If backend is down, containers and alerts will remain empty arrays.
        // Cost data will remain initial empty state.
      }
    };

    // Fetch immediately and then every 30 seconds
    fetchData();
    const interval = setInterval(async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      try {
        await fetchData();
      } finally {
        isFetching.current = false;
      }
    }, 30000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Fetch users list if the logged-in user is an admin
  useEffect(() => {
    if (user?.role === 'admin' && activeTab === 'admin') {
      const token = localStorage.getItem('token');
      fetch(`${API_BASE}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setUsers(data);
        })
        .catch((err) => console.error('Failed to fetch users:', err));
    }
  }, [activeTab, user]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleRequestReport = async () => {
    setReportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/reports/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          data.previewUrl
            ? `📬 Report sent! Preview link is in the console.`
            : `📬 Report sent to your email successfully!`
        );
        if (data.previewUrl) {
          console.log(`📬 [Ethereal Preview URL]: ${data.previewUrl}`);
        }
      } else {
        showToast(`❌ Failed: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      showToast(`❌ Error: API request failed`);
    } finally {
      setReportLoading(false);
    }
  };

  const handleSendUserReport = async (userId, userName) => {
    setSendingReports((prev) => ({ ...prev, [userId]: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/reports/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          data.previewUrl
            ? `📬 Report sent to ${userName}! Preview link is in the console.`
            : `📬 Report sent to ${userName} successfully!`
        );
        if (data.previewUrl) {
          console.log(`📬 [Ethereal Preview URL for ${userName}]: ${data.previewUrl}`);
        }
      } else {
        showToast(`❌ Failed to send: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      showToast(`❌ Error: API request failed`);
    } finally {
      setSendingReports((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleRestart = (id, name) => {
    if (user?.role !== 'admin') return;
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/docker/restart/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setContainers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'running', health: 60, restarts: c.restarts + 1 } : c))
    );
    showToast(`✅ ${name} restarted successfully!`);
  };

  const crashingContainers = containers.filter(
    (c) => c.status === 'crashed' || (c.health && c.health < 50)
  );
  const runningCount = containers.filter((c) => c.status === 'running').length;

  const tabs = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'containers', label: 'Infrastructure' },
    { id: 'alerts', label: `Incidents ${alerts.length > 0 ? `(${alerts.length})` : ''}` },
    { id: 'analytics', label: 'Performance' },
    { id: 'cost', label: 'Optimization' },
    { id: 'security', label: 'Security' },
  ];

  if (user?.role === 'admin') {
    tabs.push({ id: 'admin', label: '👤 Admin' });
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] font-sans antialiased">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl font-semibold">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="#2496ED"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="#2496ED"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="#2496ED"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <h1 className="font-bold text-[#111827] tracking-tight">AI DevOps Monitor</h1>
            <p className="text-[10px] text-[#6B7280] font-mono uppercase tracking-widest">
              System Online • {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-700">
              {runningCount}/{(containers ?? []).length} Running
            </span>
          </div>

          {user && <span className="text-gray-500 text-sm">👤 {user.name}</span>}

          <button
            onClick={handleRequestReport}
            disabled={reportLoading}
            className="flex items-center gap-1.5 bg-white hover:bg-[#2496ED]/10 disabled:opacity-50 text-gray-700 hover:text-[#2496ED] px-3.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold transition-all duration-200"
          >
            {reportLoading ? '⏳ Sending...' : '📧 Email Me Report'}
          </button>

          <button
            onClick={() => onNavigate('landing')}
            className="text-gray-500 hover:text-[#2496ED] text-sm transition-colors"
          >
            ← Home
          </button>
        </div>
      </header>

      {/* Crash Alert Banner */}
      {crashingContainers.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 rounded-none">
          <div className="flex items-center gap-3">
            <span className="text-red-600 font-bold animate-bounce">🔴 CRASH ALERT</span>
            {crashingContainers.map((c) => (
              <span key={c.id} className="text-red-600/80 text-sm">
                {c.status === 'crashed'
                  ? `${c.name} has crashed!`
                  : `${c.name} — memory at ${Math.round(c.memory)}%, crash predicted in ~8 min`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nav Tabs */}
      <nav className="bg-white border-b border-gray-200 px-6 flex gap-1 pt-2 sticky top-[72px] z-30">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 border-x border-t ${
              activeTab === tab.id
                ? 'border-gray-200 bg-[#2496ED]/10 text-[#2496ED] shadow-sm'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-[#2496ED]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="p-6">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '🟢', label: 'Running', value: runningCount, color: 'text-green-600' },
                {
                  icon: '⚠️',
                  label: 'Warning',
                  value: (containers ?? []).filter((c) => c.status === 'warning').length,
                  color: 'text-yellow-600',
                },
                {
                  icon: '❌',
                  label: 'Crashed',
                  value: (containers ?? []).filter((c) => c.status === 'crashed').length,
                  color: 'text-red-600',
                },
                {
                  icon: '🛡️',
                  label: 'Security Issues',
                  value: costData?.securityIssues?.length || 0,
                  color: 'text-orange-600',
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all duration-200"
                >
                  <div className="text-2xl mb-2">{card.icon}</div>
                  <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
                  <div className="text-gray-500 text-sm">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Security Monitoring Cards */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold mb-4 text-[#2496ED] flex items-center gap-2">
                🛡️ Security Monitoring Center
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  {
                    label: 'Critical Issues',
                    value: securitySummary.criticalVulnerabilities,
                    color: 'text-red-600',
                  },
                  { label: 'Open Ports', value: securitySummary.openPorts, color: 'text-yellow-600' },
                  { label: 'Root Containers', value: securitySummary.rootContainers, color: 'text-orange-600' },
                  { label: 'Missing Limits', value: securitySummary.missingLimits, color: 'text-cyan-600' },
                  { label: 'Latest Tags', value: securitySummary.latestTagCount, color: 'text-red-700' },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="bg-white rounded-lg p-4 border border-gray-200 text-center"
                  >
                    <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1 font-semibold">
                      {card.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Container Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-bold">Container Health Overview</h2>
                <span className="text-xs text-gray-500">Auto-refreshing every 30s</span>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3">Container</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3 w-32">Health</th>
                    <th className="text-left px-4 py-3">CPU</th>
                    <th className="text-left px-4 py-3">Memory</th>
                    <th className="text-left px-4 py-3">Restarts</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {(containers ?? []).map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedContainer(c);
                            setActiveTab('containers');
                          }}
                          className="flex items-center gap-2 hover:text-[#2496ED] transition-colors"
                        >
                          <span className="text-gray-800 font-mono text-xs">{c.name}</span>
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-4 w-36">
                        <HealthBar value={Math.round(c.health || 0)} />
                      </td>
                      <td className="px-4 py-4 text-xs font-mono text-gray-500">{Math.round(c.cpu || 0)}%</td>
                      <td className="px-4 py-4 text-xs font-mono text-gray-500">{Math.round(c.memory || 0)}%</td>
                      <td className="px-4 py-4 text-xs font-mono text-gray-500">{c.restarts || 0}</td>
                      <td className="px-4 py-4">
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleRestart(c.id, c.name)}
                            className="bg-white hover:bg-[#2496ED]/10 text-[#2496ED] text-xs px-3 py-1 rounded-lg transition-colors border border-gray-200"
                          >
                            🔄 Restart
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all duration-200">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-green-700 mb-2">
                  Efficiency Savings
                </h3>
                <div className="text-3xl font-bold">₹{costData.totalSavedToday.toLocaleString()}</div>
                <p className="text-gray-500 text-[10px] mt-1 uppercase font-bold">
                  {(costData?.optimizations?.length || 0)} Optimization events
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all duration-200">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#2496ED] mb-2">
                  Vulnerability Count
                </h3>
                <div className="text-3xl font-bold">{costData?.securityIssues?.length || 0}</div>
                <p className="text-gray-500 text-[10px] mt-1 uppercase font-bold">
                  {(costData?.securityIssues || []).filter((s) => s.severity === 'CRITICAL').length} High Priority
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CONTAINERS TAB */}
        {activeTab === 'containers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(containers ?? []).map((c) => (
              <div
                key={c.id}
                className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-all duration-200 border-gray-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold font-mono">{c.name}</h3>
                  <StatusBadge status={c.status} />
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Health</span>
                      <span>{Math.round(c.health)}%</span>
                    </div>
                    <HealthBar value={Math.round(c.health)} />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>CPU</span>
                      <span>{Math.round(c.cpu)}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className="bg-[#2496ED] h-2 rounded-full" style={{ width: `${c.cpu}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Memory</span>
                      <span>{Math.round(c.memory)}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${c.memory > 85 ? 'bg-red-500' : 'bg-purple-500'}`}
                        style={{ width: `${c.memory}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 text-xs text-gray-500">
                  <span>⏱ {c.uptime}</span>
                  <span>🔄 {c.restarts} restarts</span>
                  <span className="font-mono text-gray-600">#{c.id}</span>
                </div>

                {user?.role === 'admin' ? (
                  <button
                    onClick={() => handleRestart(c.id, c.name)}
                    className="mt-4 w-full bg-[#2496ED] hover:bg-[#2496ED]/90 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    🔄 Restart Container
                  </button>
                ) : (
                  <button
                    disabled
                    className="mt-4 w-full bg-gray-100 text-gray-400 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200 cursor-not-allowed"
                  >
                    🔄 Restart Container
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div className="space-y-3 max-w-3xl">
            <h2 className="font-bold text-lg">Recent Alerts</h2>

            {(alerts ?? []).map((a) => {
              const leftBorder =
                a.severity === 'critical'
                  ? 'border-l-red-500/80'
                  : a.severity === 'high'
                    ? 'border-l-yellow-500/80'
                    : 'border-l-[#2496ED]/60';

              const pill =
                a.severity === 'critical'
                  ? 'bg-red-500/10 text-red-700 border-red-600/20'
                  : a.severity === 'high'
                    ? 'bg-yellow-500/10 text-yellow-700 border-yellow-600/20'
                    : 'bg-[#2496ED]/10 text-[#2496ED] border-[#2496ED]/20';

              return (
                <div
                  key={a.id}
                  className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex gap-4 items-start hover:shadow-md transition-all duration-200 ${leftBorder}`}
                >
                  <span className="text-2xl">
                    {a.severity === 'critical' ? '🔴' : a.severity === 'high' ? '🟡' : 'ℹ️'}
                  </span>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold font-mono text-sm text-gray-800">{a.container}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${pill}`}>
                        {a.severity}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{a.message}</p>
                    <p className="text-gray-500 text-xs mt-1">{new Date(a.time).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="font-bold text-lg">Performance Analytics</h2>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold mb-4 text-gray-700">CPU & Memory Over Time</h3>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={history}>
                  <XAxis dataKey="time" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                    }}
                    labelStyle={{ color: '#111827' }}
                    itemStyle={{ color: '#111827' }}
                  />
                  <Line type="monotone" dataKey="cpu" stroke="#2496ED" strokeWidth={2} dot={false} name="CPU %" />
                  <Line type="monotone" dataKey="memory" stroke="#A855F7" strokeWidth={2} dot={false} name="Memory %" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: 'Avg CPU Usage',
                  value:
                    (containers ?? []).length > 0
                      ? `${Math.round((containers ?? []).reduce((a, c) => a + c.cpu, 0) / (containers ?? []).length)}%`
                      : 'N/A',
                  color: 'text-[#2496ED]',
                },
                {
                  label: 'Avg Memory',
                  value:
                    (containers ?? []).length > 0
                      ? `${Math.round((containers ?? []).reduce((a, c) => a + c.memory, 0) / (containers ?? []).length)}%`
                      : 'N/A',
                  color: 'text-purple-500',
                },
                {
                  label: 'Total Restarts',
                  value: (containers ?? []).reduce((a, c) => a + (c.restarts || 0), 0),
                  color: 'text-orange-500',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center hover:shadow-md transition-all duration-200"
                >
                  <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-gray-500 text-sm mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COST TAB */}
        {activeTab === 'cost' && (
          <div className="space-y-6 max-w-3xl">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-2xl text-green-700 mb-1">
                💰 ₹{costData.totalSavedToday.toLocaleString()} Saved Today
              </h2>
              <p className="text-gray-500">AI auto-optimized {(costData?.optimizations || []).length} containers</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-800">Cost Optimizations</h3>
              {(costData?.optimizations || []).map((o) => (
                <div
                  key={o.container}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <span className="font-mono font-bold text-sm text-gray-800">{o.container}</span>
                    <p className="text-gray-500 text-sm">{o.issue}</p>
                  </div>
                  <span className="text-green-700 font-bold">{o.saving > 0 ? '+' : ''}₹{o.saving.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-orange-600">🛡️ Security Issues</h3>
              {(costData?.securityIssues || []).map((s) => (
                <div
                  key={s.container}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <span className="font-mono font-bold text-sm text-gray-800">{s.container}</span>
                    <p className="text-gray-500 text-sm">{s.issue}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-bold border ${
                      s.severity === 'CRITICAL'
                        ? 'bg-red-500/10 text-red-700 border-red-600/20'
                        : 'bg-orange-500/10 text-orange-700 border-orange-600/20'
                    }`}
                  >
                    {s.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADMIN TAB */}
        {activeTab === 'admin' && user?.role === 'admin' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">User Management (Admin Only)</h2>
              <span className="text-xs text-gray-500">Total Registered Users: {users.length}</span>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-4">Name</th>
                    <th className="text-left px-6 py-4">Email</th>
                    <th className="text-left px-6 py-4">Role</th>
                    <th className="text-left px-6 py-4">Joined Date</th>
                    <th className="text-left px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{u.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            u.role === 'admin'
                              ? 'bg-purple-500/10 text-purple-700 border-purple-600/20'
                              : 'bg-[#2496ED]/10 text-[#2496ED] border-[#2496ED]/20'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSendUserReport(u._id, u.name)}
                          disabled={sendingReports[u._id]}
                          className="flex items-center gap-1 bg-[#2496ED] hover:bg-[#2496ED]/90 disabled:opacity-50 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-all duration-200 shadow-sm"
                        >
                          {sendingReports[u._id] ? '⏳ Sending...' : '📧 Send Report'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

