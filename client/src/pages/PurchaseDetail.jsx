import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

const formatPrice = (price) => `Rp ${(price ?? 0).toLocaleString('id-ID')}`;
const formatDate = (date) => new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

export default function PurchaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: purchase, isLoading } = useQuery({
    queryKey: ['purchase', id],
    queryFn: async () => {
      const { data } = await api.get(`/purchases/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-8 w-full" />
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-red-500">Pembelian tidak ditemukan</p>
      </div>
    );
  }

  const items = purchase.items || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/purchases" className="text-sm" style={{ color: '#10B981' }}>
          ← Kembali ke Pembelian
        </Link>
        <div className="flex gap-2">
          {purchase.status === 'COMPLETED' && (
            <span className="px-3 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">
              COMPLETED
            </span>
          )}
          {purchase.status === 'ORDERED' && (
            <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
              ORDERED
            </span>
          )}
          {purchase.status === 'CANCELLED' && (
            <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700">
              CANCELLED
            </span>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1E293B' }}>
              {purchase.code}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>
              {purchase.supplier ? `Supplier: ${purchase.supplier.name}` : 'Tanpa Supplier'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: '#10B981' }}>
              {formatPrice(purchase.totalAmount || 0)}
            </p>
            <p className="text-sm" style={{ color: '#64748B' }}>Total Pembelian</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
          <div>
            <p className="text-sm" style={{ color: '#64748B' }}>Tanggal</p>
            <p className="text-xl font-semibold" style={{ color: '#1E293B' }}>
              {formatDate(purchase.purchaseDate)}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#64748B' }}>Status</p>
            <p className="text-xl font-semibold" style={{ color: '#1E293B' }}>
              {purchase.status}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#64748B' }}>Jumlah Item</p>
            <p className="text-xl font-semibold" style={{ color: '#1E293B' }}>
              {items.length}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#64748B' }}>Catatan</p>
            <p className="text-xl font-semibold" style={{ color: '#1E293B' }}>
              {purchase.note || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="card">
        <h2 className="font-semibold mb-4" style={{ color: '#1E293B' }}>
          Item Pembelian ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-center text-sm py-8" style={{ color: '#64748B' }}>
            Tidak ada item
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Bahan</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Harga Satuan</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">
                      {item.ingredient?.name || item.ingredient?.code || 'Unknown'}
                    </td>
                    <td className="py-3 text-right font-mono">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-right font-mono">
                      {formatPrice(item.unitPrice)}
                    </td>
                    <td className="py-3 text-right font-semibold">
                      {formatPrice(item.totalPrice)}
                    </td>
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