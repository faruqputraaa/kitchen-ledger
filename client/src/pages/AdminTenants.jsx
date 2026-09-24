import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

export default function AdminTenants() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'ACTIVE', plan: 'FREE', maxUsers: 10, maxIngredients: 1000, maxRecipes: 500 });

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => (await api.get('/tenants')).data.data,
  });

  const saveMut = useMutation({
    mutationFn: async ({ id, payload }) => (await api.patch(`/tenants/${id}/status`, payload)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tenants'] }); setEditing(null); },
  });

  const openEdit = (t) => {
    setEditing(t._id);
    setEditForm({ status: t.status, plan: t.plan, maxUsers: t.limits?.maxUsers ?? 10, maxIngredients: t.limits?.maxIngredients ?? 1000, maxRecipes: t.limits?.maxRecipes ?? 500 });
  };

  if (isLoading) return <div className="p-6 text-sm" style={{ color: 'var(--text-muted)' }}>Memuat tenants...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-xl font-bold" style={{ color: 'var(--heading)' }}>Super Admin — Semua Tenant</h1>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hanya SUPER_ADMIN bisa lihat halaman ini. Ubah status/plan/limits per tenant.</p>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ color: 'var(--text-muted)' }}><th className="text-left py-2">Code</th><th className="text-left">Nama</th><th className="text-center">Plan</th><th className="text-center">Status</th><th className="text-center">Users</th><th className="text-center">Dibuat</th><th className="text-right">Aksi</th></tr></thead>
          <tbody>
            {(tenants || []).map(t => (
              <tr key={t._id} style={{ borderTop: '1px solid var(--surface-hover)' }}>
                <td className="py-2 font-mono text-xs">{t.code}</td>
                <td>{t.name}</td>
                <td className="text-center"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--purple-bg)', color: 'var(--purple-dark)' }}>{t.plan}</span></td>
                <td className="text-center"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: t.status === 'ACTIVE' ? 'var(--primary-light)' : t.status === 'TRIAL' ? 'var(--warn-bg)' : 'var(--err-bg)', color: t.status === 'ACTIVE' ? 'var(--primary-dark)' : t.status === 'TRIAL' ? 'var(--accent-dark)' : 'var(--err-dark)' }}>{t.status}</span></td>
                <td className="text-center">{t.userCount ?? '-'} / {t.limits?.maxUsers}</td>
                <td className="text-center text-xs" style={{ color: 'var(--text-faint)' }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID') : '-'}</td>
                <td className="text-right">
                  {editing === t._id ? (
                    <div className="flex flex-wrap gap-1 justify-end items-center">
                      <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="text-xs px-1 py-1 rounded border" style={{ borderColor: 'var(--border-strong)' }}>
                        <option>ACTIVE</option><option>TRIAL</option><option>SUSPENDED</option>
                      </select>
                      <select value={editForm.plan} onChange={e => setEditForm({ ...editForm, plan: e.target.value })} className="text-xs px-1 py-1 rounded border" style={{ borderColor: 'var(--border-strong)' }}>
                        <option>FREE</option><option>PRO</option><option>ENTERPRISE</option>
                      </select>
                      <input type="number" value={editForm.maxUsers} onChange={e => setEditForm({ ...editForm, maxUsers: parseInt(e.target.value) || 0 })} className="w-14 text-xs px-1 py-1 rounded border" style={{ borderColor: 'var(--border-strong)' }} title="maxUsers" />
                      <button onClick={() => saveMut.mutate({ id: t._id, payload: { status: editForm.status, plan: editForm.plan, limits: { maxUsers: editForm.maxUsers, maxIngredients: editForm.maxIngredients, maxRecipes: editForm.maxRecipes } } })} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--primary)', color: 'var(--on-color)' }}>Simpan</button>
                      <button onClick={() => setEditing(null)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--border-strong)' }}>Batal</button>
                    </div>
                  ) : (
                    <button onClick={() => openEdit(t)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--border-strong)' }}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!tenants?.length && <p className="text-xs py-6 text-center" style={{ color: 'var(--text-faint)' }}>Belum ada tenant</p>}
      </div>
      <div className="text-xs p-3 rounded-lg" style={{ backgroundColor: 'var(--hint-bg)', color: 'var(--hint-text)', border: '1px solid var(--hint-border)' }}>
        Buat SUPER_ADMIN: <code>db.users.updateOne({`{email:"admin@..."} , {$set:{role:"SUPER_ADMIN"}}`})</code> lalu login ulang. Trial auto SUSPENDED tiap jam via cron.
      </div>
    </div>
  );
}
