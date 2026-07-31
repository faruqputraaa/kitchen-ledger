import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../lib/axios';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const countQuery = (url) => async () => {
  const { data } = await api.get(`${url}?limit=1`);
  return data.pagination?.total ?? 0;
};

const fetchMenusCount = async () => {
  const { data } = await api.get('/menus?limit=1');
  return data.pagination?.total ?? 0;
};

const fetchLowStock = async () => {
  const { data } = await api.get('/ingredients?limit=200');
  const list = data.data || [];
  return list.filter((i) => i.currentStock <= i.minimumStock);
};

const fetchRecentPurchases = async () => {
  const { data } = await api.get('/purchases?limit=5&sort=createdAt&order=desc');
  return data.data || [];
};

const fetchRecentRecipes = async () => {
  const { data } = await api.get('/recipes?limit=5&sort=createdAt&order=desc');
  return data.data || [];
};

export default function Dashboard() {
  const { data: totalIngredients } = useQuery({ queryKey: ['count-ingredients'], queryFn: countQuery('/ingredients') });
  const { data: totalPurchases } = useQuery({ queryKey: ['count-purchases'], queryFn: countQuery('/purchases') });
  const { data: totalRecipes } = useQuery({ queryKey: ['count-recipes'], queryFn: countQuery('/recipes') });
  const { data: totalMenus } = useQuery({ queryKey: ['count-menus'], queryFn: fetchMenusCount });
  const { data: lowStock } = useQuery({ queryKey: ['low-stock'], queryFn: fetchLowStock });
  const { data: purchases } = useQuery({ queryKey: ['recent-purchases'], queryFn: fetchRecentPurchases });
  const { data: recipes } = useQuery({ queryKey: ['recent-recipes'], queryFn: fetchRecentRecipes });

  const cards = [
    { label: 'Bahan', value: totalIngredients ?? 0, to: '/ingredients', color: '#10B981', icon: '📦' },
    { label: 'Pembelian', value: totalPurchases ?? 0, to: '/purchases', color: '#F59E0B', icon: '🛒' },
    { label: 'Resep', value: totalRecipes ?? 0, to: '/recipes', color: '#8B5CF6', icon: '📝' },
    { label: 'Menu', value: totalMenus ?? 0, to: '/menus', color: '#10B981', icon: '🍽️' },
  ];

  const lowList = lowStock ?? [];
  const recentPurchases = purchases ?? [];
  const recentRecipes = recipes ?? [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="card text-white hover:opacity-90 transition-opacity text-center relative overflow-hidden" style={{ backgroundColor: c.color }}>
            <span className="text-3xl sm:text-3xl md:text-4xl block mb-1">{c.icon}</span>
            <p className="text-xs sm:text-sm opacity-90 font-medium">{c.label}</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-1">{c.value}</p>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left: Low Stock Alert - Full width on mobile, 1/2 on md, 2/3 on lg */}
        <div className="lg:col-span-2 md:col-span-2 space-y-6">
          {/* Low Stock Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg" style={{ color: '#0F172A' }}>Peringatan Stok Rendah</h2>
              {lowList.length > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 font-medium">
                  {lowList.length} item
                </span>
              )}
            </div>
            {lowList.length === 0 ? (
              <p className="text-sm" style={{ color: '#64748B' }}>Semua bahan di atas stok minimum ✅</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Bahan</th><th className="text-right">Stok</th><th className="text-right">Min</th></tr></thead>
                  <tbody>
                    {lowList.map((i) => (
                      <tr key={i.id} className="border-b">
                        <td className="py-2">{i.name}</td>
                        <td className="py-2 text-right font-bold" style={{ color: '#F97316' }}>{i.currentStock}</td>
                        <td className="py-2 text-right" style={{ color: '#64748B' }}>{i.minimumStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="space-y-4">
          {/* Recent Purchases */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg" style={{ color: '#0F172A' }}>Pembelian Terbaru</h2>
              <Link to="/purchases" className="text-xs" style={{ color: '#10B981' }}>Lihat semua →</Link>
            </div>
            {recentPurchases.length === 0 ? (
              <p className="text-center text-sm py-8" style={{ color: '#94A3B8' }}>Belum ada pembelian</p>
            ) : (
              <div className="space-y-3">
                {recentPurchases.map((p) => (
                  <Link key={p.id} to={`/purchases/${p.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
                        <span className="text-lg">🛒</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: '#0F172A' }}>{p.code}</p>
                        <p className="text-xs" style={{ color: '#94A3B8' }}>
                          {p.supplier?.name || 'Tanpa Supplier'} • {new Date(p.purchaseDate).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm" style={{ color: '#10B981' }}>{formatCurrency(p.totalAmount || 0)}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        backgroundColor: p.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7',
                        color: p.status === 'COMPLETED' ? '#059669' : '#D97706',
                      }}>
                        {p.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Recipes */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg" style={{ color: '#0F172A' }}>Resep Terbaru</h2>
              <Link to="/recipes" className="text-xs" style={{ color: '#8B5CF6' }}>Lihat semua →</Link>
            </div>
            {recentRecipes.length === 0 ? (
              <p className="text-center text-sm py-8" style={{ color: '#94A3B8' }}>Belum ada resep</p>
            ) : (
              <div className="space-y-3">
                {recentRecipes.map((r) => (
                  <Link key={r.id} to={`/recipes/${r.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EDE9FE' }}>
                        <span className="text-lg">📝</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: '#0F172A' }}>{r.name}</p>
                        <p className="text-xs" style={{ color: '#94A3B8' }}>{r.code} • {formatCurrency(r.foodCost || 0)}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full" style={{
                      backgroundColor: r.status === 'ACTIVE' ? '#D1FAE5' : '#FEF3C7',
                      color: r.status === 'ACTIVE' ? '#059669' : '#D97706',
                    }}>
                      {r.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}