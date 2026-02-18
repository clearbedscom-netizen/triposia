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
        <Box>
          {/* Title and Summary */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h1"
              gutterBottom
              sx={{
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                fontWeight: 700,
                lineHeight: 1.2,
                mb: 2,
                color: 'text.primary',
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
                mb: 2.5,
              }}
            >
              {airlineName} operates {totalDestinations} direct destination{totalDestinations !== 1 ? 's' : ''} from {cityName} ({airportCode}). Popular routes include {topRoutes.slice(0, 3).map(r => r.display).join(', ')}{topRoutes.length > 3 ? `, and ${topRoutes.length - 3} more` : ''}. Flights operate daily with {totalWeeklyFlights.toLocaleString()}+ weekly departures.
            </Typography>
            {topRoutes.length > 0 && (
              <Box sx={{ mt: 2.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500 }}>
                  Most frequent routes:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {topRoutes.slice(0, 5).map((route, idx) => (
                    <Chip
                      key={idx}
                      label={`${route.display} (${route.weeklyFlights}/week)`}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.75rem',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* Data Cards - Below heading and description */}
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    boxShadow: 3,
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <FlightIcon sx={{ fontSize: { xs: 28, md: 32 }, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                  {totalDestinations}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                  Destinations
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    boxShadow: 3,
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ScheduleIcon sx={{ fontSize: { xs: 28, md: 32 }, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                  {totalWeeklyFlights.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                  Weekly Flights
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    boxShadow: 3,
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <AirlinesIcon sx={{ fontSize: { xs: 28, md: 32 }, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                  {airlineName.split(' ')[0]}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                  Airline
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    boxShadow: 3,
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <PublicIcon sx={{ fontSize: { xs: 28, md: 32 }, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                  {internationalCount}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                  International
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
