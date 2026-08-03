import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';

const fetchIngredients = async () => {
  const { data } = await api.get('/ingredients?limit=100');
  return data.data;
};

const fetchCategories = async () => {
  const { data } = await api.get('/categories?limit=100');
  return data.data;
};

const fetchUnits = async () => {
  const { data } = await api.get('/units?limit=100');
  return data.data;
};

export default function Ingredients() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '', category: '', unit: '', minimumStock: '', notes: '',
  });
  const [error, setError] = useState('');

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: fetchIngredients,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-list'],
    queryFn: fetchCategories,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units-list'],
    queryFn: fetchUnits,
  });

  const createMut = useMutation({
    mutationFn: (payload) => api.post('/ingredients', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] });
      setOpen(false);
      setEditingId(null);
      setForm({ name: '', category: '', unit: '', minimumStock: '', notes: '' });
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Gagal menyimpan'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/ingredients/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] });
      setOpen(false);
      setEditingId(null);
      setForm({ name: '', category: '', unit: '', minimumStock: '', notes: '' });
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Gagal update'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/ingredients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
    onError: (err) => setError(err.response?.data?.message || 'Gagal hapus'),
  });

  const updateForm = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', category: '', unit: '', minimumStock: '', notes: '' });
    setError('');
    setOpen(true);
  };

  const openEdit = (ing) => {
    setEditingId(ing.id);
    setForm({
      name: ing.name,
      category: ing.category?.id || ing.category || '',
      unit: ing.unit?.id || ing.unit || '',
      minimumStock: String(ing.minimumStock ?? ''),
      notes: ing.notes || '',
    });
    setError('');
    setOpen(true);
  };

  const submit = () => {
    if (!form.name) { setError('Nama bahan wajib diisi'); return; }
    if (!form.category) { setError('Kategori wajib dipilih'); return; }
    if (!form.unit) { setError('Unit wajib dipilih'); return; }

    const payload = {
      name: form.name,
      category: form.category,
      unit: form.unit,
      minimumStock: form.minimumStock ? Number(form.minimumStock) : 0,
      notes: form.notes || '',
    };

    if (editingId) updateMut.mutate({ id: editingId, payload });
    else createMut.mutate(payload);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#1E293B' }}>Bahan</h1>
        <button onClick={openCreate} className="btn-primary text-sm">+ Bahan Baru</button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 w-full" />)}</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kategori</th>
                <th className="text-right">Stok</th>
                <th className="text-right">Min</th>
                <th className="text-right">Last Price</th>
                <th className="text-right"></th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => (
                <tr key={ing.id} className="hover:bg-slate-50">
                  <td className="font-medium">{ing.name}</td>
                  <td>{ing.category?.name || '-'}</td>
                  <td className="text-right" style={{ color: ing.currentStock <= ing.minimumStock ? '#F97316' : '#059669', fontWeight: '600' }}>{ing.currentStock}</td>
                  <td className="text-right" style={{ color: '#64748B' }}>{ing.minimumStock}</td>
                  <td className="text-right" style={{ color: '#10B981' }}>Rp {(ing.lastPrice ?? 0).toLocaleString('id-ID')}</td>
                  <td className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(ing)} title="Edit" style={{ color: '#2563EB', fontSize: '1rem', padding: '4px 6px', border: 'none', background: 'none', cursor: 'pointer' }}>
                        ✎
                      </button>
                      <button onClick={() => { if (confirm(`Hapus ${ing.name}?`)) deleteMut.mutate(ing.id); }} title="Hapus" style={{ color: '#DC2626', fontSize: '14px', padding: '4px 6px', border: 'none', background: 'none', cursor: 'pointer' }}>
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box space-y-3">
            <h2 className="font-semibold text-lg" style={{ color: '#1E293B' }}>
              {editingId ? 'Edit Bahan' : 'Bahan Baru'}
            </h2>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>Nama</label>
              <input placeholder="Contoh: Ayam Segar" value={form.name} onChange={(e) => updateForm('name', e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>Kategori</label>
              <select value={form.category} onChange={(e) => updateForm('category', e.target.value)}>
                <option value="">Pilih Kategori</option>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>Unit</label>
              <select value={form.unit} onChange={(e) => updateForm('unit', e.target.value)}>
                <option value="">Pilih Unit</option>
                {units.map((u) => (<option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>Stok Minimum</label>
              <input type="number" placeholder="0" value={form.minimumStock} onChange={(e) => updateForm('minimumStock', e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>Catatan <span style={{ color: '#94A3B8', fontWeight: 'normal' }}>(opsional)</span></label>
              <input placeholder="Opsional" value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button onClick={() => setOpen(false)} className="btn-outline flex-1">Batal</button>
              <button onClick={submit} disabled={createMut.isPending || updateMut.isPending} className="btn-primary flex-1">
                {createMut.isPending || updateMut.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}