import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

const fetchRecipes = async () => {
  const { data } = await api.get('/recipes?limit=50');
  return data.data;
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

export default function Recipes() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [items, setItems] = useState([
    { ingredient: '', unit: '', quantity: '' },
  ]);
const [error, setError] = useState('');

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: fetchRecipes,
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients-list'],
    queryFn: fetchIngredients,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units-list'],
    queryFn: fetchUnits,
  });

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
    setItems((p) => [
      ...p,
      { ingredient: '', unit: '', quantity: '' },
    ]);

  const updateRow = (i, f, v) =>
    setItems((p) =>
      p.map((r, idx) => (idx === i ? { ...r, [f]: v } : r))
    );

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
                <th>Nama</th>
                <th className="text-right">Food Cost</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.code}</td>
                  <td>{r.name}</td>
                  <td className="text-right font-semibold">
                    Rp {(r.foodCost ?? 0).toLocaleString('id-ID')}
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
                      {ing.name}
                    </option>
                  ))}
                </select>
                <select
                  value={row.unit}
                  onChange={(e) =>
                    updateRow(i, 'unit', e.target.value)
                  }
                  className="flex-1 min-w-0"
                >
                  <option value="">Unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.symbol}
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
