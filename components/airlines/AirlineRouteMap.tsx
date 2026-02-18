'use client';

import { lazy, Suspense } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';

const EnhancedAirportMap = lazy(() => import('@/components/maps/EnhancedAirportMap'));

interface Route {
  iata: string;
  display: string;
  lat?: number;
  lng?: number;
  flights_per_week?: number;
  flights_per_day?: string;
  airline_count?: number;
  distance_km?: number;
  average_duration?: string;
}

interface AirlineRouteMapProps {
  originIata: string;
  originName: string;
  originLat?: number;
  originLng?: number;
  routes: Route[];
  airlineName: string;
}

export default function AirlineRouteMap({
  originIata,
  originName,
  originLat,
  originLng,
  routes,
  airlineName,
}: AirlineRouteMapProps) {
  // Filter routes with valid coordinates
  const routesWithCoords = routes.filter(r => r.lat && r.lng);

  if (routesWithCoords.length === 0) {
    return null;
  }

  // Transform routes to match EnhancedAirportMap interface
  const mapRoutes = routesWithCoords.map(route => ({
    iata: route.iata,
    display: route.display,
    lat: route.lat!,
    lng: route.lng!,
    flights_per_day: route.flights_per_day || `${Math.round((route.flights_per_week || 0) / 7)} flights`,
    flights_per_week: route.flights_per_week || 0,
    airline_count: route.airline_count || 1,
    distance_km: route.distance_km,
    average_duration: route.average_duration,
  }));

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 2 }}>
        {airlineName} Route Map from {originName} ({originIata})
      </Typography>
      <Paper sx={{ p: 2, minHeight: 400 }}>
        <Suspense
          fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              <CircularProgress />
            </Box>
          }
        >
          {originLat && originLng ? (
            <EnhancedAirportMap
              airport={{
                lat: originLat,
                lng: originLng,
                iata: originIata,
                name: originName,
              }}
              routes={mapRoutes}
              maxRoutes={50}
            />
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Map data unavailable for this airport.
              </Typography>
            </Box>
          )}
        </Suspense>
      </Paper>
    </Box>
  );
}
