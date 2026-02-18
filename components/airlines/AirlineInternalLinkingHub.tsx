'use client';

import { Box, Typography, Paper, Grid, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import FlightIcon from '@mui/icons-material/Flight';
import AirlinesIcon from '@mui/icons-material/Airlines';
import PublicIcon from '@mui/icons-material/Public';
import PolicyIcon from '@mui/icons-material/Policy';

interface RelatedAirport {
  iata: string;
  display: string;
  routeCount?: number;
}

interface RelatedRoute {
  routeSlug: string;
  display: string;
  weeklyFlights?: number;
}

interface AirlineInternalLinkingHubProps {
  airlineName: string;
  airlineCode: string;
  airportIata: string;
  airportDisplay: string;
  relatedAirports?: RelatedAirport[];
  relatedRoutes?: RelatedRoute[];
  countryHubLink?: { url: string; label: string };
}

export default function AirlineInternalLinkingHub({
  airlineName,
  airlineCode,
  airportIata,
  airportDisplay,
  relatedAirports = [],
  relatedRoutes = [],
  countryHubLink,
}: AirlineInternalLinkingHubProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 3 }}>
        Related Pages & Resources
      </Typography>
      
      <Grid container spacing={3}>
        {/* All Airlines at Airport */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AirlinesIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                All Airlines at {airportDisplay}
              </Typography>
            </Box>
            <MuiLink
              component={Link}
              href={`/flights/${airportIata.toLowerCase()}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                textDecoration: 'none',
                color: 'primary.main',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              <FlightIcon sx={{ fontSize: 18 }} />
              View all airlines and routes from {airportDisplay}
            </MuiLink>
          </Paper>
        </Grid>

        {/* Other {Airline} Airport Pages */}
        {relatedAirports.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FlightIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  More {airlineName} Airport Pages
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {relatedAirports.slice(0, 5).map((airport) => (
                  <MuiLink
                    key={airport.iata}
                    component={Link}
                    href={`/airlines/${airlineCode}/${airport.iata.toLowerCase()}`}
                    sx={{
                      textDecoration: 'none',
                      color: 'text.primary',
                      '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                    }}
                  >
                    {airlineName} from {airport.display}
                    {airport.routeCount && ` (${airport.routeCount} routes)`}
                  </MuiLink>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Top Routes */}
        {relatedRoutes.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FlightIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Top {airlineName} Routes from {airportDisplay}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {relatedRoutes.slice(0, 5).map((route) => (
                  <MuiLink
                    key={route.routeSlug}
                    component={Link}
                    href={`/airlines/${airlineCode}/${route.routeSlug}`}
                    sx={{
                      textDecoration: 'none',
                      color: 'text.primary',
                      '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                    }}
                  >
                    {route.display}
                    {route.weeklyFlights && ` (${route.weeklyFlights}/week)`}
                  </MuiLink>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Country Hub */}
        {countryHubLink && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PublicIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Country Hub
                </Typography>
              </Box>
              <MuiLink
                component={Link}
                href={countryHubLink.url}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textDecoration: 'none',
                  color: 'primary.main',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {countryHubLink.label}
              </MuiLink>
            </Paper>
          </Grid>
        )}

        {/* Airline Policy Pages */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PolicyIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {airlineName} Policies
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <MuiLink
                component={Link}
                href={`/airlines/${airlineCode}/cancellation-policy`}
                sx={{
                  textDecoration: 'none',
                  color: 'text.primary',
                  '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                }}
              >
                Cancellation Policy
              </MuiLink>
              <MuiLink
                component={Link}
                href={`/airlines/${airlineCode}/change-fee`}
                sx={{
                  textDecoration: 'none',
                  color: 'text.primary',
                  '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                }}
              >
                Change Fee Policy
              </MuiLink>
              <MuiLink
                component={Link}
                href={`/airlines/${airlineCode}`}
                sx={{
                  textDecoration: 'none',
                  color: 'text.primary',
                  '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                }}
              >
                {airlineName} Overview
              </MuiLink>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
