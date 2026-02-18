'use client';

import { Box, Typography, Grid, Paper, Chip } from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import AirlinesIcon from '@mui/icons-material/Airlines';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PublicIcon from '@mui/icons-material/Public';

interface AirlineAirportHeroSectionProps {
  airlineName: string;
  airportName: string;
  airportCode: string;
  cityName: string;
  totalDestinations: number;
  totalWeeklyFlights: number;
  internationalCount: number;
  topRoutes: Array<{
    destination: string;
    display: string;
    weeklyFlights: number;
  }>;
}

export default function AirlineAirportHeroSection({
  airlineName,
  airportName,
  airportCode,
  cityName,
  totalDestinations,
  totalWeeklyFlights,
  internationalCount,
  topRoutes,
}: AirlineAirportHeroSectionProps) {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Hero Section */}
      <Paper
        sx={{
          p: { xs: 2, md: 4 },
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Left Side: Title and Summary */}
          <Grid item xs={12} md={7}>
            <Typography
              variant="h1"
              gutterBottom
              sx={{
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                fontWeight: 700,
                lineHeight: 1.2,
                mb: 2,
              }}
            >
              {airlineName} Flights from {cityName} ({airportCode})
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', sm: '1.125rem' },
                lineHeight: 1.7,
                color: 'text.secondary',
                mb: 2,
              }}
            >
              {airlineName} operates{' '}
              <strong>{totalWeeklyFlights.toLocaleString()} direct flights per week</strong> from{' '}
              {airportName} ({airportCode}) to{' '}
              <strong>{totalDestinations} destination{totalDestinations !== 1 ? 's' : ''}</strong>
              {internationalCount > 0 && (
                <>
                  {' '}
                  including <strong>{internationalCount} international route{internationalCount !== 1 ? 's' : ''}</strong>
                </>
              )}
              . Updated 2026.
            </Typography>
            {topRoutes.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Most frequent routes:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {topRoutes.slice(0, 5).map((route, idx) => (
                    <Chip
                      key={idx}
                      label={`${route.display} (${route.weeklyFlights}/week)`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>

          {/* Right Side: Data Cards */}
          <Grid item xs={12} md={5}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={6} md={12}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: 'primary.main',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <FlightIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {totalDestinations}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Destinations
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={6} md={12}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: 'primary.main',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <ScheduleIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {totalWeeklyFlights.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Weekly Flights
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={6} md={12}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: 'primary.main',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <AirlinesIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {airlineName.split(' ')[0]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Airline
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={6} md={12}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: 'primary.main',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <PublicIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {internationalCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    International
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
