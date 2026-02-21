'use client';

import { useMemo, memo } from 'react';
import { Box, Typography } from '@mui/material';
import RouteFilterWrapper from './RouteFilterWrapper';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const FlightTable = dynamic(() => import('@/components/ui/FlightTableLazy'), {
  ssr: false,
  loading: () => <Box sx={{ p: 3, textAlign: 'center' }}>Loading flight table...</Box>,
});

const RouteDataVisualizationLazy = dynamic(() => import('./RouteDataVisualizationLazy'), {
  ssr: false,
  loading: () => <Box sx={{ p: 3, textAlign: 'center' }}>Loading visualizations...</Box>,
});

interface Flight {
  flight_number?: string;
  airline_name?: string;
  airline_iata?: string;
  departure_time?: string;
  arrival_time?: string;
  duration?: string;
  aircraft_type?: string;
  origin_iata?: string;
  destination_iata?: string;
  [key: string]: any;
}

interface Airline {
  code: string;
  name: string;
  iata?: string;
}

interface FilterableFlightsSectionProps {
  flights: Flight[];
  airlines: Airline[];
  origin: string;
  destination: string;
  originDisplay: string;
  destinationDisplay: string;
  showVisualizations?: boolean;
}

function FilterableFlightsSection({
  flights,
  airlines,
  origin,
  destination,
  originDisplay,
  destinationDisplay,
  showVisualizations = true,
}: FilterableFlightsSectionProps) {
  // Convert flights to route-like format for filtering
  const routesFromFlights = useMemo(() => {
    return flights.map(flight => ({
      iata: destination,
      city: destinationDisplay,
      display: destinationDisplay,
      flights_per_day: '1',
      flights_per_week: 1,
      distance_km: undefined, // Route pages already show distance
      is_domestic: flight.is_domestic,
      country: flight.destination_country,
      airline_iata: flight.airline_iata,
      airline_name: flight.airline_name,
      flight: flight, // Keep original flight data
    }));
  }, [flights, destination, destinationDisplay]);

  // Create airline-route mapping for filtering
  const routeAirlinesMap = useMemo(() => {
    const map = new Map<string, string[]>();
    routesFromFlights.forEach(route => {
      if (route.airline_iata) {
        map.set(route.iata, [route.airline_iata]);
      }
    });
    return map;
  }, [routesFromFlights]);

  // Filter flights based on filtered routes - extract airline codes from filtered routes
  const getFilteredFlights = (filteredRoutes: Array<typeof routesFromFlights[0]>): Flight[] => {
    // Get unique airline codes from filtered routes
    const allowedAirlines = new Set(
      filteredRoutes
        .map((r: any) => r.airline_iata)
        .filter(Boolean)
    );
    
    // If no airlines filtered, show all flights
    if (allowedAirlines.size === 0) {
      return flights;
    }
    
    // Filter flights by allowed airlines
    return flights.filter(flight => {
      const flightAirline = flight.airline_iata?.toUpperCase();
      return flightAirline && allowedAirlines.has(flightAirline);
    });
  };

  return (
    <RouteFilterWrapper
      routes={routesFromFlights}
      airlines={airlines}
      routeAirlinesMap={routeAirlinesMap}
      showFilters={true}
    >
      {(filteredRoutes) => {
        const filteredFlights = getFilteredFlights(filteredRoutes as Array<typeof routesFromFlights[0]>);
        
        return (
          <>
            {/* Visual Analytics Block */}
            {showVisualizations && filteredFlights.length > 0 && (
              <Box id="analytics-section" sx={{ mb: 4, scrollMarginTop: '100px' }}>
                <RouteDataVisualizationLazy
                  routes={filteredRoutes.map(r => ({
                    iata: r.iata,
                    display: r.display || r.city || r.iata,
                    flights_per_day: r.flights_per_day || '0',
                    flights_per_week: r.flights_per_week || 0,
                    is_domestic: r.is_domestic,
                    distance_km: r.distance_km,
                  }))}
                  airlines={airlines.map(a => ({
                    code: a.code,
                    name: a.name,
                    routeCount: filteredFlights.filter(f => f.airline_iata === a.iata || f.airline_iata === a.code).length,
                  }))}
                  originDisplay={originDisplay}
                />
              </Box>
            )}

            {/* Filtered Flight Table */}
            {filteredFlights.length > 0 && (
              <Box id="flights-table-section" sx={{ mb: 4, scrollMarginTop: '100px' }}>
                  <FlightTable
                    flights={filteredFlights as any}
                    showOrigin={true}
                    showDestination={true}
                  />
              </Box>
            )}

            {filteredFlights.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No flights match the selected filters.
                </Typography>
              </Box>
            )}
          </>
        );
      }}
    </RouteFilterWrapper>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(FilterableFlightsSection);
