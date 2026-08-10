import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';

const OCR_API_URL = '/ocr';

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

const fetchUnits = async () => {
  const { data } = await api.get('/units?limit=100');
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
  const [supplierText, setSupplierText] = useState('');
  const [items, setItems] = useState([
    { ingredient: '', ingredientText: '', quantity: '', unitPrice: '', unit: '' },
  ]);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [ocrData, setOcrData] = useState(null);

  // Cleanup preview on close
  const [submitting, setSubmitting] = useState(false);

  const closeModal = () => {
    setOpen(false);
    if (previewImage) { URL.revokeObjectURL(previewImage); setPreviewImage(null); }
    setSupplierText('');
    setItems([{ ingredient: '', ingredientText: '', quantity: '', unitPrice: '', unit: '' }]);
    setError('');
  };

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

  const { data: units = [] } = useQuery({
    queryKey: ['units-list'],
    queryFn: fetchUnits,
  });

  const purchases = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  const mutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      setOpen(false);
      setItems([{ ingredient: '', ingredientText: '', quantity: '', unitPrice: '', unit: '' }]);
      setSupplier('');
      setSupplierText('');
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Gagal menyimpan'),
  });

  const addRow = () => setItems((p) => [...p, { ingredient: '', ingredientText: '', quantity: '', unitPrice: '', unit: '' }]);

  const updateRow = (i, f, v) =>
    setItems((p) => p.map((r, idx) => (idx === i ? { ...r, [f]: v } : r)));

  const handleSort = (field) => {
    setSort(field);
    setOrder((o) => (sort === field && o === 'asc' ? 'desc' : 'desc'));
    setPage(1);
  };

  // Ingredient/supplier creation helpers
  const fetchCategories = async () => {
    const { data } = await api.get('/categories?limit=100');
    return data.data;
  };
  const { data: categories = [] } = useQuery({
    queryKey: ['categories-list'],
    queryFn: fetchCategories,
  });

  const ensureIngredient = async (name) => {
    if (!name.trim()) return '';
    const match = ingredients.find(ing => ing.name.toLowerCase() === name.toLowerCase());
    if (match) return match.id;
    const unitId = units[0]?.id;
    const categoryId = categories[0]?.id;
    if (!unitId || !categoryId) return null;
    const res = await api.post('/ingredients', {
      name: name.trim(),
      unit: unitId,
      category: categoryId,
      minimumStock: 0,
      notes: 'Auto-created from purchase'
    });
    qc.invalidateQueries({ queryKey: ['ingredients-list'] });
    return res.data?.data?.id || null;
  };

  const ensureSupplier = async (name) => {
    if (!name.trim()) return '';
    const match = suppliers.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (match) return match.id;
    await api.post('/suppliers', { name: name.trim(), notes: 'Auto-created from purchase' });
    qc.invalidateQueries({ queryKey: ['suppliers-list'] });
    // Find by name after creation
    const res = await fetchSuppliers();
    const found = res.find(s => s.name.toLowerCase() === name.toLowerCase());
    return found?.id || '';
  };

  const setItemIngredient = async (i, text) => {
    updateRow(i, 'ingredientText', text);
    const match = ingredients.find(ing => ing.name.toLowerCase() === text.toLowerCase());
    if (match) {
      updateRow(i, 'ingredient', match.id);
      if (match.unit) updateRow(i, 'unit', match.unit.symbol || '');
    } else {
      updateRow(i, 'ingredient', '');
    }
  };

  const setSupplierField = async (text) => {
    setSupplierText(text);
    const match = suppliers.find(s => s.name.toLowerCase() === text.toLowerCase());
    if (match) setSupplier(match.id);
    else setSupplier('');
  };

  const handleScanReceipt = async (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setPreviewImage(preview);
    setScanning(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(OCR_API_URL, { method: 'POST', body: formData });
      const data = await res.json();

      if (data.error) { setError(data.error); return; }

      setOcrData(data);

      if (data.supplier_name) {
        const sId = await ensureSupplier(data.supplier_name);
        if (sId) { setSupplier(sId); setSupplierText(data.supplier_name); }
      }

      if (data.items?.length) {
        const newItems = [];
        for (const item of data.items) {
          const itemName = typeof item.name === 'string' ? item.name : String(item.name || '');
          const ingId = await ensureIngredient(itemName);
          newItems.push({
            ingredient: ingId,
            ingredientText: itemName,
            quantity: item.quantity || 1,
            unitPrice: item.unit_price || 0,
            unit: ingId ? (units.find(u => ingredients.find(ing => ing.id === ingId)?.unit === u.id)?.symbol || '') : '',
          });
        }
        setItems(newItems);
      }
    } catch (err) {
      setError('Gagal scan: ' + err.message);
    } finally {
      setScanning(false);
      e.target.value = '';
    }
  };

  const submit = async () => {
    setSubmitting(true);
    // Resolve ingredient names to IDs
    const resolvedItems = [];
    for (const r of items) {
      let ingId = r.ingredient;
      if (!ingId && r.ingredientText.trim()) {
        ingId = await ensureIngredient(r.ingredientText);
      }
      if (!ingId) continue;
      resolvedItems.push({
        ingredient: ingId,
        quantity: Number(r.quantity),
        unitPrice: Number(r.unitPrice),
      });
    }
    if (!resolvedItems.length) { setError('Minimal 1 item'); setSubmitting(false); return; }

    let supplierId = supplier;
    if (!supplierId && supplierText.trim()) {
      supplierId = await ensureSupplier(supplierText);
    }

    mutation.mutate({ supplier: supplierId || null, items: resolvedItems });
    setSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#1E293B' }}>Pembelian</h1>
        <button onClick={() => setOpen(true)} className="btn-primary text-sm">+ Pembelian Baru</button>
      </div>

      <div className="card space-y-3 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input type="text" placeholder="Cari kode/note..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-36">
              <option value="">Semua Status</option>
              <option value="DRAFT">Draft</option><option value="ORDERED">Ordered</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option>
            </select>
            <select value={supplierFilter} onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }} className="w-40">
              <option value="">Semua Supplier</option>
              {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
            <select value={sort} onChange={(e) => handleSort(e.target.value)} className="w-36">
              <option value="purchaseDate">Tanggal</option><option value="code">Kode</option><option value="totalAmount">Total</option>
            </select>
            <select value={order} onChange={(e) => setOrder(e.target.value)} className="w-28">
              <option value="desc">↓ Desc</option><option value="asc">↑ Asc</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-14 w-full" />)}</div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('code')} className="cursor-pointer select-none">Kode {sort === 'code' && (order === 'asc' ? ' ↑' : ' ↓')}</th>
                  <th>Supplier</th>
                  <th onClick={() => handleSort('purchaseDate')} className="cursor-pointer select-none">Tanggal {sort === 'purchaseDate' && (order === 'asc' ? ' ↑' : ' ↓')}</th>
                  <th>Status</th>
                  <th onClick={() => handleSort('totalAmount')} className="cursor-pointer select-none text-right">Total {sort === 'totalAmount' && (order === 'asc' ? ' ↑' : ' ↓')}</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8" style={{ color: '#94A3B8' }}>Tidak ada pembelian</td></tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/purchases/${p.id}`)}>
                      <td className="font-medium">{p.code}</td>
                      <td>{p.supplier?.name || '-'}</td>
                      <td>{new Date(p.purchaseDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: p.status === 'COMPLETED' ? '#D1FAE5' : p.status === 'ORDERED' ? '#DBEAFE' : p.status === 'CANCELLED' ? '#FEE2E2' : '#FEF3C7', color: p.status === 'COMPLETED' ? '#059669' : p.status === 'ORDERED' ? '#2563EB' : p.status === 'CANCELLED' ? '#DC2626' : '#D97706' }}>{p.status}</span>
                      </td>
                      <td className="text-right font-semibold">{formatPrice(p.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: '#64748B' }}>Halaman {page} dari {pagination.totalPages} (Total: {pagination.total})</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline text-sm px-3">Prev</button>
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="btn-outline text-sm px-3">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box space-y-3">
            <h2 className="font-semibold text-lg" style={{ color: '#1E293B' }}>Pembelian Baru</h2>

            <div className="mb-3">
              <label className="cursor-pointer block w-full px-3 py-2 rounded border" style={{ borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10B981' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium flex-1" style={{ color: '#10B981' }}>Scan Nota</span>
                  {scanning && <span className="text-xs animate-pulse" style={{ color: '#94A3B8' }}>Memproses...</span>}
                </div>
                <input type="file" accept="image/*" onChange={handleScanReceipt} disabled={scanning} className="hidden" id="scan-receipt-input" />
              </label>
              <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Pilih foto nota belanja untuk auto-isi form</p>
            </div>

            {previewImage && (
              <div className="mb-3 relative">
                <img src={previewImage} alt="Preview nota" className="max-h-64 w-auto rounded border" style={{ borderColor: '#E2E8F0' }} />
                <button type="button" onClick={() => { URL.revokeObjectURL(previewImage); setPreviewImage(null); }} className="absolute top-2 right-2 p-1 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>×</button>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>Supplier <span style={{ color: '#94A3B8', fontWeight: 'normal' }}>(opsional — ketik nama, otomatis dibuat jika baru)</span></label>
              <input type="text" list="supplier-list" value={supplierText} onChange={(e) => setSupplierField(e.target.value)} placeholder="Nama supplier..." className="w-full" />
              <datalist id="supplier-list">
                {suppliers.map((s) => (<option key={s.id} value={s.name} />))}
              </datalist>
            </div>

            {items.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_100px_80px_40px] gap-3 mb-3 items-start">
                <div className="min-w-0">
                  <input type="text" list={`ingredient-list-${i}`} value={row.ingredientText} onChange={(e) => setItemIngredient(i, e.target.value)} placeholder="Nama bahan..." className="w-full" />
                  <datalist id={`ingredient-list-${i}`}>
                    {ingredients.map((ing) => (<option key={ing.id} value={ing.name} />))}
                  </datalist>
                  {row.unit && <span className="text-xs" style={{ color: '#94A3B8' }}>Default: {row.unit}</span>}
                </div>
                <input type="number" placeholder="Qty" value={row.quantity} onChange={(e) => updateRow(i, 'quantity', e.target.value)} className="w-full" />
                <input type="number" placeholder="Harga" value={row.unitPrice} onChange={(e) => updateRow(i, 'unitPrice', e.target.value)} className="w-full" />
                <input type="text" list={`unit-list-${i}`} value={row.unit || ''} onChange={(e) => updateRow(i, 'unit', e.target.value)} placeholder="Unit" className="w-full" />
                <datalist id={`unit-list-${i}`}>
                  {units.map((u) => (<option key={u.id} value={u.symbol} />))}
                </datalist>
                <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-500 hover:bg-red-50 p-2 rounded" title="Hapus item">−</button>
              </div>
            ))}

            <button onClick={addRow} className="text-sm" style={{ color: '#10B981' }}>+ Tambah Item</button>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button onClick={closeModal} className="btn-outline flex-1">Batal</button>
              <button onClick={submit} disabled={submitting || mutation.isPending} className="btn-primary flex-1">{submitting || mutation.isPending ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}