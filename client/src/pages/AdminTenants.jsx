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

  if (isLoading) return <div className="p-6 text-sm" style={{ color: '#64748B' }}>Memuat tenants...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Super Admin — Semua Tenant</h1>
      <p className="text-xs" style={{ color: '#64748B' }}>Hanya SUPER_ADMIN bisa lihat halaman ini. Ubah status/plan/limits per tenant.</p>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ color: '#64748B' }}><th className="text-left py-2">Code</th><th className="text-left">Nama</th><th className="text-center">Plan</th><th className="text-center">Status</th><th className="text-center">Users</th><th className="text-center">Dibuat</th><th className="text-right">Aksi</th></tr></thead>
          <tbody>
            {(tenants || []).map(t => (
              <tr key={t._id} style={{ borderTop: '1px solid #F1F5F9' }}>
                <td className="py-2 font-mono text-xs">{t.code}</td>
                <td>{t.name}</td>
                <td className="text-center"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}>{t.plan}</span></td>
                <td className="text-center"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: t.status === 'ACTIVE' ? '#D1FAE5' : t.status === 'TRIAL' ? '#FEF3C7' : '#FEE2E2', color: t.status === 'ACTIVE' ? '#059669' : t.status === 'TRIAL' ? '#D97706' : '#DC2626' }}>{t.status}</span></td>
                <td className="text-center">{t.userCount ?? '-'} / {t.limits?.maxUsers}</td>
                <td className="text-center text-xs" style={{ color: '#94A3B8' }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID') : '-'}</td>
                <td className="text-right">
                  {editing === t._id ? (
                    <div className="flex flex-wrap gap-1 justify-end items-center">
                      <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="text-xs px-1 py-1 rounded border" style={{ borderColor: '#CBD5E1' }}>
                        <option>ACTIVE</option><option>TRIAL</option><option>SUSPENDED</option>
                      </select>
                      <select value={editForm.plan} onChange={e => setEditForm({ ...editForm, plan: e.target.value })} className="text-xs px-1 py-1 rounded border" style={{ borderColor: '#CBD5E1' }}>
                        <option>FREE</option><option>PRO</option><option>ENTERPRISE</option>
                      </select>
                      <input type="number" value={editForm.maxUsers} onChange={e => setEditForm({ ...editForm, maxUsers: parseInt(e.target.value) || 0 })} className="w-14 text-xs px-1 py-1 rounded border" style={{ borderColor: '#CBD5E1' }} title="maxUsers" />
                      <button onClick={() => saveMut.mutate({ id: t._id, payload: { status: editForm.status, plan: editForm.plan, limits: { maxUsers: editForm.maxUsers, maxIngredients: editForm.maxIngredients, maxRecipes: editForm.maxRecipes } } })} className="text-xs px-2 py-1 rounded text-white" style={{ backgroundColor: '#10B981' }}>Simpan</button>
                      <button onClick={() => setEditing(null)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: '#CBD5E1' }}>Batal</button>
                    </div>
                  ) : (
                    <button onClick={() => openEdit(t)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: '#CBD5E1' }}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!tenants?.length && <p className="text-xs py-6 text-center" style={{ color: '#94A3B8' }}>Belum ada tenant</p>}
      </div>
      <div className="text-xs p-3 rounded-lg" style={{ backgroundColor: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>
        Buat SUPER_ADMIN: <code>db.users.updateOne({`{email:"admin@..."} , {$set:{role:"SUPER_ADMIN"}}`})</code> lalu login ulang. Trial auto SUSPENDED tiap jam via cron.
      </div>
    </div>
  );
}
