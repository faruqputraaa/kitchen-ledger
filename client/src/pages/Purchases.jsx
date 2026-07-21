import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

const fetchPurchases = async () => {
  const { data } = await api.get('/purchases?limit=50');
  return data.data;
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

export default function Purchases() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [items, setItems] = useState([
    { ingredient: '', quantity: '', unitPrice: '' },
  ]);
  const [error, setError] = useState('');

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: fetchPurchases,
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients-list'],
    queryFn: fetchIngredients,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: fetchSuppliers,
  });

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
    setItems((p) => p.map((r, idx) => (idx === i ? { ...r, [f]: v } : r)));

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

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Supplier</th>
                <th>Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.code}</td>
                  <td>{p.supplier?.name || '-'}</td>
                  <td>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor:
                          p.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7',
                        color:
                          p.status === 'COMPLETED' ? '#059669' : '#D97706',
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
<td className="text-right font-semibold">
                    Rp {(p.totalAmount ?? 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                      {ing.name}
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
