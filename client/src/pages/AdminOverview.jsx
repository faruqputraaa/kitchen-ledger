import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';

const fetchTenants = async () => {
  const { data } = await api.get('/tenants');
  return data.data || [];
};

const fetchPurchases = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.supplier) query.set('supplier', params.supplier);
  const { data } = await api.get(`/purchases?${query.toString()}`);
  return data;
};

const fetchIngredients = async () => {
  const { data } = await api.get('/ingredients?limit=500');
  return data.data || [];
};

const fetchRecipes = async () => {
  const { data } = await api.get('/recipes?limit=500');
  return data.data || [];
};

const fetchMenus = async () => {
  const { data } = await api.get('/menus?limit=500');
  return data.data || [];
};

const fetchSuppliers = async () => {
  const { data } = await api.get('/suppliers?limit=500');
  return data.data || [];
};

const formatPrice = (price) => `Rp ${(price ?? 0).toLocaleString('id-ID')}`;
const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};
const statusBadge = (status) => {
  const style = {
    COMPLETED: { bg: 'var(--primary-light)', fg: 'var(--primary-dark)' },
    ORDERED: { bg: 'var(--info-bg)', fg: 'var(--info-dark)' },
    CANCELLED: { bg: 'var(--err-bg)', fg: 'var(--err-dark)' },
    DRAFT: { bg: 'var(--warn-bg)', fg: 'var(--accent-dark)' },
  }[status] || { bg: 'var(--surface-hover)', fg: 'var(--text-muted)' };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: style.bg, color: style.fg }}>
      {status}
    </span>
  );
};

export default function AdminOverview() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('purchases');

  const [tpSearch, setTpSearch] = useState('');
  const [tpStatus, setTpStatus] = useState('');
  const [tpSupplier, setTpSupplier] = useState('');
  const [tpTenant, setTpTenant] = useState('');
  const [tpSort, setTpSort] = useState('purchaseDate');
  const [tpOrder, setTpOrder] = useState('desc');
  const [tpPage, setTpPage] = useState(1);
  const limit = 20;

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: fetchTenants,
  });

  const tenantMap = {};
  tenants.forEach((t) => { tenantMap[t._id] = t; });

  const tenantLabel = (tenantId) => {
    const t = tenantMap[tenantId];
    return t ? `${t.code} — ${t.name}` : '-';
  };

  // ---------- Purchases ----------
  const { data: pData, isLoading: pLoading } = useQuery({
    queryKey: ['admin-purchases', { tpSearch, tpStatus, tpSupplier, tpTenant, tpSort, tpOrder, tpPage }],
    queryFn: () => fetchPurchases({ search: tpSearch, status: tpStatus, supplier: tpSupplier, sort: tpSort, order: tpOrder, page: tpPage, limit }),
  });
  const allPurchases = pData?.data || [];
  const pagination = pData?.pagination || { total: 0, totalPages: 1 };
  const purchases = tpTenant ? allPurchases.filter((p) => p.tenantId === tpTenant) : allPurchases;

  const handleSort = (field) => {
    setTpSort(field);
    setTpOrder((o) => (tpSort === field && o === 'asc' ? 'desc' : 'desc'));
    setTpPage(1);
  };

  // ---------- Ingredients ----------
  const { data: ingredients = [], isLoading: iLoading } = useQuery({
    queryKey: ['admin-ingredients'],
    queryFn: fetchIngredients,
  });
  const filteredIngredients = tpTenant ? ingredients.filter((i) => i.tenantId === tpTenant) : ingredients;

  // ---------- Recipes ----------
  const { data: recipes = [], isLoading: rLoading } = useQuery({
    queryKey: ['admin-recipes'],
    queryFn: fetchRecipes,
  });
  const filteredRecipes = tpTenant ? recipes.filter((r) => r.tenantId === tpTenant) : recipes;

  // ---------- Menus ----------
  const { data: menus = [], isLoading: mLoading } = useQuery({
    queryKey: ['admin-menus'],
    queryFn: fetchMenus,
  });
  const filteredMenus = tpTenant ? menus.filter((mn) => mn.tenantId === tpTenant) : menus;

  // ---------- Suppliers ----------
  const { data: suppliers = [], isLoading: sLoading } = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: fetchSuppliers,
  });
  const filteredSuppliers = tpTenant ? suppliers.filter((s) => s.tenantId === tpTenant) : suppliers;

  if (tenantsLoading) {
    return <div className="p-6 text-sm" style={{ color: 'var(--text-muted)' }}>Memuat tenant...</div>;
  }

  const tabs = [
    { key: 'purchases', label: 'Pembelian' },
    { key: 'ingredients', label: 'Bahan' },
    { key: 'recipes', label: 'Resep' },
    { key: 'menus', label: 'Menu' },
    { key: 'suppliers', label: 'Supplier' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--heading)' }}>Super Admin — Overview Semua Tenant</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Lihat semua data dari semua tenant. Setiap baris dilengkapi kolom Tenant.
          </p>
        </div>
        <Link to="/admin/tenants" className="text-xs px-3 py-1.5 rounded border" style={{ borderColor: 'var(--border-strong)', color: 'var(--primary)' }}>
          Kelola Tenant
        </Link>
      </div>

      {/* Tenant filter */}
      <div className="card p-3">
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Filter Tenant</label>
          <select value={tpTenant} onChange={(e) => { setTpTenant(e.target.value); setTpPage(1); }} className="w-48 text-xs">
            <option value="">Semua Tenant</option>
            {tenants.map((t) => (
              <option key={t._id} value={t._id}>
                {t.code} — {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs border-b-2 ${tab === t.key ? 'border-primary text-primary font-bold' : 'text-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card overflow-x-auto">
        {tab === 'purchases' && (
          <>
            <div className="p-3 border-b border-surface-hover">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Cari kode/note..."
                    value={tpSearch}
                    onChange={(e) => { setTpSearch(e.target.value); setTpPage(1); }}
                    className="w-full text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <select value={tpStatus} onChange={(e) => { setTpStatus(e.target.value); setTpPage(1); }} className="w-32 text-xs">
                    <option value="">Semua Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ORDERED">Ordered</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <select value={tpSort} onChange={(e) => handleSort(e.target.value)} className="w-32 text-xs">
                    <option value="purchaseDate">Tanggal</option>
                    <option value="code">Kode</option>
                    <option value="totalAmount">Total</option>
                  </select>
                  <select value={tpOrder} onChange={(e) => setTpOrder(e.target.value)} className="w-24 text-xs">
                    <option value="desc">↓ Desc</option>
                    <option value="asc">↑ Asc</option>
                  </select>
                </div>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th onClick={() => handleSort('code')} className="cursor-pointer select-none text-left py-2">
                    Kode {tpSort === 'code' && (tpOrder === 'asc' ? ' ↑' : ' ↓')}
                  </th>
                  <th className="text-left py-2">Tenant</th>
                  <th className="text-left py-2">Supplier</th>
                  <th onClick={() => handleSort('purchaseDate')} className="cursor-pointer select-none text-left py-2">
                    Tanggal {tpSort === 'purchaseDate' && (tpOrder === 'asc' ? ' ↑' : ' ↓')}
                  </th>
                  <th className="text-left py-2">Dibeli Oleh</th>
                  <th className="text-center py-2">Status</th>
                  <th onClick={() => handleSort('totalAmount')} className="cursor-pointer select-none text-right py-2">
                    Total {tpSort === 'totalAmount' && (tpOrder === 'asc' ? ' ↑' : ' ↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8" style={{ color: 'var(--text-faint)' }}>Tidak ada pembelian</td></tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.code} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/purchases/${p.id}`)}>
                      <td className="py-2 font-mono text-xs">{p.code}</td>
                      <td className="py-2 text-sm">{tenantLabel(p.tenantId)}</td>
                      <td className="py-2">{p.supplier?.name || '-'}</td>
                      <td className="py-2">{formatDate(p.purchaseDate)}</td>
                      <td className="py-2">{p.createdBy?.name || '-'}</td>
                      <td className="py-2 text-center">{statusBadge(p.status)}</td>
                      <td className="py-2 text-right font-semibold">{formatPrice(p.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {pagination.totalPages > 1 && (
              <div className="p-3 flex items-center justify-between border-t border-surface-hover">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Halaman {tpPage} dari {pagination.totalPages} (Total: {pagination.total})
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setTpPage((p) => Math.max(1, p - 1))} disabled={tpPage === 1} className="btn-outline text-xs px-3 py-1">
                    Prev
                  </button>
                  <button onClick={() => setTpPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={tpPage === pagination.totalPages} className="btn-outline text-xs px-3 py-1">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'ingredients' && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="text-left py-2">Kode</th>
                <th className="text-left py-2">Nama</th>
                <th className="text-left py-2">Tenant</th>
                <th className="text-left py-2">Kategori</th>
                <th className="text-left py-2">Unit</th>
                <th className="text-right py-2">Stok Saat Ini</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8" style={{ color: 'var(--text-faint)' }}>Tidak ada bahan</td></tr>
              ) : (
                filteredIngredients.map((i) => (
                  <tr key={i.code} className="border-t border-surface-hover">
                    <td className="py-2 font-mono text-xs">{i.code}</td>
                    <td className="py-2">{i.name}</td>
                    <td className="py-2 text-sm">{tenantLabel(i.tenantId)}</td>
                    <td className="py-2">{i.category?.name || '-'}</td>
                    <td className="py-2">{i.unit?.symbol || '-'}</td>
                    <td className="py-2 text-right">{i.currentStock ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tab === 'recipes' && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="text-left py-2">Kode</th>
                <th className="text-left py-2">Nama</th>
                <th className="text-left py-2">Tenant</th>
                <th className="text-right py-2">Food Cost</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecipes.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8" style={{ color: 'var(--text-faint)' }}>Tidak ada resep</td></tr>
              ) : (
                filteredRecipes.map((r) => (
                  <tr key={r.code} className="border-t border-surface-hover">
                    <td className="py-2 font-mono text-xs">{r.code}</td>
                    <td className="py-2">{r.name}</td>
                    <td className="py-2 text-sm">{tenantLabel(r.tenantId)}</td>
                    <td className="py-2 text-right">{formatPrice(r.foodCost ?? 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tab === 'menus' && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="text-left py-2">Kode</th>
                <th className="text-left py-2">Nama / Resep</th>
                <th className="text-left py-2">Tenant</th>
                <th className="text-right py-2">Harga Jual</th>
                <th className="text-center py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMenus.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--text-faint)' }}>Tidak ada menu</td></tr>
              ) : (
                filteredMenus.map((mn) => (
                  <tr key={mn.code} className="border-t border-surface-hover">
                    <td className="py-2 font-mono text-xs">{mn.code}</td>
                    <td className="py-2">{mn.recipe?.name || mn.name || '-'}</td>
                    <td className="py-2 text-sm">{tenantLabel(mn.tenantId)}</td>
                    <td className="py-2 text-right">{formatPrice(mn.sellingPrice ?? 0)}</td>
                    <td className="py-2 text-center">{statusBadge(mn.status || 'ACTIVE')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tab === 'suppliers' && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="text-left py-2">Kode</th>
                <th className="text-left py-2">Nama</th>
                <th className="text-left py-2">Tenant</th>
                <th className="text-left py-2">Kontak</th>
                <th className="text-left py-2">Telepon</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--text-faint)' }}>Tidak ada supplier</td></tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s.code} className="border-t border-surface-hover">
                    <td className="py-2 font-mono text-xs">{s.code}</td>
                    <td className="py-2">{s.name}</td>
                    <td className="py-2 text-sm">{tenantLabel(s.tenantId)}</td>
                    <td className="py-2">{s.contactPerson || '-'}</td>
                    <td className="py-2">{s.phone || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
