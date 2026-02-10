'use client';

import { useState, useMemo } from 'react';
import { Box, Paper, Tabs, Tab, Typography, Grid } from '@mui/material';
import FlightTable from '@/components/ui/FlightTable';
import Link from 'next/link';
import RouteFilters, { RouteTypeFilter, StopFilter } from '@/components/flights/RouteFilters';

interface AirlineAirportTabsProps {
  airline: any;
  code: string;
  iata: string;
  airportDisplay: string;
  flightsFrom: any[];
  flightsTo: any[];
  destinations: Array<{ iata: string; city: string; flights_per_day: string; display?: string; is_domestic?: boolean; country?: string }>;
  origins: Array<{ iata: string; city: string; flights_per_day: string; display?: string; is_domestic?: boolean; country?: string }>;
  airportNameMap?: Map<string, string>;
}

export default function AirlineAirportTabs({
  airline,
  code,
  iata,
  airportDisplay,
  flightsFrom,
  flightsTo,
  destinations,
  origins,
  airportNameMap,
}: AirlineAirportTabsProps) {
  const [tabValue, setTabValue] = useState(0);
  const [routeTypeFilter, setRouteTypeFilter] = useState<RouteTypeFilter>('all');
  const [stopFilter, setStopFilter] = useState<StopFilter>('all');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter destinations based on selected filters
  const filteredDestinations = useMemo(() => {
    let filtered = destinations;

    // Apply route type filter (domestic/international)
    if (routeTypeFilter === 'domestic') {
      filtered = filtered.filter(d => d.is_domestic === true);
    } else if (routeTypeFilter === 'international') {
      filtered = filtered.filter(d => d.is_domestic === false);
    }

    // Apply stop filter (for now, all routes are considered direct)
    if (stopFilter === 'direct') {
      filtered = filtered;
    } else if (stopFilter === 'one-stop' || stopFilter === 'two-stop') {
      filtered = [];
    }

    return filtered;
  }, [destinations, routeTypeFilter, stopFilter]);

  // Filter origins based on selected filters
  const filteredOrigins = useMemo(() => {
    let filtered = origins;

    // Apply route type filter (domestic/international)
    if (routeTypeFilter === 'domestic') {
      filtered = filtered.filter(o => o.is_domestic === true);
    } else if (routeTypeFilter === 'international') {
      filtered = filtered.filter(o => o.is_domestic === false);
    }

    // Apply stop filter (for now, all routes are considered direct)
    if (stopFilter === 'direct') {
      filtered = filtered;
    } else if (stopFilter === 'one-stop' || stopFilter === 'two-stop') {
      filtered = [];
    }

    return filtered;
  }, [origins, routeTypeFilter, stopFilter]);

  return (
    <>
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="airline airport tabs">
          <Tab label={`Destinations (${destinations.length})`} />
          {origins.length > 0 && <Tab label={`Origins (${origins.length})`} />}
          <Tab label={`Departures (${flightsFrom.length})`} />
          <Tab label={`Arrivals (${flightsTo.length})`} />
        </Tabs>
      </Paper>

      {/* Destinations Tab - Airline-City Page: Focus on "cities with flights to" */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', mb: 2, textAlign: 'left' }}>
            Cities with {airline.name} flights to {airportDisplay.includes('(') ? airportDisplay.split('(')[0].trim() : airportDisplay} ({filteredDestinations.length} of {destinations.length})
          </Typography>
          
          {/* Filters */}
          <RouteFilters
            routeType={routeTypeFilter}
            onRouteTypeChange={setRouteTypeFilter}
            stopType={stopFilter}
            onStopTypeChange={setStopFilter}
            showStopFilter={true}
          />
          
          {filteredDestinations.length > 0 ? (
            <Grid container spacing={2}>
              {filteredDestinations.map((dest) => {
                const routeFlights = flightsFrom.filter(f => f.destination_iata === dest.iata);
                return (
                  <Grid item xs={12} sm={6} md={4} key={dest.iata}>
                    <Paper
                      component={Link}
                      href={`/airlines/${code.toLowerCase()}/${iata.toLowerCase()}-${dest.iata.toLowerCase()}`}
                      sx={{
                        p: 3,
                        textDecoration: 'none',
                        display: 'block',
                        '&:hover': { bgcolor: 'action.hover', boxShadow: 2 },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {dest.display || dest.iata}
                        </Typography>
                        {dest.is_domestic !== undefined && (
                          <Typography
                            variant="caption"
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                              bgcolor: dest.is_domestic ? 'success.light' : 'info.light',
                              color: dest.is_domestic ? 'success.dark' : 'info.dark',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          >
                            {dest.is_domestic ? 'Domestic' : 'International'}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {dest.display || dest.city}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {routeFlights.length} flight{routeFlights.length !== 1 ? 's' : ''}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No destinations found.
            </Typography>
          )}
        </Box>
      )}

      {/* Origins Tab */}
      {origins.length > 0 && tabValue === 1 && (
        <Box>
          <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', mb: 2, textAlign: 'left' }}>
            Origins to {airportDisplay} ({filteredOrigins.length} of {origins.length})
          </Typography>
          
          {/* Filters */}
          <RouteFilters
            routeType={routeTypeFilter}
            onRouteTypeChange={setRouteTypeFilter}
            stopType={stopFilter}
            onStopTypeChange={setStopFilter}
            showStopFilter={true}
          />
          
          <Grid container spacing={2}>
            {filteredOrigins.map((origin) => {
              const routeFlights = flightsTo.filter(f => f.origin_iata === origin.iata);
              return (
                <Grid item xs={12} sm={6} md={4} key={origin.iata}>
                  <Paper
                    component={Link}
                    href={`/airlines/${code.toLowerCase()}/${origin.iata.toLowerCase()}-${iata.toLowerCase()}`}
                    sx={{
                      p: 3,
                      textDecoration: 'none',
                      display: 'block',
                      '&:hover': { bgcolor: 'action.hover', boxShadow: 2 },
                    }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {origin.display || origin.iata}
                        </Typography>
                        {origin.is_domestic !== undefined && (
                          <Typography
                            variant="caption"
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                              bgcolor: origin.is_domestic ? 'success.light' : 'info.light',
                              color: origin.is_domestic ? 'success.dark' : 'info.dark',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          >
                            {origin.is_domestic ? 'Domestic' : 'International'}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {origin.display || origin.city}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {routeFlights.length} flight{routeFlights.length !== 1 ? 's' : ''}
                      </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Departures Tab */}
      {tabValue === (origins.length > 0 ? 2 : 1) && (
        <Box>
          <Typography variant="h2" gutterBottom sx={{ fontSize: '1.75rem', mb: 2, textAlign: 'left' }}>
            {airline.name} Departures from {airportDisplay}
          </Typography>
          {flightsFrom.length > 0 ? (
            <FlightTable flights={flightsFrom} showDestination airportNameMap={airportNameMap} />
          ) : (
            <Typography variant="body1" color="text.secondary">
              No departures found.
            </Typography>
          )}
        </Box>
      )}

      {/* Arrivals Tab */}
      {tabValue === (origins.length > 0 ? 3 : 2) && (
        <Box>
          <Typography variant="h2" gutterBottom sx={{ fontSize: '1.75rem', mb: 2, textAlign: 'left' }}>
            {airline.name} Arrivals to {airportDisplay}
          </Typography>
          {flightsTo.length > 0 ? (
            <FlightTable flights={flightsTo} showOrigin airportNameMap={airportNameMap} />
          ) : (
            <Typography variant="body1" color="text.secondary">
              No arrivals found.
            </Typography>
          )}
        </Box>
      )}
    </>
  );
}

