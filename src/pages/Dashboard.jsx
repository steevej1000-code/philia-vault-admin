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
  const [announcements, setAnnouncements] = useState([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annSegment, setAnnSegment] = useState('all');
  const [annLoading, setAnnLoading] = useState(false);
  const [annResult, setAnnResult] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('philia_admin_token');
        const headers = { Authorization: Bearer ${token} };
        if (activeTab === 'overview') {
          const res = await axios.get(`${API_BASE}/api/admin/stats/overview`, { headers });
          setStats(res.data);
        } else if (activeTab === 'users') {
          const res = await axios.get(`${API_BASE}/api/admin/users`, { headers });
          setUsers(res.data.users);
        } else if (activeTab === 'all_users') {
          const res = await axios.get(`${API_BASE}/api/admin/standard_users`, { headers });
          setStandardUsers(res.data.users);
        } else if (activeTab === 'announcements') {
          const res = await axios.get(`${API_BASE}/api/admin/announcement/history`, { headers });
          setAnnouncements(res.data.announcements || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, logout, navigate]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleBlockUser = async (userId, isFounder = false) => {
    if (!window.confirm("Êtes-vous sûr de vouloir bloquer cet utilisateur ?")) return;
    try {
      const token = localStorage.getItem('philia_admin_token');
      const endpoint = isFounder ? /api/admin/founders/${userId}/block : /api/admin/users/${userId}/block;
      await axios.put(`${API_BASE}${endpoint}`, {}, { headers: { Authorization: Bearer ${token} } });
      alert("Utilisateur bloqué avec succès");
      if (isFounder) setUsers(users.map(u => u.id === userId ? { ...u, status: 'blocked' } : u));
      else setStandardUsers(standardUsers.map(u => u.id === userId ? { ...u, is_blocked: true } : u));
    } catch (err) { alert("Erreur lors du blocage : " + (err.response?.data?.error || err.message)); }
  };

  const handleUpdateSpots = async () => {
    const newTotal = prompt("Entrez le nouveau nombre TOTAL de places :", stats?.spots?.total || 10);
    if (newTotal === null) return;
    const newTaken = prompt("Entrez le nouveau nombre de places PRISES :", stats?.spots?.taken || 0);
    if (newTaken === null) return;
    try {
      const token = localStorage.getItem('philia_admin_token');
      await axios.put(`${API_BASE}/api/admin/stats/spots`, { total: parseInt(newTotal, 10), taken: parseInt(newTaken, 10) }, { headers: { Authorization: Bearer ${token} } });
      alert("Compteur mis à jour avec succès. Veuillez rafraîchir la page.");
      window.location.reload();
    } catch (err) { alert("Erreur lors de la mise à jour : " + (err.response?.data?.error || err.message)); }
  };

  const handleExport = (type) => {
    const token = localStorage.getItem('philia_admin_token');
    axios.
get(`${API_BASE}/api/admin/export/${type}`, { headers: { Authorization: Bearer ${token} }, responseType: 'blob' })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${type}_export.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }).catch(() => alert("Erreur d'export"));
  };

  const handleSendAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) { setAnnResult('❌ Titre et message requis.'); return; }
    setAnnLoading(true); setAnnResult('');
    try {
      const token = localStorage.getItem('philia_admin_token');
      const res = await axios.post(`${API_BASE}/api/admin/announcement/send`, { title: annTitle, body: annBody, target_segment: annSegment }, { headers: { Authorization: Bearer ${token} } });
      setAnnResult(`✅ ${res.data.sent} notifications envoyées, ${res.data.failed} échecs.`);
      setAnnTitle(''); setAnnBody('');
      const hist = await axios.get(`${API_BASE}/api/admin/announcement/history`, { headers: { Authorization: Bearer ${token} } });
      setAnnouncements(hist.data.announcements || []);
    } catch (err) { setAnnResult('❌ Erreur: ' + (err.response?.data?.error || err.message)); }
    finally { setAnnLoading(false); }
  };

  const getTabClass = (tabName) => activeTab === tabName
    ? "flex items-center space-x-3 px-4 py-3 bg-philia-card text-philia-accent rounded-lg border border-philia-border"
    : "flex items-center space-x-3 px-4 py-3 text-philia-muted hover:text-white hover:bg-philia-card rounded-lg transition-colors";

  return (
    <div className="min-h-screen bg-philia-bg text-white flex">
      <div className="w-64 border-r border-philia-border flex flex-col">
        <div className="p-6 border-b border-philia-border">
          <div className="text-philia-accent font-bold text-xl tracking-widest">PHILIA VAULT</div>
          <div className="text-philia-muted font-mono text-[10px] tracking-widest mt-1">ADMIN DASHBOARD</div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full ${getTabClass('overview')}`}><Database size={18} /><span className="font-mono text-sm">Overview</span></button>
          <button onClick={() => setActiveTab('users')} className={`w-full ${getTabClass('users')}`}><Users size={18} /><span className="font-mono text-sm">Founders</span></button>
          <button onClick={() => setActiveTab('all_users')} className={`w-full ${getTabClass('all_users')}`}><Users size={18} /><span className="font-mono text-sm">All Users</span></button>
          <button onClick={() => setActiveTab('announcements')} className={`w-full ${getTabClass('announcements')}`}><Bell size={18} /><span className="font-mono text-sm">Annonces</span></button>
          <button className={`w-full ${getTabClass('settings')} opacity-50 cursor-not-allowed`}><Settings size={18} /><span className="font-mono text-sm">Settings</span></button>
        </nav>
        <div className="p-4 border-t border-philia-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-philia-border flex items-center justify-center text-xs font-bold text-philia-muted uppercase">{admin?.full_name?.charAt(0) || 'A'}</div>
              <div className="overflow-hidden">
                <div className="text-sm font-bold truncate">{admin?.full_name || 'Admin'}</div>
                <div className="text-[10px] font-mono text-philia-muted uppercase">{admin?.role}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="text-philia-muted hover:text-red-400 transition-colors"><LogOut size={18} /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-10 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-display">Welcome back, {admin?.full_name || 'Admin'}</h1>
            <p className="text-philia-muted font-mono text-sm mt-2">Here is what's happening with Philia Vault today.</p>
          </div>
          {isLoading && <span className="text-philia-accent animate-pulse font-mono text-sm">Loading data...</span>}
        </header>

        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-philia-card border border-philia-border p-6 rounded-2xl relative">
              <button onClick={handleUpdateSpots} className="absolute top-4 right-4 text-xs font-mono bg-philia-border px-2 py-1 rounded hover:bg-white/10 transition-colors">EDIT</button>
              <div className="text-philia-muted font-mono text-xs mb-2">FOUNDER SPOTS REMAINING</div>
              <div className="text-4xl font-bold text-white">{stats.spots.total - stats.spots.taken} <span className="text-philia-muted text-xl">/ {stats.spots.total}</span></div>
              <div className="text-philia-accent font-mono text-[10px] mt-2 tracking-widest uppercase">{stats.spots.taken} spots taken</div>
            </div>
            <div className="bg-philia-card border border-philia-border p-6 rounded-2xl">
              <div className="text-philia-muted font-mono text-xs mb-2">TOTAL FOUNDERS</div>
              <div className="text-4xl font-bold text-white">{stats.total_founders}</div>
              <div className="text-philia-muted font-mono text-[10px] mt-2 tracking-widest">Out of {stats.total_users} total standard accounts</div>
            </div>
            <div className="bg-philia-card border border-philia-border p-6 rounded-2xl">
              <div className="text-philia-muted font-mono text-xs mb-2">SYSTEM STATUS</div>
              <div className="text-2xl font-bold text-philia-accent mt-2 flex items-center"><span className="w-2 h-2 rounded-full bg-philia-accent mr-2 animate-pulse"></span>{stats.status}</div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-philia-card border border-philia-border rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-philia-border flex justify-between items-center">
              <h2 className="text-lg font-bold">Founder Members</h2>
              <div className="flex space-x-3">
                <span className="bg-philia-bg text-philia-accent font-mono text-xs px-3 py-1 rounded-full border border-philia-border">{users.length} members</span>
                <button onClick={() => handleExport('founders')} className="bg-philia-bg text-white font-mono text-xs px-3 py-1 rounded-full border border-philia-border hover:bg-white/10 transition-colors">EXPORT CSV</button>
              </div>
            </div>
            {users.length === 0 && !isLoading ? <div className="p-10 text-center text-philia-muted font-mono text-sm">No founder members found yet.</div> : (
              <div className="overflow-x-auto"><table className="w-full text-left">
                <thead className="bg-philia-bg/50 border-b border-philia-border"><tr>
                  <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">EMAIL</th>
                  <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">STATUS</th>
                  <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">AMOUNT</th>
                  <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">DATE</th>
                  <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">ACTION</th>
                </tr></thead>
                <tbody className="divide-y divide-philia-border">{users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-sm font-medium">{user.email}</td>
                    <td className="p-4"><span className={`text-xs px-2 py-1 rounded font-mono ${user.status === 'active' ? 'bg-philia-accent/10 text-philia-accent border border-philia-accent/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{user.status}</span></td>
                    <td className="p-4 text-sm font-mono">${user.amount_paid}</td>
                    <td className="p-4 text-sm text-philia-muted">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="p-4"><button onClick={() => handleBlockUser(user.id, true)} className="text-red-400 hover:text-red-300 text-xs font-mono border border-red-900 px-2 py-1 rounded hover:bg-red-900/30 transition-colors">BLOCK</button></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        )}

        {activeTab === 'all_users' && (
          <div className="bg-philia-card border border-philia-border rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-philia-border flex justify-between items-center">
              <h2 className="text-lg font-bold">Standard Users</h2>
              <div className="flex space-x-3">
                <span className="bg-philia-bg text-philia-accent font-mono text-xs px-3 py-1 rounded-full border border-philia-border">{standardUsers.length} users</span>
                <button onClick={() => handleExport('standard')} className="bg-philia-bg text-white font-mono text-xs px-3 py-1 rounded-full border border-philia-border hover:bg-white/10 transition-colors">EXPORT CSV</button>
              </div>
            </div>
            {standardUsers.length === 0 && !isLoading ? <div className="p-10 text-center text-philia-muted font-mono text-sm">No standard users found yet.</div> : (
              <div className="overflow-x-auto"><table className="w-full text-left">
                <thead className="bg-philia-bg/50 border-b border-philia-border"><tr>
                  <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">EMAIL</th>
                  <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">BALANCE</th>
                  <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">REFERRAL CODE</th>
                  <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">FOUNDER ACCESS</th>
                  <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">DATE</th>
                  <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">ACTION</th>
                </tr></thead>
                <tbody className="divide-y divide-philia-border">{standardUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-sm font-medium">{user.email}</td>
                    <td className="p-4 text-sm font-mono text-philia-accent">${user.balance?.toFixed(2) || '0.00'}</td>
                    <td className="p-4 text-sm font-mono">{user.code_parrainage || '-'}</td>
                    <td className="p-4">{user.has_founder_access ? <span className="text-xs px-2 py-1 rounded font-mono bg-philia-accent/10 text-philia-accent border border-philia-accent/20">YES</span> : <span className="text-xs px-2 py-1 rounded font-mono bg-philia-muted/10 text-philia-muted border border-philia-border">NO</span>}</td>
                    <td className="p-4 text-sm text-philia-muted">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="p-4">{user.is_blocked ? <span className="text-red-500 font-mono text-xs">BLOCKED</span> : <button onClick={() => handleBlockUser(user.id, false)} className="text-red-400 hover:text-red-300 text-xs font-mono border border-red-900 px-2 py-1 rounded hover:bg-red-900/30 transition-colors">BLOCK</button>}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-8">
            <div className="bg-philia-card border border-philia-border rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-6">📢 Nouvelle annonce</h2>
              <div className="space-y-4">
                <div><label className="text-philia-muted font-mono text-xs tracking-wider block mb-2">TITRE</label>
                  <input type="text" value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Ex: Nouvelle fonctionnalité disponible" className="w-full bg-philia-bg border border-philia-border rounded-lg px-4 py-3 text-sm text-white placeholder-philia-muted focus:outline-none focus:border-philia-accent" /></div>
                <div><label className="text-philia-muted font-mono text-xs tracking-wider block mb-2">MESSAGE</label>
                  <textarea value={annBody} onChange={e => setAnnBody(e.target.value)} placeholder="Corps de la notification…" rows={4} className="w-full bg-philia-bg border border-philia-border rounded-lg px-4 py-3 text-sm text-white placeholder-philia-muted focus:outline-none focus:border-philia-accent resize-none" /></div>
                <div><label className="text-philia-muted font-mono text-xs tracking-wider block mb-2">SEGMENT</label>
                  <select value={annSegment} onChange={e => setAnnSegment(e.target.value)} className="w-full bg-philia-bg border border-philia-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-philia-accent">
                    <option value="all">Tous les utilisateurs</option>
                    <option value="premium_only">Premium uniquement</option>
                    <option value="founder_only">Founders uniquement</option>
                  </select></div>
                <button onClick={handleSendAnnouncement} disabled={annLoading} className="bg-philia-accent text-black font-bold font-mono text-sm px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">{annLoading ? '⏳ Envoi...' : 'Envoyer'}</button>
                {annResult && <p className="text-sm mt-2">{annResult}</p>}
              </div>
            </div>
            <div className="bg-philia-card border border-philia-border rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-philia-border"><h2 className="text-lg font-bold">Historique</h2></div>
              {announcements.length === 0 ? <div className="p-10 text-center text-philia-muted font-mono text-sm">Aucune annonce envoyée.</div> : (
                <div className="overflow-x-auto"><table className="w-full text-left">
                  <thead className="bg-philia-bg/50 border-b border-philia-border"><tr>
                    <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">TITRE</th>
                    <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">SEGMENT</th>
                    <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">DATE</th>
                    <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">ENVOYÉS</th>
                    <th className="p-4 text-xs font-mono text-philia-muted font-normal tracking-wider">ÉCHECS</th>
                  </tr></thead>
                  <tbody className="divide-y divide-philia-border">{announcements.map((a, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-sm font-medium">{a.title}</td>
                      <td className="p-4"><span className="text-xs px-2 py-1 rounded font-mono bg-philia-accent/10 text-philia-accent border border-philia-accent/20">{a.target_segment}</span></td>
                      <td className="p-4 text-sm text-philia-muted">{new Date(a.sent_at).toLocaleDateString('fr-FR')}</td>
                      <td className="p-4 text-sm font-mono text-philia-accent">{a.sent_count}</td>
                      <td className="p-4 text-sm font-mono text-red-400">{a.failed_count}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};