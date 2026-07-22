import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

export default function PriceHistoryChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        Belum ada data historis
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: format(new Date(d.date), 'dd/MM'),
    price: d.lastPrice || d.foodCost || 0,
  }));

  return (
    <div className="card">
      <h3 className="font-semibold mb-4" style={{ color: '#1E293B' }}>
        {title}
      </h3>
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value)}
            />
            <Tooltip
              formatter={(value) => ['Rp ' + new Intl.NumberFormat('id-ID').format(value), 'Harga']}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}