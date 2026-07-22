import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../lib/axios';

export default function IngredientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: ingredient, isLoading } = useQuery({
    queryKey: ['ingredient', id],
    queryFn: async () => {
      const { data } = await api.get(`/ingredients/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const { data: priceHistory } = useQuery({
    queryKey: ['ingredient-price-history', id],
    queryFn: async () => {
      const { data } = await api.get(`/ingredients/${id}/price-history`);
      return data.data;
    },
    enabled: !!id,
  });

  const formatPrice = (price) => `Rp ${price.toLocaleString('id-ID')}`;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-8 w-full" />
      </div>
    );
  }

  if (!ingredient) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-red-500">Bahan tidak ditemukan</p>
      </div>
    );
  }

  const chartData = (priceHistory || []).map((h) => ({
    date: new Date(h.date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    price: h.lastPrice,
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/ingredients" className="text-sm" style={{ color: '#10B981' }}>
          ← Kembali ke Bahan
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/ingredients/${id}/edit`)}
            className="btn-outline text-sm"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1E293B' }}>
              {ingredient.name}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>
              Kode: {ingredient.code} • Kategori: {ingredient.category?.name || '-'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: '#10B981' }}>
              {formatPrice(ingredient.lastPrice || 0)}
            </p>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Harga Beli Terakhir
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
          <div>
            <p className="text-sm" style={{ color: '#64748B' }}>Stok Saat Ini</p>
            <p className="text-xl font-semibold" style={{
              color: ingredient.currentStock <= ingredient.minimumStock ? '#F97316' : '#059669'
            }}>
              {ingredient.currentStock} {ingredient.unit?.symbol || ''}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#64748B' }}>Stok Minimum</p>
            <p className="text-xl font-semibold" style={{ color: '#1E293B' }}>
              {ingredient.minimumStock} {ingredient.unit?.symbol || ''}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#64748B' }}>Satuan</p>
            <p className="text-xl font-semibold" style={{ color: '#1E293B' }}>
              {ingredient.unit?.name || '-'} ({ingredient.unit?.symbol || ''})
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#64748B' }}>Terakhir Beli</p>
            <p className="text-xl font-semibold" style={{ color: '#1E293B' }}>
              {ingredient.lastPurchaseDate ? new Date(ingredient.lastPurchaseDate).toLocaleDateString('id-ID') : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Price History Chart */}
      <div className="card">
        <h2 className="font-semibold mb-4" style={{ color: '#1E293B' }}>
          Riwayat Harga Beli
        </h2>
        {chartData.length === 0 ? (
          <p className="text-center text-sm py-8" style={{ color: '#64748B' }}>
            Belum ada riwayat harga beli untuk bahan ini
          </p>
        ) : (
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                />
                <Tooltip
                  formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Harga']}
                  labelFormatter={(date) => new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#10B981' }}
                  activeDot={{ r: 6, fill: '#059669' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}