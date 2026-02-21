'use client';

import { useState, useMemo, memo, useCallback } from 'react';
import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import { RouteTypeFilter, StopFilter, DistanceFilter } from './RouteFilters';

// Lazy load RouteFilters component
const RouteFilters = dynamic(() => import('./RouteFilters'), {
  ssr: false,
  loading: () => <Box sx={{ mb: 3, minHeight: 100 }}>Loading filters...</Box>,
});

interface Route {
  iata: string;
  city?: string;
  display?: string;
  flights_per_day?: string;
  flights_per_week?: number;
  distance_km?: number;
  is_domestic?: boolean;
  country?: string;
  [key: string]: any;
}

interface Airline {
  code: string;
  name: string;
  iata?: string;
}

interface RouteFilterWrapperProps {
  routes: Route[];
  airlines: Airline[];
  routeAirlinesMap?: Map<string, string[]>; // Maps route IATA to airline codes
  children: (filteredRoutes: Route[]) => React.ReactNode;
  showFilters?: boolean;
}

function RouteFilterWrapper({
  routes,
  airlines,
  routeAirlinesMap,
  children,
  showFilters = true,
}: RouteFilterWrapperProps) {
  const [routeType, setRouteType] = useState<RouteTypeFilter>('all');
  const [stopType, setStopType] = useState<StopFilter>('all');
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>('all');
  const [distanceRange, setDistanceRange] = useState<[number, number]>([0, 20000]);

  // Calculate max distance from routes
  const maxDistance = useMemo(() => {
    const distances = routes
      .map(r => r.distance_km)
      .filter((d): d is number => d !== undefined && d !== null);
    return distances.length > 0 ? Math.max(...distances) : 20000;
  }, [routes]);

  // Optimize filter callbacks
  const handleRouteTypeChange = useCallback((value: RouteTypeFilter) => {
    setRouteType(value);
  }, []);

  const handleStopTypeChange = useCallback((value: StopFilter) => {
    setStopType(value);
  }, []);

  const handleAirlinesChange = useCallback((airlines: string[]) => {
    setSelectedAirlines(airlines);
  }, []);

  const handleDistanceFilterChange = useCallback((value: DistanceFilter) => {
    setDistanceFilter(value);
  }, []);

  const handleDistanceRangeChange = useCallback((range: [number, number]) => {
    setDistanceRange(range);
  }, []);

  // Apply filters to routes - optimized with early returns
  const filteredRoutes = useMemo(() => {
    // Early return if no filters applied
    if (routeType === 'all' && 
        selectedAirlines.length === 0 && 
        distanceFilter === 'all' && 
        stopType === 'all') {
      return routes;
    }

    let filtered = routes;

    // Filter by route type (domestic/international) - most selective first
    if (routeType === 'domestic') {
      filtered = filtered.filter(r => r.is_domestic === true);
    } else if (routeType === 'international') {
      filtered = filtered.filter(r => r.is_domestic === false);
    }

    // Filter by airlines (only if airlines are selected)
    if (selectedAirlines.length > 0 && routeAirlinesMap) {
      const selectedAirlinesSet = new Set(selectedAirlines.map(a => a.toUpperCase()));
      filtered = filtered.filter(route => {
        const routeAirlines = routeAirlinesMap.get(route.iata) || [];
        return routeAirlines.some(routeAirline => 
          selectedAirlinesSet.has(routeAirline.toUpperCase())
        );
      });
    }

    // Filter by distance
    if (distanceFilter !== 'all') {
      filtered = filtered.filter(route => {
        const distance = route.distance_km;
        if (distance === undefined || distance === null) return false;
        
        if (distanceFilter === 'short') {
          return distance < 1000;
        } else if (distanceFilter === 'medium') {
          return distance >= 1000 && distance <= 3000;
        } else if (distanceFilter === 'long') {
          return distance > 3000;
        } else if (distanceFilter === 'custom') {
          return distance >= distanceRange[0] && distance <= distanceRange[1];
        }
        return true;
      });
    }

    // Filter by stops (for now, all routes are direct)
    if (stopType === 'one-stop' || stopType === 'two-stop') {
      filtered = [];
    }

    return filtered;
  }, [routes, routeType, stopType, selectedAirlines, distanceFilter, distanceRange, routeAirlinesMap]);

  return (
    <Box>
      {showFilters && (
        <RouteFilters
          routeType={routeType}
          onRouteTypeChange={handleRouteTypeChange}
          stopType={stopType}
          onStopTypeChange={handleStopTypeChange}
          showStopFilter={false}
          selectedAirlines={selectedAirlines}
          onAirlinesChange={handleAirlinesChange}
          availableAirlines={airlines}
          distanceFilter={distanceFilter}
          onDistanceFilterChange={handleDistanceFilterChange}
          distanceRange={distanceRange}
          onDistanceRangeChange={handleDistanceRangeChange}
          maxDistance={maxDistance}
        />
      )}
      {children(filteredRoutes)}
    </Box>
  );
}

// Memoize the component to prevent unnecessary re-renders
const MemoizedRouteFilterWrapper = memo(RouteFilterWrapper);
export default MemoizedRouteFilterWrapper;
