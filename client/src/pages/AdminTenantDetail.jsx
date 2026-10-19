import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';

export default function AdminTenantDetail() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [tab, setTab] = useState('summary');

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['admin-tenant-detail', tenantId],
    queryFn: async () => (await api.get(`/tenants/${tenantId}/export`)).data.data,
    enabled: !!tenantId,
  });

  if (isLoading) return <div className="p-6 text-sm" style={{ color: 'var(--text-muted)' }}>Memuat data tenant...</div>;
  if (!tenant) return <div className="p-6 text-sm" style={{ color: 'var(--text-muted)' }}>Tenant tidak ditemukan</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--heading)' }}>Detail Tenant: {tenant.tenant.code}</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tenant.tenant.name} — {isSuperAdmin ? 'Super Admin View' : 'Tenant View'}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/tenants" className="text-xs px-3 py-1.5 rounded border" style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}>Kembali</Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-3">
          <div className="text-xs text-muted">Users</div>
          <div className="text-lg font-bold">{tenant.users?.length ?? 0}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-muted">Ingredients</div>
          <div className="text-lg font-bold">{tenant.ingredients?.length ?? 0}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-muted">Recipes</div>
          <div className="text-lg font-bold">{tenant.recipes?.length ?? 0}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-muted">Purchases</div>
          <div className="text-lg font-bold">{tenant.purchases?.length ?? 0}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-1">
        <button onClick={() => setTab('summary')} className={`px-3 py-1.5 text-xs border-b-2 ${tab === 'summary' ? 'border-primary text-primary font-bold' : 'text-muted'}`}>Ringkasan</button>
        <button onClick={() => setTab('users')} className={`px-3 py-1.5 text-xs border-b-2 ${tab === 'users' ? 'border-primary text-primary font-bold' : 'text-muted'}`}>Users</button>
        <button onClick={() => setTab('ingredients')} className={`px-3 py-1.5 text-xs border-b-2 ${tab === 'ingredients' ? 'border-primary text-primary font-bold' : 'text-muted'}`}>Ingredients</button>
        <button onClick={() => setTab('recipes')} className={`px-3 py-1.5 text-xs border-b-2 ${tab === 'recipes' ? 'border-primary text-primary font-bold' : 'text-muted'}`}>Recipes</button>
        <button onClick={() => setTab('purchases')} className={`px-3 py-1.5 text-xs border-b-2 ${tab === 'purchases' ? 'border-primary text-primary font-bold' : 'text-muted'}`}>Pembelian</button>
      </div>

      {/* Tab content */}
      <div className="card overflow-x-auto">
        {tab === 'summary' && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="text-left py-2">Field</th><th className="text-left py-2">Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: '1px solid var(--surface-hover)' }}>
                <td className="py-2 font-mono text-xs">Code</td><td className="py-2">{tenant.tenant.code}</td>
              </tr>
              <tr style={{ borderTop: '1px solid var(--surface-hover)' }}>
                <td className="py-2 font-mono text-xs">Nama</td><td className="py-2">{tenant.tenant.name}</td>
              </tr>
              <tr style={{ borderTop: '1px solid var(--surface-hover)' }}>
                <td className="py-2 font-mono text-xs">Diekspor pada</td><td className="py-2">{tenant.exportedAt ? new Date(tenant.exportedAt).toLocaleString('id-ID') : '-'}</td>
              </tr>
            </tbody>
          </table>
        )}
        {tab === 'users' && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="text-left py-2">Code</th><th className="text-left">Nama</th><th className="text-left">Email</th><th className="text-center">Role</th>
              </tr>
            </thead>
            <tbody>
              {(tenant.users || []).map(u => (
                <tr key={u.code} style={{ borderTop: '1px solid var(--surface-hover)' }}>
                  <td className="py-2 font-mono text-xs">{u.code}</td>
                  <td className="py-2">{u.name}</td>
                  <td className="py-2">{u.email}</td>
                  <td className="py-2 text-center capitalize">{u.role}</td>
                </tr>
              ))}
              {!tenant.users?.length && <tr><td colSpan="4" className="py-6 text-center text-xs" style={{ color: 'var(--text-faint)' }}>Belum ada user</td></tr>}
            </tbody>
          </table>
        )}
        {tab === 'ingredients' && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="text-left py-2">Code</th><th className="text-left">Nama</th>
              </tr>
            </thead>
            <tbody>
              {(tenant.ingredients || []).map(i => (
                <tr key={i.code} style={{ borderTop: '1px solid var(--surface-hover)' }}>
                  <td className="py-2 font-mono text-xs">{i.code}</td>
                  <td className="py-2">{i.name}</td>
                </tr>
              ))}
              {!tenant.ingredients?.length && <tr><td colSpan="2" className="py-6 text-center text-xs" style={{ color: 'var(--text-faint)' }}>Belum ada ingredient</td></tr>}
            </tbody>
          </table>
        )}
        {tab === 'recipes' && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="text-left py-2">Code</th><th className="text-left">Nama</th>
              </tr>
            </thead>
            <tbody>
              {(tenant.recipes || []).map(r => (
                <tr key={r.code} style={{ borderTop: '1px solid var(--surface-hover)' }}>
                  <td className="py-2 font-mono text-xs">{r.code}</td>
                  <td className="py-2">{r.name}</td>
                </tr>
              ))}
              {!tenant.recipes?.length && <tr><td colSpan="2" className="py-6 text-center text-xs" style={{ color: 'var(--text-faint)' }}>Belum ada resep</td></tr>}
            </tbody>
          </table>
        )}
        {tab === 'purchases' && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="text-left py-2">Code</th><th className="text-left">Tanggal</th><th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(tenant.purchases || []).map(p => (
                <tr key={p.code} style={{ borderTop: '1px solid var(--surface-hover)' }}>
                  <td className="py-2 font-mono text-xs">{p.code}</td>
                  <td className="py-2">{p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="py-2 text-right">{p.total ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(p.total) : '-'}</td>
                </tr>
              ))}
              {!tenant.purchases?.length && <tr><td colSpan="3" className="py-6 text-center text-xs" style={{ color: 'var(--text-faint)' }}>Belum ada pembelian</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
