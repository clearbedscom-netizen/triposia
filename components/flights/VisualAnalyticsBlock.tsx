'use client';

import { Box, Typography, Paper, Grid } from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import dynamic from 'next/dynamic';

// Lazy load chart components
const RouteDataVisualizationLazy = dynamic(() => import('./RouteDataVisualizationLazy'), {
  ssr: false,
  loading: () => <Box sx={{ p: 3, textAlign: 'center' }}>Loading charts...</Box>,
});

interface Route {
  iata: string;
  display: string;
  flights_per_day: string;
  flights_per_week?: number;
  is_domestic?: boolean;
}

interface Airline {
  code: string;
  name: string;
  route_count: number;
  weekly_flights: number;
}

interface VisualAnalyticsBlockProps {
  routes: Route[];
  airlines: Airline[];
  originDisplay: string;
}

export default function VisualAnalyticsBlock({
  routes,
  airlines,
  originDisplay,
}: VisualAnalyticsBlockProps) {
  // Convert airlines to format expected by RouteDataVisualization
  const airlineData = airlines.map((airline) => ({
    code: airline.code,
    name: airline.name,
    routeCount: airline.route_count,
  }));

  const domesticCount = routes.filter((r) => r.is_domestic === true).length;
  const internationalCount = routes.filter((r) => r.is_domestic === false).length;

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <AnalyticsIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Route Analytics
        </Typography>
      </Box>

      {/* Use existing RouteDataVisualization component */}
      <RouteDataVisualizationLazy
        routes={routes}
        airlines={airlineData}
        originDisplay={originDisplay}
      />

      {/* Domestic vs International Split */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Domestic vs International Split
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {domesticCount}
              </Typography>
              <Typography variant="body2">Domestic Destinations</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: 'secondary.light',
                color: 'secondary.contrastText',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {internationalCount}
              </Typography>
              <Typography variant="body2">International Destinations</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
