'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  Link as MuiLink,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FlightIcon from '@mui/icons-material/Flight';
import AirlineIcon from '@mui/icons-material/AirlineStops';
import Link from 'next/link';
import ReliabilityBadge from './ReliabilityBadge';

interface Route {
  iata: string;
  city: string;
  display: string;
  flights_per_day: string;
  flights_per_week?: number;
  distance_km?: number;
  average_duration?: string;
  seasonal?: boolean;
  reliability?: 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited';
  route_growth?: 'growing' | 'stable' | 'declining';
}

interface AirlineGroup {
  code: string;
  name: string;
  destination_count: number;
  weekly_flights: number;
  routes: Route[];
  reliability?: 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited';
}

interface RoutesByAirlineGroupProps {
  airlineGroups: AirlineGroup[];
  originIata: string;
}

export default function RoutesByAirlineGroup({
  airlineGroups,
  originIata,
}: RoutesByAirlineGroupProps) {
  const [expandedAirline, setExpandedAirline] = useState<string | false>(false);

  const handleChange = (airlineCode: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAirline(isExpanded ? airlineCode : false);
  };

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <AirlineIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Routes by Airline
        </Typography>
      </Box>

      {airlineGroups.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No airline data available
        </Typography>
      ) : (
        <Box>
          {airlineGroups.map((airline) => {
            const routeSlug = `${originIata.toLowerCase()}-${airline.code.toLowerCase()}`;
            const topRoutes = airline.routes.slice(0, 5);

            return (
              <Accordion
                key={airline.code}
                expanded={expandedAirline === airline.code}
                onChange={handleChange(airline.code)}
                sx={{
                  mb: 1,
                  '&:before': { display: 'none' },
                  boxShadow: 1,
                  '&.Mui-expanded': {
                    boxShadow: 2,
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {airline.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                          <Chip
                            label={`${airline.destination_count} destinations`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`${airline.weekly_flights} weekly flights`}
                            size="small"
                            variant="outlined"
                          />
                          {airline.reliability && (
                            <ReliabilityBadge level={airline.reliability} size="small" />
                          )}
                        </Box>
                      </Box>
                    </Box>
                    <MuiLink
                      component={Link}
                      href={`/airlines/${airline.code.toLowerCase()}/${originIata.toLowerCase()}`}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        textDecoration: 'none',
                        color: 'primary.main',
                        fontWeight: 500,
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      View all →
                    </MuiLink>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                    Top Routes
                  </Typography>
                  <Grid container spacing={2}>
                    {topRoutes.map((route) => {
                      const routeSlug = `${originIata.toLowerCase()}-${route.iata.toLowerCase()}`;
                      return (
                        <Grid item xs={12} sm={6} md={4} key={route.iata}>
                          <Paper
                            component={Link}
                            href={`/flights/${routeSlug}`}
                            sx={{
                              p: 2,
                              textDecoration: 'none',
                              height: '100%',
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <FlightIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                {route.display}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              {route.flights_per_day} daily
                              {route.flights_per_week && ` • ${route.flights_per_week} weekly`}
                            </Typography>
                            {route.distance_km && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {Math.round(route.distance_km)} km
                                {route.average_duration && ` • ${route.average_duration}`}
                              </Typography>
                            )}
                            {route.seasonal && (
                              <Chip
                                label="Seasonal"
                                size="small"
                                color="warning"
                                variant="outlined"
                                sx={{ mt: 0.5 }}
                              />
                            )}
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                  {airline.routes.length > 5 && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <MuiLink
                        component={Link}
                        href={`/airlines/${airline.code.toLowerCase()}/${originIata.toLowerCase()}`}
                        sx={{
                          textDecoration: 'none',
                          color: 'primary.main',
                          fontWeight: 500,
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        View all {airline.routes.length} routes →
                      </MuiLink>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
