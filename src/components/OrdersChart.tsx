'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { ORDER_STATUS_STYLES } from '@/lib/format';
import type { OrderStatus } from '@/types/supabase';

interface Props {
  data: { status: OrderStatus; count: number }[];
}

// Chart-specific hex values mirroring the real theme in globals.css and
// the semantic status colors used by StatusBadge. Update this map if
// ORDER_STATUS_STYLES' status set changes.
const STATUS_CHART_COLORS: Record<OrderStatus, string> = {
  draft: '#6B7280',
  pending: '#D97706',
  payment_pending: '#B45309',
  assigned: '#2563EB',
  driver_en_route: '#0284C7',
  arrived: '#0891B2',
  loading: '#0E7490',
  picked_up: '#4F46E5',
  in_transit: '#8B1A2F',
  delivered: '#16A34A',
  completed: '#15803D',
  cancelled: '#8B8D94',
  disputed: '#B91C1C',
};

export default function OrdersChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: ORDER_STATUS_STYLES[d.status].label,
    count: d.count,
    fill: STATUS_CHART_COLORS[d.status],
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#8B8D94' }}
            axisLine={{ stroke: '#E4E4E7' }}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={{ fontSize: 11, fill: '#8B8D94' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: '#FBE6EA' }}
            contentStyle={{ borderRadius: 8, border: '1px solid #E4E4E7', fontSize: 13 }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
