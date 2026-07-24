import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

const fetchRecipes = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.search) query.set('search', params.search);
  if (params.sort) query.set('sort', params.sort);
  if (params.order) query.set('order', params.order);
  if (params.status) query.set('status', params.status);
  const { data } = await api.get(`/recipes?${query.toString()}`);
  return data;
};

const fetchIngredients = async () => {
  const { data } = await api.get('/ingredients?limit=100');
  return data.data;
};

const fetchUnits = async () => {
  const { data } = await api.get('/units?limit=100');
  return data.data;
};

const createRecipe = async (payload) => {
  const { data } = await api.post('/recipes', payload);
  return data.data;
};

const formatPrice = (price) =>
  `Rp ${(price ?? 0).toLocaleString('id-ID')}`;

export default function Recipes() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [items, setItems] = useState([
    { ingredient: '', unit: '', quantity: '' },
  ]);
  const [error, setError] = useState('');

  // Sort & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['recipes', { search, sort, order, page, status: statusFilter }],
    queryFn: () => fetchRecipes({ search, sort, order, page, limit, status: statusFilter }),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients-list'],
    queryFn: fetchIngredients,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units-list'],
    queryFn: fetchUnits,
  });

  const recipes = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  const mutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      setOpen(false);
      setName('');
      setItems([{ ingredient: '', unit: '', quantity: '' }]);
      setError('');
    },
    onError: (err) =>
      setError(err.response?.data?.message || 'Gagal menyimpan'),
  });

  const addRow = () =>
    setItems((p) => [...p, { ingredient: '', unit: '', quantity: '' }]);

  const updateRow = (i, f, v) =>
    setItems((p) =>
      p.map((r, idx) => (idx === i ? { ...r, [f]: v } : r))
    );

  const handleSort = (field) => {
    if (sort === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setOrder('asc');
    }
    setPage(1);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const submit = () => {
    const payload = {
      name,
      items: items
        .filter((r) => r.ingredient && r.unit)
        .map((r) => ({
          ingredient: r.ingredient,
          unit: r.unit,
          quantity: Number(r.quantity),
        })),
    };
    if (!name) {
      setError('Nama resep wajib diisi');
      return;
    }
    if (!payload.items.length) {
      setError('Minimal 1 item');
      return;
    }
    mutation.mutate(payload);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#1E293B' }}>
          Resep
        </h1>
        <button
          onClick={() => setOpen(true)}
          className="btn-primary text-sm"
        >
          + Resep Baru
        </button>
      </div>

      {/* Filter & Search */}
      <div className="card space-y-3 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari nama resep..."
              value={search}
              onChange={handleSearch}
              className="w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className="w-36"
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Tidak Aktif</option>
            </select>
            <select
              value={sort}
              onChange={(e) => handleSort(e.target.value)}
              className="w-36"
            >
              <option value="name">Nama</option>
              <option value="code">Kode</option>
              <option value="createdAt">Dibuat</option>
            </select>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-28"
            >
              <option value="asc">↑ Asc</option>
              <option value="desc">↓ Desc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('code')} className="cursor-pointer select-none">
                    Kode {sort === 'code' && (order === 'asc' ? ' ↑' : ' ↓')}
                  </th>
                  <th onClick={() => handleSort('name')} className="cursor-pointer select-none">
                    Nama {sort === 'name' && (order === 'asc' ? ' ↑' : ' ↓')}
                  </th>
                  <th onClick={() => handleSort('createdAt')} className="cursor-pointer select-none">
                    Dibuat {sort === 'createdAt' && (order === 'asc' ? ' ↑' : ' ↓')}
                  </th>
                  <th>Status</th>
                  <th className="text-right">Food Cost</th>
                </tr>
              </thead>
              <tbody>
                {recipes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8" style={{ color: '#94A3B8' }}>
                      Tidak ada resep
                    </td>
                  </tr>
                ) : (
                  recipes.map((r) => (
                    <tr key={r.id}>
                      <td className="font-medium">{r.code}</td>
                      <td>{r.name}</td>
                      <td>
                        {new Date(r.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor:
                              r.status === 'ACTIVE' ? '#D1FAE5' : '#FEF3C7',
                            color:
                              r.status === 'ACTIVE' ? '#059669' : '#D97706',
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="text-right font-semibold">
                        {formatPrice(r.foodCost)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: '#64748B' }}>
                Halaman {page} dari {pagination.totalPages} (Total: {pagination.total})
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-outline text-sm px-3"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="btn-outline text-sm px-3"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Bottom-Sheet */}
      {open && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setOpen(false)
          }
        >
          <div className="modal-box space-y-3">
            <h2
              className="font-semibold text-lg"
              style={{ color: '#1E293B' }}
            >
              Resep Baru
            </h2>

            <input
              placeholder="Nama resep"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {items.map((row, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2">
                <select
                  value={row.ingredient}
                  onChange={(e) =>
                    updateRow(i, 'ingredient', e.target.value)
                  }
                  className="flex-1 min-w-0"
                >
                  <option value="">Bahan</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} - {formatPrice(ing.lastPrice)}/{ing.unit?.symbol || 'unit'}
                    </option>
                  ))}
                </select>
                <select
                  value={row.unit}
                  onChange={(e) => updateRow(i, 'unit', e.target.value)}
                  className="flex-1 min-w-0"
                >
                  <option value="">Unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.symbol} ({u.name})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Qty"
                  value={row.quantity}
                  onChange={(e) => updateRow(i, 'quantity', e.target.value)}
                  className="flex-1 min-w-0"
                />
              </div>
            ))}

            <button
              onClick={addRow}
              className="text-sm"
              style={{ color: '#10B981' }}
            >
              + Tambah Item
            </button>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="btn-outline flex-1"
              >
                Batal
              </button>
              <button
                onClick={submit}
                disabled={mutation.isPending}
                className="btn-primary flex-1"
              >
                {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}