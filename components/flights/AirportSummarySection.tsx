'use client';

import { Box, Typography, Grid, Paper, Chip } from '@mui/material';
import { Flight, Airlines, TrendingUp, LocationOn } from '@mui/icons-material';
import Link from 'next/link';
import { formatAirportDisplay } from '@/lib/formatting';

interface TopRoute {
  iata: string;
  display: string;
  flights_per_day: string;
  flights_per_week?: number;
}

interface TopAirline {
  code: string;
  name: string;
  route_count: number;
  weekly_flights: number;
}

interface AirportSummarySectionProps {
  totalDestinations: number;
  totalAirlines: number;
  totalWeeklyFlights: number;
  topRoutes: TopRoute[];
  topAirlines: TopAirline[];
  originIata: string;
}

export default function AirportSummarySection({
  totalDestinations,
  totalAirlines,
  totalWeeklyFlights,
  topRoutes,
  topAirlines,
  originIata,
}: AirportSummarySectionProps) {
  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Airport Overview
      </Typography>
      
      {/* Key Metrics */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Flight sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {totalDestinations}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Destinations
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Airlines sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {totalAirlines}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Airlines
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center' }}>
            <TrendingUp sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {totalWeeklyFlights.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Weekly Flights
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center' }}>
            <LocationOn sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {topRoutes.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Top Routes
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top 3 Busiest Routes */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Top Busiest Routes
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {topRoutes.slice(0, 3).map((route, index) => {
              const routeSlug = `${originIata.toLowerCase()}-${route.iata.toLowerCase()}`;
              return (
                <Paper
                  key={route.iata}
                  component={Link}
                  href={`/flights/${routeSlug}`}
                  sx={{
                    p: 2,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: 'primary.main',
                      boxShadow: 2,
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 600, minWidth: 40 }}
                    />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {route.display}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {route.flights_per_day} daily
                        {route.flights_per_week && ` • ${route.flights_per_week} weekly`}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </Grid>

        {/* Top 3 Airlines */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Top Airlines
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {topAirlines.slice(0, 3).map((airline, index) => (
              <Paper
                key={airline.code}
                component={Link}
                href={`/airlines/${airline.code.toLowerCase()}/${originIata.toLowerCase()}`}
                sx={{
                  p: 2,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main',
                    boxShadow: 2,
                  },
                  transition: 'all 0.2s',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Chip
                    label={`#${index + 1}`}
                    size="small"
                    color="secondary"
                    sx={{ fontWeight: 600, minWidth: 40 }}
                  />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {airline.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {airline.route_count} routes • {airline.weekly_flights} weekly flights
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
