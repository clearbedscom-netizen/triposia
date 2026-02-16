'use client';

import { Box, Typography, Grid, Paper, Link as MuiLink, Chip } from '@mui/material';
import Link from 'next/link';
import FlightIcon from '@mui/icons-material/Flight';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import RouteIcon from '@mui/icons-material/Route';
import PublicIcon from '@mui/icons-material/Public';

interface RelatedLinksSectionProps {
  relatedAirports?: Array<{ iata: string; city?: string; display?: string; name?: string; shouldIndex?: boolean }>;
  airlinePages?: Array<{ code: string; name: string; airportPage: string; routeCount?: number }>;
  topRoutes?: Array<{ origin_iata: string; destination_iata: string; destination_city: string; routePage: string; flights_per_day?: string }>;
  countryHub?: { url: string; label: string } | null;
  maxDisplay?: number;
}

export default function RelatedLinksSection({
  relatedAirports = [],
  airlinePages = [],
  topRoutes = [],
  countryHub,
  maxDisplay = 20,
}: RelatedLinksSectionProps) {
  // Filter to only indexable items and limit
  const displayAirports = relatedAirports.filter(a => a.shouldIndex !== false).slice(0, maxDisplay);
  const displayAirlines = airlinePages.slice(0, 10);
  const displayRoutes = topRoutes.slice(0, 10);

  if (displayAirports.length === 0 && displayAirlines.length === 0 && displayRoutes.length === 0 && !countryHub) {
    return null;
  }

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 3, textAlign: 'left' }}>
        Related Pages
      </Typography>
      
      <Grid container spacing={2}>
        {/* Related Airports */}
        {displayAirports.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AirplanemodeActiveIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  Related Airports
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {displayAirports.map(airport => (
                  <MuiLink
                    key={airport.iata}
                    component={Link}
                    href={`/flights/${airport.iata.toLowerCase()}`}
                    sx={{ 
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    <Chip
                      label={airport.display || airport.city || airport.iata}
                      size="small"
                      icon={<FlightIcon sx={{ fontSize: 14 }} />}
                      clickable
                      sx={{
                        '&:hover': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                        },
                      }}
                    />
                  </MuiLink>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Airline Pages */}
        {displayAirlines.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AirplanemodeActiveIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  Airlines Operating Here
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {displayAirlines.map(airline => (
                  <MuiLink
                    key={airline.code}
                    component={Link}
                    href={airline.airportPage}
                    sx={{ 
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {airline.name}
                      </Typography>
                      {airline.routeCount !== undefined && (
                        <Chip label={`${airline.routeCount} routes`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </MuiLink>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Top Routes */}
        {displayRoutes.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RouteIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  Top Routes
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {displayRoutes.map((route, idx) => (
                  <MuiLink
                    key={`${route.origin_iata}-${route.destination_iata}`}
                    component={Link}
                    href={route.routePage}
                    sx={{ 
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={`#${idx + 1}`} size="small" color="primary" sx={{ minWidth: 40 }} />
                        <Typography variant="body2">
                          {route.origin_iata} → {route.destination_iata}
                        </Typography>
                      </Box>
                      {route.flights_per_day && (
                        <Typography variant="caption" color="text.secondary">
                          {route.flights_per_day}
                        </Typography>
                      )}
                    </Box>
                  </MuiLink>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Country Hub */}
        {countryHub && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PublicIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  Country Hub
                </Typography>
              </Box>
              <MuiLink
                component={Link}
                href={countryHub.url}
                sx={{ 
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                  {countryHub.label} →
                </Typography>
              </MuiLink>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
