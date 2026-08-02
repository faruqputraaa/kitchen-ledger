import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';

const scanReceipt = async (file) => {
  const formData = new FormData();
  formData.append('receipt', file);
  const { data } = await api.post('/purchases/scan-receipt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.text;
};

const fetchPurchases = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.search) query.set('search', params.search);
  if (params.sort) query.set('sort', params.sort);
  if (params.order) query.set('order', params.order);
  if (params.status) query.set('status', params.status);
  if (params.supplier) query.set('supplier', params.supplier);
  const { data } = await api.get(`/purchases?${query.toString()}`);
  return data;
};

const fetchIngredients = async () => {
  const { data } = await api.get('/ingredients?limit=100');
  return data.data;
};

const fetchSuppliers = async () => {
  const { data } = await api.get('/suppliers?limit=100');
  return data.data;
};

const createPurchase = async (payload) => {
  const { data } = await api.post('/purchases', payload);
  return data.data;
};

const formatPrice = (price) =>
  `Rp ${(price ?? 0).toLocaleString('id-ID')}`;

export default function Purchases() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [items, setItems] = useState([
    { ingredient: '', quantity: '', unitPrice: '' },
  ]);
  const [error, setError] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Sort & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [sort, setSort] = useState('purchaseDate');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', { search, sort, order, page, status: statusFilter, supplier: supplierFilter }],
    queryFn: () => fetchPurchases({ search, sort, order, page, limit, status: statusFilter, supplier: supplierFilter }),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients-list'],
    queryFn: fetchIngredients,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: fetchSuppliers,
  });

  const purchases = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  const mutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      setOpen(false);
      setItems([{ ingredient: '', quantity: '', unitPrice: '' }]);
      setSupplier('');
      setError('');
    },
    onError: (err) =>
      setError(err.response?.data?.message || 'Gagal menyimpan'),
  });

  const addRow = () =>
    setItems((p) => [...p, { ingredient: '', quantity: '', unitPrice: '' }]);

  const updateRow = (i, f, v) =>
    setItems((p) =>
      p.map((r, idx) => (idx === i ? { ...r, [f]: v } : r))
    );

  const handleSort = (field) => {
    if (sort === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setOrder('desc');
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

  const handleSupplierFilter = (e) => {
    setSupplierFilter(e.target.value);
    setPage(1);
  };

  const submit = () => {
    const payload = {
      supplier: supplier || null,
      items: items
        .filter((r) => r.ingredient)
        .map((r) => ({
          ingredient: r.ingredient,
          quantity: Number(r.quantity),
          unitPrice: Number(r.unitPrice),
        })),
    };
    if (!payload.items.length) {
      setError('Minimal 1 item');
      return;
    }
    mutation.mutate(payload);
  };

  const handleOcrFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setError('');
    try {
      const text = await scanReceipt(file);
      if (text) {
        // Simple parsing: split lines, look for patterns like "item qty price"
        // For now just alert the text - user can copy manually
        alert('OCR Result:\n\n' + text + '\n\nSilakan copy-paste manual ke item.');
      } else {
        setError('Tidak ada teks terbaca dari gambar.');
      }
    } catch (err) {
      setError('Gagal scan: ' + (err.response?.data?.message || err.message));
    } finally {
      setOcrLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#1E293B' }}>
          Pembelian
        </h1>
        <button
          onClick={() => setOpen(true)}
          className="btn-primary text-sm"
        >
          + Pembelian Baru
        </button>
      </div>

      {/* Filter & Search */}
      <div className="card space-y-3 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari kode/note..."
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
              <option value="DRAFT">Draft</option>
              <option value="ORDERED">Ordered</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={supplierFilter}
              onChange={handleSupplierFilter}
              className="w-40"
            >
              <option value="">Semua Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => handleSort(e.target.value)}
              className="w-36"
            >
              <option value="purchaseDate">Tanggal</option>
              <option value="code">Kode</option>
              <option value="totalAmount">Total</option>
            </select>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-28"
            >
              <option value="desc">↓ Desc</option>
              <option value="asc">↑ Asc</option>
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
                  <th>Supplier</th>
                  <th onClick={() => handleSort('purchaseDate')} className="cursor-pointer select-none">
                    Tanggal {sort === 'purchaseDate' && (order === 'asc' ? ' ↑' : ' ↓')}
                  </th>
                  <th>Status</th>
                  <th onClick={() => handleSort('totalAmount')} className="cursor-pointer select-none text-right">
                    Total {sort === 'totalAmount' && (order === 'asc' ? ' ↑' : ' ↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8" style={{ color: '#94A3B8' }}>
                      Tidak ada pembelian
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/purchases/${p.id}`)}>
                      <td className="font-medium">{p.code}</td>
                      <td>{p.supplier?.name || '-'}</td>
                      <td>
                        {new Date(p.purchaseDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor:
                              p.status === 'COMPLETED' ? '#D1FAE5' : p.status === 'ORDERED' ? '#DBEAFE' : p.status === 'CANCELLED' ? '#FEE2E2' : '#FEF3C7',
                            color:
                              p.status === 'COMPLETED' ? '#059669' : p.status === 'ORDERED' ? '#2563EB' : p.status === 'CANCELLED' ? '#DC2626' : '#D97706',
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="text-right font-semibold">
                        {formatPrice(p.totalAmount)}
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
              Pembelian Baru
            </h2>

            <div style={{ marginBottom: '8px' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleOcrFile}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading}
                className="btn-outline text-sm w-full"
              >
                {ocrLoading ? 'Memindai...' : '📷 Scan Nota'}
              </button>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>
                Supplier <span style={{ color: '#94A3B8', fontWeight: 'normal' }}>(opsional)</span>
              </label>
              <select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              >
                <option value="">Tanpa Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

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
                      {ing.name} ({ing.unit?.symbol || ''}) - {formatPrice(ing.lastPrice)}/{ing.unit?.symbol || 'unit'}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Qty"
                  value={row.quantity}
                  onChange={(e) =>
                    updateRow(i, 'quantity', e.target.value)
                  }
                  className="flex-1 min-w-0"
                />
                <input
                  type="number"
                  placeholder="Harga"
                  value={row.unitPrice}
                  onChange={(e) =>
                    updateRow(i, 'unitPrice', e.target.value)
                  }
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