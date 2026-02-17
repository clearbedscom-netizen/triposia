'use client';

import { Box, Typography, Grid, Paper } from '@mui/material';
import { Flight, Airlines, TrendingUp, Public } from '@mui/icons-material';

interface AirportHeroSectionProps {
  airportName: string;
  airportCode: string;
  totalDestinations: number;
  totalAirlines: number;
  totalWeeklyFlights: number;
  internationalCount?: number;
}

export default function AirportHeroSection({
  airportName,
  airportCode,
  totalDestinations,
  totalAirlines,
  totalWeeklyFlights,
  internationalCount = 0,
}: AirportHeroSectionProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={3} alignItems="center">
        {/* Left Side - Title and Subtitle */}
        <Grid item xs={12} md={6}>
          <Typography 
            variant="h1" 
            sx={{ 
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              fontWeight: 700,
              mb: 1.5,
              lineHeight: 1.2,
            }}
          >
            Direct Flights from {airportName} ({airportCode})
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              fontSize: { xs: '0.95rem', sm: '1.1rem' },
              color: 'text.secondary',
              lineHeight: 1.6,
            }}
          >
            {airportName} serves {totalDestinations} direct destination{totalDestinations !== 1 ? 's' : ''} across {totalAirlines} airline{totalAirlines !== 1 ? 's' : ''}.
          </Typography>
        </Grid>

        {/* Right Side - Data Cards */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: 'primary.main',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <Flight sx={{ fontSize: 28, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {totalDestinations}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Destinations
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: 'primary.main',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <Airlines sx={{ fontSize: 28, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {totalAirlines}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Airlines
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: 'primary.main',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <TrendingUp sx={{ fontSize: 28, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {totalWeeklyFlights.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Weekly Flights
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: 'primary.main',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <Public sx={{ fontSize: 28, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
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
    </Box>
  );
}
