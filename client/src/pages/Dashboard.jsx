import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/axios';

const countQuery = (url) => async () => {
  const { data } = await api.get(`${url}?limit=1`);
  return data.pagination?.total ?? 0;
};
const fetchIngredientsLow = async () => {
  const { data } = await api.get('/ingredients?limit=200');
  return (data.data || []).filter((i) => i.currentStock <= i.minimumStock);
};

export default function Dashboard() {
  const { data: totalIngredients } = useQuery({ queryKey: ['count-ingredients'], queryFn: countQuery('/ingredients') });
  const { data: totalPurchases } = useQuery({ queryKey: ['count-purchases'], queryFn: countQuery('/purchases') });
  const { data: totalRecipes } = useQuery({ queryKey: ['count-recipes'], queryFn: countQuery('/recipes') });
  const { data: totalMenus } = useQuery({ queryKey: ['count-menus'], queryFn: countQuery('/menus') });
  const { data: lowStock } = useQuery({ queryKey: ['low-stock'], queryFn: fetchIngredientsLow });

  const cards = [
    { label: 'Ingredients', value: totalIngredients ?? 0, to: '/purchases', color: '#10B981' },
    { label: 'Purchases', value: totalPurchases ?? 0, to: '/purchases', color: '#F59E0B' },
    { label: 'Recipes', value: totalRecipes ?? 0, to: '/recipes', color: '#8B5CF6' },
    { label: 'Menus', value: totalMenus ?? 0, to: '/menus', color: '#F97316' },
  ];

  const lowList = lowStock ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <h1 className="text-xl font-bold" style={{ color: '#1E293B' }}>Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}
            className="card text-white hover:opacity-90 transition-opacity text-center"
            style={{ backgroundColor: c.color }}>
            <p className="text-sm opacity-80 font-medium">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3" style={{ color: '#1E293B' }}>Peringatan Stok Rendah</h2>
        {lowList.length === 0 ? (
          <p className="text-sm" style={{ color: '#64748B' }}>Semua bahan di atas stok minimum ✅</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Bahan</th><th className="text-right">Stok</th><th className="text-right">Min</th></tr></thead>
              <tbody>
                {lowList.map((i) => (
                  <tr key={i.id}>
                    <td className="font-medium">{i.name}</td>
                    <td className="text-right font-bold" style={{ color: '#F97316' }}>{i.currentStock}</td>
                    <td className="text-right" style={{ color: '#64748B' }}>{i.minimumStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
