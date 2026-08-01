import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

const fetchAdjustments = async () => {
  const { data } = await api.get('/stock-adjustments?limit=50');
  return data.data;
};

const fetchIngredients = async () => {
  const { data } = await api.get('/ingredients?limit=100');
  return data.data;
};

const createAdjustment = async (payload) => {
  const { data } = await api.post('/stock-adjustments', payload);
  return data.data;
};

const formatPrice = (p) => `Rp ${(p ?? 0).toLocaleString('id-ID')}`;
const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

export default function StockAdjustment() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ingredient: '', type: 'IN', reason: 'OTHER', quantity: '', notes: '' });
  const [error, setError] = useState('');

  const { data: adjustments = [], isLoading } = useQuery({ queryKey: ['stock-adjustments'], queryFn: fetchAdjustments });
  const { data: ingredients = [] } = useQuery({ queryKey: ['ingredients-list'], queryFn: fetchIngredients });

  const mutation = useMutation({
    mutationFn: createAdjustment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-adjustments'] });
      qc.invalidateQueries({ queryKey: ['ingredients'] });
      qc.invalidateQueries({ queryKey: ['count-ingredients'] });
      setOpen(false);
      setForm({ ingredient: '', type: 'IN', reason: 'OTHER', quantity: '', notes: '' });
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Gagal menyimpan'),
  });

  const submit = () => {
    if (!form.ingredient) { setError('Bahan wajib dipilih'); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { setError('Quantity harus > 0'); return; }
    mutation.mutate({
      ingredient: form.ingredient,
      type: form.type,
      reason: form.reason,
      quantity: Number(form.quantity),
      notes: form.notes || '',
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#1E293B' }}>Penyesuaian Stok</h1>
        <button onClick={() => setOpen(true)} className="btn-primary text-sm">+ Penyesuaian Baru</button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-12 w-full" />)}</div>
      ) : adjustments.length === 0 ? (
        <div className="text-center py-12" style={{ color: '#64748B' }}>
          <p className="mb-4">Belum ada penyesuaian stok</p>
          <button onClick={() => setOpen(true)} className="btn-primary">+ Penyesuaian Pertama</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Tanggal</th>
                <th>Bahan</th>
                <th>Tipe</th>
                <th>Alasan</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Sebelum</th>
                <th className="text-right">Sesudah</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((a) => (
                <tr key={a.id}>
                  <td className="font-medium">{a.code}</td>
                  <td>{formatDate(a.adjustmentDate)}</td>
                  <td>{a.ingredient?.name || '-'}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {a.type === 'IN' ? 'Masuk' : 'Keluar'}
                    </span>
                  </td>
                  <td>{a.reason === 'WASTE' ? 'Waste' : a.reason === 'TRANSFER' ? 'Transfer' : a.reason === 'CORRECTION' ? 'Koreksi' : 'Lainnya'}</td>
                  <td className="text-right">{a.quantity} {a.ingredient?.unit?.symbol || ''}</td>
                  <td className="text-right">{a.stockBefore}</td>
                  <td className="text-right">{a.stockAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box space-y-3">
            <h2 className="font-semibold text-lg" style={{ color: '#1E293B' }}>Penyesuaian Stok Baru</h2>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>Bahan *</label>
              <select value={form.ingredient} onChange={(e) => setForm(p => ({ ...p, ingredient: e.target.value }))}>
                <option value="">Pilih Bahan</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit?.symbol || ''}) — Stok: {ing.currentStock}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>Tipe *</label>
                <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="IN">Masuk (IN)</option>
                  <option value="OUT">Keluar (OUT)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>Alasan *</label>
                <select value={form.reason} onChange={(e) => setForm(p => ({ ...p, reason: e.target.value }))}>
                  <option value="OTHER">Lainnya</option>
                  <option value="WASTE">Waste</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="CORRECTION">Koreksi</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>Quantity *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Jumlah"
                value={form.quantity}
                onChange={(e) => setForm(p => ({ ...p, quantity: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#475569' }}>
                Catatan <span style={{ color: '#94A3B8', fontWeight: 'normal' }}>(opsional)</span>
              </label>
              <input
                placeholder="Catatan tambahan"
                value={form.notes}
                onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button onClick={() => setOpen(false)} className="btn-outline flex-1">Batal</button>
              <button onClick={submit} disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}