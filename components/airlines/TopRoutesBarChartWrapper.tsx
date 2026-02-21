'use client';

import dynamic from 'next/dynamic';
import { Box } from '@mui/material';

// Lazy load the chart component
const TopRoutesBarChart = dynamic(() => import('./TopRoutesBarChart'), {
  ssr: false,
  loading: () => <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</Box>,
});

interface Route {
  destination: string;
  display: string;
  weeklyFlights: number;
  duration?: string;
  distance?: number;
  reliability?: 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited';
  aircraft?: string;
}

interface TopRoutesBarChartWrapperProps {
  routes: Route[];
  airlineName?: string;
}

export default function TopRoutesBarChartWrapper({ routes, airlineName }: TopRoutesBarChartWrapperProps) {
  return <TopRoutesBarChart routes={routes} airlineName={airlineName || 'Airline'} />;
}
