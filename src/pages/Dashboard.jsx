import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Settings, Database, Bell } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://philia-vault.onrender.com';

export const Dashboard = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [standardUsers, setStandardUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annSegment, setAnnSegment] = useState('all');
  const [annSending, setAnnSending] = useState(false);
  const [annResult, setAnnResult] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getTabClass = (tabName) => {
    return `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      activeTab === tabName
        ? 'bg-philia-accent/10 text-philia-accent border border-philia-accent/20'
        : 'text-philia-muted hover:text-white hover:bg-white/5 border border-transparent'
    }`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('philia_admin_token');
        const headers = { Authorization: `Bearer ${token}` };

        if (activeTab === 'overview') {
          const res = await axios.get(`${API_BASE}/api/admin/stats/overview`, { headers });
          setStats(res.data);
        } else if (activeTab === 'users') {
          const res = await axios.get(`${API_BASE}/api/admin/founders`, { headers });
          setUsers(res.data.users || []);
        } else if (activeTab === 'all_users') {
          const res = await axios.get(`${API_BASE}/api/admin/users`, { headers });
          setStandardUsers(res.data.users || []);
        } else if (activeTab === 'announcements') {
          const res = await axios.get(`${API_BASE}/api/admin/announcement/history`, { headers });
          setAnnouncements(res.data.announcements || []);
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          handleLogout();
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, logout, navigate]);

  const handleSendAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) {
      setAnnResult('Title and body are required.');
      return;
    }
    setAnnSending(true);
    setAnnResult('');
    try {
      const token = localStorage.getItem('philia_admin_token');
      const res = await axios.post(
        `${API_BASE}/api/admin/announcement/send`,
        { title: annTitle, body: annBody, target_segment: annSegment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnnResult(`Sent: ${res.data.sent}, Failed: ${res.data.failed}`);
      setAnnTitle('');
      setAnnBody('');
      // Refresh history
      const hist = await axios.get(`${API_BASE}/api/admin/announcement/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(hist.data.announcements || []);
    } catch (err) {
      setAnnResult(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setAnnSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-philia-bg text-white flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-philia-border flex flex-col">
        <div className="p-6 border-b border-philia-border">
          <div className="text-philia-accent font-bold text-xl tracking-widest">
            PHILIA VAULT
          </div>
          <div className="text-philia-muted font-mono text-[10px] tracking-widest mt-1">
            ADMIN DASHBOARD
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full ${getTabClass('overview')}`}>
            <Database size={18} />
            <span className="font-mono text-sm">Overview</span>
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full ${getTabClass('users')}`}>
            <Users size={18} />
            <span className="font-mono text-sm">Founders</span>
          </button>
          <button onClick={() => setActiveTab('all_users')} className={`w-full ${getTabClass('all_users')}`}>
            <Users size={18} />
            <span className="font-mono text-sm">All Users</span>
          </button>
          <button onClick={() => setActiveTab('announcements')} className={`w-full ${getTabClass('announcements')}`}>
            <Bell size={18} />
            <span className="font-mono text-sm">Announcements</span>
          </button>
          <button className={`w-full ${getTabClass('settings')} opacity-50 cursor-not-allowed`}>
            <Settings size={18} />
            <span className="font-mono text-sm">Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-philia-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-philia-border flex items-center justify-center text-xs font-bold text-philia-muted uppercase">
                {admin?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-bold truncate">{admin?.full_name || 'Admin'}</div>
                <div className="text-[10px] font-mono text-philia-muted uppercase">{admin?.role}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="text-philia-muted hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-display">Welcome back, {admin?.full_name || 'Admin'}</h1>
            <p className="text-philia-muted font-mono text-sm mt-2">Here is what's happening with Philia Vault today.</p>
          </div>
          {isLoading && <span className="text-philia-accent animate-pulse font-mono text-sm">Loading data...</span>}
        </header>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-philia-card border border-philia-border p-6 rounded-2xl relative">
              <div className="text-philia-muted font-mono text-xs mb-2">FOUNDER SPOTS REMAINING</div>
              <div className="text-4xl font-bold text-white">
                {stats.spots.total - stats.spots.taken} <span className="text-philia-muted text-xl">/ {stats.spots.total}</span>
              </div>
              <div className="text-philia-accent font-mono text-[10px] mt-2 tracking-widest uppercase">
                {stats.spots.taken} spots taken
              </div>
            </div>
            <div className="bg-philia-card border border-philia-border p-6 rounded-2xl">
              <div className="text-philia-muted font-mono text-xs mb-2">TOTAL FOUNDERS</div>
              <div className="text-4xl font-bold text-white">{stats.total_founders}</div>
              <div className="text-philia-muted font-mono text-[10px] mt-2">
                Out of {stats.total_users} total standard accounts
              </div>
            </div>
            <div className="bg-philia-card border border-philia-border p-6 rounded-2xl">
              <div className="text-philia-muted font-mono text-xs mb-2">SYSTEM STATUS</div>
              <div className="text-2xl font-bold text-philia-accent mt-2 flex items-center">
                <span className="w-2 h-2 rounded-full bg-philia-accent mr-2 animate-pulse"></span>
                {stats.status}
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="bg-philia-card border border-philia-border rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-philia-border flex justify-between items-center">
              <h2 className="text-lg font-bold">Founder Members</h2>
              <div className="flex space-x-3">
                <span className="bg-philia-bg text-philia-accent font-mono text-xs px-3 py-1 rounded-full border border-philia-border flex items-center">
                  {users.length} members
                </span>
              </div>
            </div>
            {users.length === 0 && !isLoading ? (
              <div className="p-10 text-center text-philia-muted font-mono text-sm">No founder members found yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-philia-bg/50 border-b border-philia-border">
                    <tr>
                      <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">EMAIL</th>
                      <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">STATUS</th>
                      <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">AMOUNT</th>
                      <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">DATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-philia-border">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 text-sm font-medium">{user.email}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded font-mono ${user.status === 'active' ? 'bg-philia-accent/10 text-philia-accent border border-philia-accent/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-mono">${user.amount_paid}</td>
                        <td className="p-4 text-sm text-philia-muted">{new Date(user.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ALL USERS TAB */}
        {activeTab === 'all_users' && (
          <div className="bg-philia-card border border-philia-border rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-philia-border flex justify-between items-center">
              <h2 className="text-lg font-bold">Standard Users</h2>
              <div className="flex space-x-3">
                <span className="bg-philia-bg text-philia-accent font-mono text-xs px-3 py-1 rounded-full border border-philia-border flex items-center">
                  {standardUsers.length} users
                </span>
              </div>
            </div>
            {standardUsers.length === 0 && !isLoading ? (
              <div className="p-10 text-center text-philia-muted font-mono text-sm">No standard users found yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-philia-bg/50 border-b border-philia-border">
                    <tr>
                      <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">EMAIL</th>
                      <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">BALANCE</th>
                      <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">REFERRAL CODE</th>
                      <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">FOUNDER ACCESS</th>
                      <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">DATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-philia-border">
                    {standardUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 text-sm font-medium">{user.email}</td>
                        <td className="p-4 text-sm font-mono text-philia-accent">${user.balance?.toFixed(2) || '0.00'}</td>
                        <td className="p-4 text-sm font-mono">{user.code_parrainage || '-'}</td>
                        <td className="p-4">
                          {user.has_founder_access ? (
                            <span className="text-xs px-2 py-1 rounded font-mono bg-philia-accent/10 text-philia-accent border border-philia-accent/20">YES</span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded font-mono bg-philia-muted/10 text-philia-muted border border-philia-border">NO</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-philia-muted">{new Date(user.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="bg-philia-card border border-philia-border rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">New Announcement</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-philia-muted font-mono text-xs tracking-wider block mb-1">TITLE</label>
                  <input
                    type="text"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g. New feature available"
                    className="w-full bg-philia-bg border border-philia-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-philia-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="text-philia-muted font-mono text-xs tracking-wider block mb-1">MESSAGE</label>
                  <textarea
                    value={annBody}
                    onChange={(e) => setAnnBody(e.target.value)}
                    rows={3}
                    placeholder="Notification body text..."
                    className="w-full bg-philia-bg border border-philia-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-philia-accent transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="text-philia-muted font-mono text-xs tracking-wider block mb-1">TARGET SEGMENT</label>
                  <select
                    value={annSegment}
                    onChange={(e) => setAnnSegment(e.target.value)}
                    className="w-full bg-philia-bg border border-philia-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-philia-accent transition-colors"
                  >
                    <option value="all">All Users</option>
                    <option value="premium_only">Premium Only</option>
                    <option value="founder_only">Founders Only</option>
                  </select>
                </div>
                <button
                  onClick={handleSendAnnouncement}
                  disabled={annSending}
                  className="bg-philia-accent text-black font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 font-mono text-sm"
                >
                  {annSending ? 'Sending...' : 'Send Announcement'}
                </button>
                {annResult && (
                  <div className={`text-sm font-mono ${annResult.includes('Error') ? 'text-red-400' : 'text-philia-accent'}`}>
                    {annResult}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-philia-card border border-philia-border rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-philia-border">
                <h2 className="text-lg font-bold">History</h2>
              </div>
              {announcements.length === 0 && !isLoading ? (
                <div className="p-10 text-center text-philia-muted font-mono text-sm">No announcements sent yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-philia-bg/50 border-b border-philia-border">
                      <tr>
                        <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">TITLE</th>
                        <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">SEGMENT</th>
                        <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">DATE</th>
                        <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">SENT</th>
                        <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">FAILED</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-philia-border">
                      {announcements.map((a) => (
                        <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 text-sm font-medium">{a.title}</td>
                          <td className="p-4">
                            <span className="text-xs px-2 py-1 rounded font-mono bg-philia-accent/10 text-philia-accent border border-philia-accent/20">
                              {a.target_segment}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-philia-muted">{new Date(a.sent_at).toLocaleDateString()}</td>
                          <td className="p-4 text-sm font-mono text-philia-accent">{a.sent_count}</td>
                          <td className={`p-4 text-sm font-mono ${a.failed_count > 0 ? 'text-red-400' : 'text-philia-muted'}`}>{a.failed_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
