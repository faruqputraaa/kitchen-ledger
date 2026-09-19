import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../lib/axios';

export default function Invite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) localStorage.setItem('accessToken', token);
  }, [searchParams]);

  const [code, setCode] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [mode, setMode] = useState('join'); // join | create
  const [newTenantName, setNewTenantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  // prefill code from ?code= or ?invite=
  useEffect(() => {
    const c = searchParams.get('code') || searchParams.get('invite');
    if (c) setCode(c.toUpperCase());
  }, [searchParams]);

  // preview tenant when code typed
  useEffect(() => {
    const q = code.trim().toUpperCase();
    if (q.length < 4) { setPreview(null); setTenantName(''); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/tenants/invite/${q}`);
        setPreview(data.data);
        setTenantName(data.data.name || '');
      } catch { setPreview(null); }
    }, 400);
    return () => clearTimeout(t);
  }, [code]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('Kode undangan wajib diisi'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/tenants/complete-invite', { inviteCode: code.trim().toUpperCase() });
      const data = res.data?.data;
      if (data?.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        setAuth(data.user, data.accessToken);
      } else if (data?.user) {
        const me = await api.get('/auth/me');
        if (me.data?.data) setAuth(me.data.data, localStorage.getItem('accessToken'));
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Kode tidak valid atau sudah kadaluarsa');
    } finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTenantName.trim()) { setError('Nama tenant wajib diisi'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/tenants', { name: newTenantName.trim() });
      const d = data.data;
      if (d?.accessToken) {
        localStorage.setItem('accessToken', d.accessToken);
        setAuth(d.user, d.accessToken);
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal buat tenant');
    } finally { setLoading(false); }
  };

  const copyLink = () => {
    if (!preview) return;
    const link = `${window.location.origin}/invite?code=${code.trim().toUpperCase()}`;
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: '#E2E8F0' }}>
        <h1 className="text-xl font-semibold mb-1" style={{ color: '#0F172A' }}>Tenant Onboarding</h1>
        <p className="text-sm mb-4" style={{ color: '#64748B' }}>Gabung tenant dengan kode undangan, atau buat tenant baru (kamu jadi OWNER).</p>

        <div className="flex gap-2 mb-4">
          <button onClick={() => { setMode('join'); setError(''); }} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${mode === 'join' ? 'text-white' : ''}`} style={{ backgroundColor: mode === 'join' ? '#0F172A' : '#fff', borderColor: '#CBD5E1', color: mode === 'join' ? '#fff' : '#334155' }}>Gabung</button>
          <button onClick={() => { setMode('create'); setError(''); }} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${mode === 'create' ? 'text-white' : ''}`} style={{ backgroundColor: mode === 'create' ? '#0F172A' : '#fff', borderColor: '#CBD5E1', color: mode === 'create' ? '#fff' : '#334155' }}>Buat Baru</button>
        </div>

        {mode === 'join' ? (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="text-sm font-medium" style={{ color: '#334155' }}>Kode Undangan</label>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="AB12CD34" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: '#CBD5E1' }} maxLength={20} autoFocus />
              {preview && <p className="text-xs mt-1" style={{ color: '#059669' }}>→ Tenant: <b>{preview.name}</b> ({preview.code}) — {preview.plan}</p>}
              {code.length >= 4 && !preview && <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Kode tidak ditemukan atau kadaluarsa</p>}
            </div>
            {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#0F172A' }}>{loading ? 'Memproses...' : 'Gabung Tenant'}</button>
            {preview && <button type="button" onClick={copyLink} className="w-full text-xs py-1" style={{ color: '#64748B' }}>Copy link undangan</button>}
          </form>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium" style={{ color: '#334155' }}>Nama Tenant Baru</label>
              <input value={newTenantName} onChange={e => setNewTenantName(e.target.value)} placeholder="Contoh: Warung Bu Ana" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: '#CBD5E1' }} maxLength={100} />
              <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Kamu akan jadi OWNER. Invite code otomatis dibuat (berlaku 7 hari, trial 14 hari).</p>
            </div>
            {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#10B981' }}>{loading ? 'Membuat...' : 'Buat Tenant'}</button>
          </form>
        )}
        <p className="mt-4 text-xs text-center" style={{ color: '#94A3B8' }}>Sudah punya tenant? Tanya OWNER untuk kode undangan.</p>
      </div>
    </div>
  );
}
