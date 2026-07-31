import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';

const fetchMenus = async () => {
  const { data } = await api.get('/menus?limit=100');
  return data.data;
};

const fetchRecipes = async () => {
  const { data } = await api.get('/recipes?limit=100');
  return data.data;
};

const createMenu = async (payload) => {
  const { data } = await api.post('/menus', payload);
  return data.data;
};

const updateMenu = async ({ id, payload }) => {
  const { data } = await api.patch(`/menus/${id}`, payload);
  return data.data;
};

const deleteMenu = async (id) => {
  const { data } = await api.delete(`/menus/${id}`);
  return data.data;
};

export default function Menus() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    recipe: '',
    sellingPrice: '',
  });
  const [error, setError] = useState('');

  const { data: menus = [], isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: fetchMenus,
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes-list'],
    queryFn: fetchRecipes,
  });

  const createMutation = useMutation({
    mutationFn: createMenu,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menus'] });
      setOpen(false);
      setForm({ name: '', description: '', recipe: '', sellingPrice: '' });
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Gagal menyimpan'),
  });

  const updateMutation = useMutation({
    mutationFn: updateMenu,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menus'] });
      setEditing(null);
      setForm({ name: '', description: '', recipe: '', sellingPrice: '' });
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Gagal update'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMenu,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menus'] }),
    onError: (err) => alert(err.response?.data?.message || 'Gagal hapus'),
  });

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', recipe: '', sellingPrice: '' });
    setError('');
    setOpen(true);
  };

  const handleOpenEdit = (menu) => {
    setEditing(menu);
    setForm({
      name: menu.name,
      description: menu.description || '',
      recipe: menu.recipe?.id || menu.recipe || '',
      sellingPrice: menu.sellingPrice || '',
    });
    setError('');
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) { setError('Nama menu wajib diisi'); return; }
    if (!form.recipe) { setError('Resep wajib dipilih'); return; }
    if (!form.sellingPrice) { setError('Harga jual wajib diisi'); return; }

    const payload = {
      name: form.name,
      description: form.description || '',
      recipe: form.recipe,
      sellingPrice: Number(form.sellingPrice),
      status: 'ACTIVE',
    };

    if (editing) updateMutation.mutate({ id: editing.id, payload });
    else createMutation.mutate(payload);
  };

  const confirmDelete = (id) => {
    if (window.confirm('Yakin hapus menu ini?')) deleteMutation.mutate(id);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setForm({ name: '', description: '', recipe: '', sellingPrice: '' });
    setError('');
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const formatRupiah = (val) => (val ?? 0).toLocaleString('id-ID');

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#1E293B' }}>Menu</h1>
        <button onClick={handleOpenCreate} className="btn-primary text-sm">+ Menu Baru</button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-12 w-full" />)}
        </div>
      ) : menus.length === 0 ? (
        <div className="text-center py-12" style={{ color: '#64748B' }}>
          <p className="mb-4">Belum ada menu</p>
          <button onClick={handleOpenCreate} className="btn-primary">+ Tambah Menu Pertama</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Nama</th>
                <th>Resep</th>
                <th className="text-right">Harga Jual</th>
                <th className="text-right">Food Cost</th>
                <th className="text-right">Margin</th>
                <th className="text-right">Margin %</th>
                <th style={{ width: '100px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((menu) => (
                <tr key={menu.id} className="hover:bg-slate-50">
                  <td className="font-medium">{menu.code}</td>
                  <td>{menu.name}</td>
                  <td>{menu.recipe?.name || '-'}</td>
                  <td className="text-right font-semibold" style={{ color: '#10B981' }}>Rp {formatRupiah(menu.sellingPrice)}</td>
                  <td className="text-right" style={{ color: '#F59E0B' }}>Rp {formatRupiah(menu.foodCost)}</td>
                  <td className="text-right" style={{ color: menu.margin >= 0 ? '#059669' : '#F97316' }}>Rp {formatRupiah(menu.margin)}</td>
                  <td className="text-right" style={{ color: menu.marginPct >= 20 ? '#059669' : menu.marginPct >= 0 ? '#F59E0B' : '#F97316' }}>{menu.marginPct?.toFixed(1)}%</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(menu)}
                        className="btn-icon"
                        title="Edit"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => confirmDelete(menu.id)}
                        className="btn-icon text-red-500 hover:bg-red-50"
                        title="Hapus"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
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
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box space-y-3">
            <h2 className="font-semibold text-lg" style={{ color: '#1E293B' }}>
              {editing ? 'Edit Menu' : 'Menu Baru'}
            </h2>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>Nama *</label>
              <input
                placeholder="Contoh: Nasi Goreng Special"
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>
                Deskripsi <span style={{ color: '#94A3B8', fontWeight: 'normal' }}>(opsional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Opsional"
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>Resep *</label>
              <select
                value={form.recipe}
                onChange={(e) => setForm(p => ({ ...p, recipe: e.target.value }))}
              >
                <option value="">Pilih Resep</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.name} (FC: Rp {formatRupiah(r.foodCost)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>Harga Jual *</label>
              <input
                type="number"
                min="1"
                placeholder="Contoh: 25000"
                value={form.sellingPrice}
                onChange={(e) => setForm(p => ({ ...p, sellingPrice: e.target.value }))}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button onClick={closeModal} className="btn-outline flex-1">Batal</button>
              <button
                onClick={submit}
                disabled={isPending}
                className="btn-primary flex-1"
              >
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}