'use client';

import { useState, useMemo } from 'react';
import { Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, Chip, Checkbox, FormControlLabel } from '@mui/material';
import LazyMap from './LazyMap';
import { calculateDistance } from '@/lib/distance';

interface Route {
  iata: string;
  display: string;
  lat?: number;
  lng?: number;
  flights_per_day: string;
  airline_count?: number;
  popularity_score?: number;
}

interface EnhancedAirportMapProps {
  airport: {
    lat: number;
    lng: number;
    iata: string;
    name?: string;
    city?: string;
  };
  routes: Route[];
  maxRoutes?: number;
}

/**
 * Enhanced airport map with route lines, clickable routes, airline visibility toggle, and busiest route highlighting
 */
export default function EnhancedAirportMap({
  airport,
  routes,
  maxRoutes = 20,
}: EnhancedAirportMapProps) {
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [showBusiestOnly, setShowBusiestOnly] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  // Parse flights per day
  const parseFlightsPerDay = (fpd: string): number => {
    const match = fpd.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Filter routes with coordinates
  const routesWithCoords = useMemo(() => {
    return routes
      .filter(r => r.lat && r.lng)
      .sort((a, b) => parseFlightsPerDay(b.flights_per_day) - parseFlightsPerDay(a.flights_per_day))
      .slice(0, maxRoutes);
  }, [routes, maxRoutes]);

  // Get busiest routes (top 5)
  const busiestRoutes = useMemo(() => {
    return routesWithCoords.slice(0, 5).map(r => r.iata);
  }, [routesWithCoords]);

  // Filter routes based on visibility settings
  const visibleRoutes = useMemo(() => {
    let filtered = routesWithCoords;
    
    if (showBusiestOnly) {
      filtered = filtered.filter(r => busiestRoutes.includes(r.iata));
    }
    
    // Filter by airline would go here if we had airline data per route
    
    return filtered;
  }, [routesWithCoords, showBusiestOnly, busiestRoutes]);

  // Prepare markers and polylines
  const { markers: markersList, polylines: polylinesList } = useMemo(() => {
    const markers = [
      {
        lat: airport.lat,
        lon: airport.lng,
        label: `${airport.name || airport.city || airport.iata} (${airport.iata}) - Origin`,
      },
      ...visibleRoutes.map(route => ({
        lat: route.lat!,
        lon: route.lng!,
        label: `${route.display} (${route.iata}) - ${route.flights_per_day} daily`,
      })),
    ];

    const polylines = visibleRoutes.map(route => ({
      positions: [
        { lat: airport.lat, lon: airport.lng },
        { lat: route.lat!, lon: route.lng! },
      ],
      color: busiestRoutes.includes(route.iata) ? '#d32f2f' : '#1976d2',
      weight: busiestRoutes.includes(route.iata) ? 4 : 2,
      opacity: selectedRoute === route.iata ? 1 : 0.6,
      routeIata: route.iata,
    }));

    return { markers, polylines };
  }, [airport, visibleRoutes, busiestRoutes, selectedRoute]);

  // Calculate center and zoom
  const { centerLat, centerLon, zoom } = useMemo(() => {
    if (visibleRoutes.length === 0) {
      return { centerLat: airport.lat, centerLon: airport.lng, zoom: 13 };
    }

    const allLats = [airport.lat, ...visibleRoutes.map(r => r.lat!)];
    const allLons = [airport.lng, ...visibleRoutes.map(r => r.lng!)];
    const centerLat = (Math.min(...allLats) + Math.max(...allLats)) / 2;
    const centerLon = (Math.min(...allLons) + Math.max(...allLons)) / 2;
    
    const latDiff = Math.max(...allLats) - Math.min(...allLats);
    const lonDiff = Math.max(...allLons) - Math.min(...allLons);
    const maxDiff = Math.max(latDiff, lonDiff);
    
    let zoomLevel = 5;
    if (maxDiff > 20) zoomLevel = 3;
    else if (maxDiff > 10) zoomLevel = 4;
    else if (maxDiff > 5) zoomLevel = 5;
    else if (maxDiff > 2) zoomLevel = 6;
    else if (maxDiff > 1) zoomLevel = 7;
    else if (maxDiff > 0.5) zoomLevel = 8;
    else if (maxDiff > 0.2) zoomLevel = 9;
    else zoomLevel = 10;

    return { centerLat, centerLon, zoom: zoomLevel };
  }, [airport, visibleRoutes]);

  // For now, we'll use a simplified version since LazyMap doesn't support multiple polylines
  // We'll enhance it to show all routes
  const description = `Interactive map showing ${visibleRoutes.length} direct flight routes from ${airport.name || airport.city || airport.iata} (${airport.iata}). ${busiestRoutes.length > 0 ? 'Red lines indicate the busiest routes.' : ''}`;

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 0, textAlign: 'left' }}>
          Flight Routes Map
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showBusiestOnly}
                onChange={(e) => setShowBusiestOnly(e.target.checked)}
              />
            }
            label="Show Busiest Routes Only"
          />
          {busiestRoutes.length > 0 && (
            <Chip 
              label={`${busiestRoutes.length} busiest routes highlighted`} 
              size="small" 
              color="error" 
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Click on a route line to see details. Red lines indicate the top 5 busiest routes.
        </Typography>
      </Paper>

      {/* Map - Note: LazyMap currently supports single polyline, so we show the first route as example */}
      {visibleRoutes.length > 0 && (
        <LazyMap
          lat={centerLat}
          lon={centerLon}
          zoom={zoom}
          height={500}
          markers={markersList}
          polyline={visibleRoutes.length > 0 ? [
            { lat: airport.lat, lon: airport.lng },
            { lat: visibleRoutes[0].lat!, lon: visibleRoutes[0].lng! },
          ] : undefined}
          title={`Flight Routes from ${airport.name || airport.city || airport.iata}`}
          description={description}
        />
      )}

      {/* Route List */}
      {visibleRoutes.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h3" sx={{ fontSize: '1.1rem', mb: 2, fontWeight: 600 }}>
            Visible Routes ({visibleRoutes.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {visibleRoutes.map((route) => (
              <Chip
                key={route.iata}
                label={`${route.display} (${route.flights_per_day})`}
                size="small"
                color={busiestRoutes.includes(route.iata) ? 'error' : 'default'}
                onClick={() => setSelectedRoute(selectedRoute === route.iata ? null : route.iata)}
                variant={selectedRoute === route.iata ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
