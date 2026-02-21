'use client';

import { useMemo, memo } from 'react';
import { Box } from '@mui/material';
import RouteFilterWrapper from './RouteFilterWrapper';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const RoutesByAirlineGroup = dynamic(() => import('./RoutesByAirlineGroup'), {
  ssr: false,
  loading: () => <Box sx={{ p: 3, textAlign: 'center' }}>Loading routes by airline...</Box>,
});

const RoutesByRegionGroup = dynamic(() => import('./RoutesByRegionGroup'), {
  ssr: false,
  loading: () => <Box sx={{ p: 3, textAlign: 'center' }}>Loading routes by region...</Box>,
});

const SortableRouteTable = dynamic(() => import('./SortableRouteTable'), {
  ssr: false,
  loading: () => <Box sx={{ p: 3, textAlign: 'center' }}>Loading route table...</Box>,
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

interface AirlineGroup {
  code: string;
  name: string;
  destination_count: number;
  weekly_flights: number;
  routes: Route[];
  reliability?: 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited';
}

interface RegionGroup {
  name: string;
  routes: Route[];
  count?: number;
}

interface FilterableRoutesSectionProps {
  routes: Route[];
  airlineGroups: AirlineGroup[];
  regionGroups: RegionGroup[];
  airlines: Airline[];
  originIata: string;
  originCountry?: string;
  routeAirlinesMap: Map<string, string[]>;
}

function FilterableRoutesSection({
  routes,
  airlineGroups,
  regionGroups,
  airlines,
  originIata,
  originCountry,
  routeAirlinesMap,
}: FilterableRoutesSectionProps) {
  // Memoize filtered airline groups calculation
  const getFilteredAirlineGroups = useMemo(() => {
    return (filteredRoutes: Route[]): AirlineGroup[] => {
      const filteredRouteIatas = new Set(filteredRoutes.map(r => r.iata));
      
      return airlineGroups.map(group => ({
        ...group,
        routes: group.routes.filter(route => filteredRouteIatas.has(route.iata)),
      })).filter(group => group.routes.length > 0);
    };
  }, [airlineGroups]);

  // Memoize filtered region groups calculation
  const getFilteredRegionGroups = useMemo(() => {
    return (filteredRoutes: Route[]): RegionGroup[] => {
      const filteredRouteIatas = new Set(filteredRoutes.map(r => r.iata));
      
      return regionGroups.map(group => {
        const filteredRoutesInGroup = group.routes.filter(route => filteredRouteIatas.has(route.iata));
        return {
          ...group,
          routes: filteredRoutesInGroup,
          count: filteredRoutesInGroup.length,
        };
      }).filter(group => group.routes.length > 0);
    };
  }, [regionGroups]);

  return (
    <RouteFilterWrapper
      routes={routes}
      airlines={airlines}
      routeAirlinesMap={routeAirlinesMap}
      showFilters={true}
    >
      {(filteredRoutes) => {
        // Memoize filtered groups to avoid recalculation
        const filteredAirlineGroups = getFilteredAirlineGroups(filteredRoutes);
        const filteredRegionGroups = getFilteredRegionGroups(filteredRoutes);
        
        return (
          <>
            {/* Routes by Airline */}
            {filteredAirlineGroups.length > 0 && (
              <Box id="routes-by-airline-section" sx={{ mb: 4, scrollMarginTop: '100px' }}>
                <RoutesByAirlineGroup
                  airlineGroups={filteredAirlineGroups as any}
                  originIata={originIata}
                />
              </Box>
            )}

            {/* Routes by Region */}
            {filteredRegionGroups.length > 0 && (
              <Box id="routes-by-region-section" sx={{ mb: 4, scrollMarginTop: '100px' }}>
                <RoutesByRegionGroup
                  regionGroups={filteredRegionGroups as any}
                  originIata={originIata}
                  originCountry={originCountry}
                />
              </Box>
            )}

            {/* Sortable Route Table */}
            {filteredRoutes.length > 0 && (
              <Box id="routes-table-section" sx={{ mb: 4, scrollMarginTop: '100px' }}>
                <SortableRouteTable
                  routes={filteredRoutes as any}
                  originIata={originIata}
                  airlines={airlines}
                  originCountry={originCountry}
                  routeAirlinesMap={routeAirlinesMap}
                />
              </Box>
            )}
          </>
        );
      }}
    </RouteFilterWrapper>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(FilterableRoutesSection);
