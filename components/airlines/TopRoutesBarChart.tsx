'use client';

import { Box, Paper, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load chart components
const BarChart = dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart })), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => ({ default: mod.Bar })), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), { ssr: false });

interface Route {
  destination: string;
  display: string;
  weeklyFlights: number;
  duration?: string;
  distance?: number;
}

interface TopRoutesBarChartProps {
  routes: Route[];
  airlineName: string;
}

export default function TopRoutesBarChart({ routes, airlineName }: TopRoutesBarChartProps) {
  if (routes.length === 0) return null;

  // Prepare data for chart
  const chartData = routes.slice(0, 5).map(route => ({
    name: route.display.length > 15 ? route.display.substring(0, 15) + '...' : route.display,
    fullName: route.display,
    flights: route.weeklyFlights,
    destination: route.destination,
  }));

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
      <Typography variant="h6" gutterBottom color="text.secondary" sx={{ mb: 3, fontWeight: 600 }}>
        Top 5 Busiest Routes - Weekly Frequency
      </Typography>
      <Suspense fallback={<Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</Box>}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#666"
              label={{ value: 'Weekly Flights', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
            />
            <Tooltip
              formatter={(value: any) => [`${value} flights/week`, 'Weekly Frequency']}
              labelFormatter={(label: any) => {
                const route = chartData.find(d => d.name === label);
                return route?.fullName || label;
              }}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <Bar
              dataKey="flights"
              fill="#1976d2"
              radius={[8, 8, 0, 0]}
              name="Weekly Flights"
            />
          </BarChart>
        </ResponsiveContainer>
      </Suspense>
    </Paper>
  );
}
