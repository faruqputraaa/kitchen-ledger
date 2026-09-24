import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

function getTenantId() {
  try { return JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1])).tenantId; } catch { return null; }
}

export default function TenantSettings() {
  const tenantId = getTenantId();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [msg, setMsg] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => (await api.get(`/tenants/${tenantId}`)).data.data,
    enabled: !!tenantId,
  });

  const { data: usage } = useQuery({
    queryKey: ['tenant-usage', tenantId],
    queryFn: async () => (await api.get(`/tenants/${tenantId}/usage`)).data.data,
    enabled: !!tenantId,
  });

  const { data: invite } = useQuery({
    queryKey: ['tenant-invite', tenantId],
    queryFn: async () => (await api.get(`/tenants/${tenantId}/invite-code`)).data.data,
    enabled: !!tenantId,
  });

  const { data: members } = useQuery({
    queryKey: ['tenant-members', tenantId],
    queryFn: async () => (await api.get(`/tenants/${tenantId}/members`)).data.data,
    enabled: !!tenantId,
  });

  useEffect(() => {
    if (tenant) {
      setName(tenant.name || '');
      setCurrency(tenant.settings?.currency || 'IDR');
      setTimezone(tenant.settings?.timezone || 'Asia/Jakarta');
    }
  }, [tenant]);

  const saveMut = useMutation({
    mutationFn: async () => (await api.patch(`/tenants/${tenantId}`, { name, settings: { currency, timezone } })).data,
    onSuccess: () => { setMsg('Tersimpan ✓'); qc.invalidateQueries({ queryKey: ['tenant'] }); setTimeout(() => setMsg(''), 2000); },
  });

  const rotateMut = useMutation({
    mutationFn: async () => (await api.post(`/tenants/${tenantId}/invite-code`)).data.data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant-invite'] }); setInviteMsg('Kode baru dibuat (berlaku 7 hari)'); setTimeout(() => setInviteMsg(''), 3000); },
  });

  const roleMut = useMutation({
    mutationFn: async ({ userId, role }) => (await api.patch(`/tenants/${tenantId}/members/${userId}/role`, { role })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-members'] }),
  });

  const kickMut = useMutation({
    mutationFn: async (userId) => (await api.delete(`/tenants/${tenantId}/members/${userId}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-members'] }),
  });

  const handleExport = async () => {
    const { data } = await api.get(`/tenants/${tenantId}/export`);
    const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `export-${tenant?.code || tenantId}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const inviteLink = invite?.inviteCode ? `${window.location.origin}/onboarding/invite?code=${invite.inviteCode}` : '';
  const copy = (t) => { navigator.clipboard.writeText(t); setInviteMsg('Disalin ✓'); setTimeout(() => setInviteMsg(''), 1500); };

  if (isLoading) return <div className="p-6 text-sm" style={{ color: 'var(--text-muted)' }}>Memuat...</div>;
  if (!tenant) return <div className="p-6 text-sm" style={{ color: 'var(--err)' }}>Tenant tidak ditemukan. Silakan buat tenant dulu.</div>;

  const limits = tenant.limits || {};
  const u = usage?.usage || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold" style={{ color: 'var(--heading)' }}>Tenant: {tenant.name} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>({tenant.code})</span></h1>
      <div className="flex gap-2 text-xs">
        <span className="px-2 py-1 rounded-full" style={{ backgroundColor: tenant.status === 'ACTIVE' ? 'var(--primary-light)' : tenant.status === 'TRIAL' ? 'var(--warn-bg)' : 'var(--err-bg)', color: tenant.status === 'ACTIVE' ? 'var(--primary-dark)' : tenant.status === 'TRIAL' ? 'var(--accent-dark)' : 'var(--err-dark)' }}>{tenant.status}</span>
        <span className="px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--purple-bg)', color: 'var(--purple-dark)' }}>{tenant.plan}</span>
      </div>

      {/* Usage */}
      {usage && (
        <div className="card">
          <h2 className="font-semibold mb-3" style={{ color: 'var(--heading)' }}>Usage</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><div style={{ color: 'var(--text-muted)' }}>Users</div><div className="font-bold">{u.users ?? '-'} / {limits.maxUsers}</div><div className="h-1.5 rounded-full mt-1" style={{ backgroundColor: 'var(--border)' }}><div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, ((u.users||0)/limits.maxUsers)*100)}%`, backgroundColor: 'var(--primary)' }} /></div></div>
            <div><div style={{ color: 'var(--text-muted)' }}>Bahan</div><div className="font-bold">{u.ingredients ?? '-'} / {limits.maxIngredients}</div><div className="h-1.5 rounded-full mt-1" style={{ backgroundColor: 'var(--border)' }}><div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, ((u.ingredients||0)/limits.maxIngredients)*100)}%`, backgroundColor: 'var(--warn)' }} /></div></div>
            <div><div style={{ color: 'var(--text-muted)' }}>Resep</div><div className="font-bold">{u.recipes ?? '-'} / {limits.maxRecipes}</div><div className="h-1.5 rounded-full mt-1" style={{ backgroundColor: 'var(--border)' }}><div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, ((u.recipes||0)/limits.maxRecipes)*100)}%`, backgroundColor: 'var(--purple)' }} /></div></div>
            <div><div style={{ color: 'var(--text-muted)' }}>Export</div><button onClick={handleExport} className="mt-1 text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--heading)', color: '#fff' }}>Download JSON</button></div>
          </div>
        </div>
      )}

      {/* Invite */}
      <div className="card">
        <h2 className="font-semibold mb-2" style={{ color: 'var(--heading)' }}>Kode Undangan</h2>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Bagikan kode atau link ini ke anggota. Berlaku 7 hari, bisa di-rotate.</p>
        {invite && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-widest px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--heading)' }}>{invite.inviteCode}</span>
              <button onClick={() => copy(invite.inviteCode)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border-strong)' }}>Copy kode</button>
              <button onClick={() => rotateMut.mutate()} disabled={rotateMut.isPending} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--primary)', color: 'var(--on-color)' }}>{rotateMut.isPending ? '...' : 'Rotate'}</button>
            </div>
            <div className="flex items-center gap-2">
              <input readOnly value={inviteLink} className="flex-1 text-xs px-2 py-1.5 rounded border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-alt)' }} />
              <button onClick={() => copy(inviteLink)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border-strong)' }}>Copy link</button>
            </div>
            <p className="text-xs" style={{ color: invite.expired ? 'var(--err)' : 'var(--text-muted)' }}>
              {invite.expiresAt ? `Kadaluarsa: ${new Date(invite.expiresAt).toLocaleString('id-ID')}${invite.expired ? ' — KADALUARSA' : ''}` : 'Tidak ada expiry'}
            </p>
            {inviteMsg && <p className="text-xs" style={{ color: 'var(--primary-dark)' }}>{inviteMsg}</p>}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="card">
        <h2 className="font-semibold mb-3" style={{ color: 'var(--heading)' }}>Pengaturan Tenant</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><label className="text-xs" style={{ color: 'var(--text-muted)' }}>Nama Tenant</label><input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-strong)' }} /></div>
          <div><label className="text-xs" style={{ color: 'var(--text-muted)' }}>Currency</label><input value={currency} onChange={e => setCurrency(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-strong)' }} /></div>
          <div><label className="text-xs" style={{ color: 'var(--text-muted)' }}>Timezone</label><input value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-strong)' }} /></div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="text-sm px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--chip-bg)', color: 'var(--chip-text)' }}>{saveMut.isPending ? 'Menyimpan...' : 'Simpan'}</button>
          {msg && <span className="text-xs" style={{ color: 'var(--primary-dark)' }}>{msg}</span>}
        </div>
      </div>

      {/* Members */}
      <div className="card">
        <h2 className="font-semibold mb-3" style={{ color: 'var(--heading)' }}>Anggota ({members?.length ?? 0})</h2>
        <div className="table-wrap overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ color: 'var(--text-muted)' }}><th className="text-left py-2">Nama</th><th className="text-left">Email</th><th className="text-left">Role</th><th className="text-right">Aksi</th></tr></thead>
            <tbody>
              {(members || []).map(m => (
                <tr key={m._id} style={{ borderTop: '1px solid var(--surface-hover)' }}>
                  <td className="py-2">{m.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{m.email}</td>
                  <td>
                    <select value={m.role} onChange={e => roleMut.mutate({ userId: m._id, role: e.target.value })} className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--border-strong)' }}>
                      <option value="OWNER">OWNER</option><option value="ADMIN">ADMIN</option><option value="STAFF">STAFF</option>
                    </select>
                  </td>
                  <td className="text-right">
                    <button onClick={() => { if (confirm(`Keluarkan ${m.name}?`)) kickMut.mutate(m._id); }} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--err)', backgroundColor: 'var(--err-bg)' }}>Kick</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!members?.length && <p className="text-xs py-4 text-center" style={{ color: 'var(--text-faint)' }}>Belum ada anggota</p>}
        </div>
      </div>
    </div>
  );
}
