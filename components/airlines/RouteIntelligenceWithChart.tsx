'use client';

import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import AirlineRouteIntelligenceServer from './AirlineRouteIntelligenceServer';
import TopRoutesBarChartWrapper from './TopRoutesBarChartWrapper';

interface Route {
  destination: string;
  display: string;
  weeklyFlights: number;
  duration?: string;
  distance?: number;
  reliability?: 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited';
  aircraft?: string;
}

interface RouteIntelligenceWithChartProps {
  airlineName: string;
  airportCode: string;
  topRoutes: Route[];
  totalRoutes: number;
  totalWeeklyFlights: number;
  averageFrequency?: number;
  routeGrowth?: 'growing' | 'stable' | 'declining';
}

/**
 * Client component wrapper that combines server-rendered content with client-side chart
 * This ensures SEO content is server-rendered while chart is client-side only
 */
export default function RouteIntelligenceWithChart(props: RouteIntelligenceWithChartProps) {
  return (
    <Box>
      {/* Server-rendered content (passed as props) */}
      <AirlineRouteIntelligenceServer {...props} />
      
      {/* Client-side chart (only if routes exist) */}
      {props.topRoutes.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <TopRoutesBarChartWrapper routes={props.topRoutes.slice(0, 5)} />
        </Box>
      )}
    </Box>
  );
}
