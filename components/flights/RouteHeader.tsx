'use client';

import { Box, Typography, Paper, Grid, Avatar } from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { getAirportImageUrl } from '@/lib/imagekit';
import { formatAirportDisplay } from '@/lib/formatting-client';

interface RouteHeaderProps {
  origin: string;
  destination: string;
  originCity?: string;
  originCountry?: string;
  destinationCity?: string;
  destinationCountry?: string;
  originDisplay?: string; // Pre-formatted display string (e.g., "Delhi (DEL)")
  destinationDisplay?: string; // Pre-formatted display string (e.g., "Hisar (HSR)")
  distance?: string;
  duration?: string;
  airlinesCount?: number;
  flightsPerDay?: string;
  airlineName?: string; // Optional airline name for airline-specific pages
}

export default function RouteHeader({
  origin,
  destination,
  originCity,
  originCountry,
  destinationCity,
  destinationCountry,
  originDisplay: propOriginDisplay,
  destinationDisplay: propDestinationDisplay,
  distance,
  duration,
  airlinesCount,
  flightsPerDay,
  airlineName,
}: RouteHeaderProps) {
  // Use provided display strings if available, otherwise format from city names
  const originDisplay = propOriginDisplay || formatAirportDisplay(origin, originCity);
  const destinationDisplay = propDestinationDisplay || formatAirportDisplay(destination, destinationCity);

  // Determine heading text based on whether this is an airline-specific page
  const headingText = airlineName
    ? `${airlineName} flights from ${originDisplay} to ${destinationDisplay}`
    : `Direct (non-stop) flights from ${originDisplay} to ${destinationDisplay}`;

  // Determine description text - Route-specific only (no city-wide keywords)
  const descriptionText = airlineName
    ? `${airlineName} operates scheduled nonstop flights between ${originDisplay} and ${destinationDisplay}.`
    : `Direct (non-stop) flights operate between ${originDisplay} and ${destinationDisplay}.`;

  return (
    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
      {/* Main Title */}
      <Typography 
        variant="h1" 
        gutterBottom 
        sx={{ 
          textAlign: 'left', 
          mb: 2,
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          lineHeight: { xs: 1.3, sm: 1.4 },
          wordBreak: 'break-word',
        }}
      >
        {headingText}
      </Typography>

      {/* Summary Text */}
      <Typography 
        variant="body1" 
        sx={{ 
          mb: { xs: 2, sm: 3 }, 
          lineHeight: 1.8, 
          color: 'text.secondary',
          fontSize: { xs: '0.875rem', sm: '1rem' },
          wordBreak: 'break-word',
        }}
      >
        {descriptionText}
        {!airlineName && airlinesCount !== undefined && ` This popular route is operated by ${airlinesCount} airline${airlinesCount !== 1 ? 's' : ''}, offering multiple daily departures.`}
        {airlineName && flightsPerDay && ` ${airlineName} operates ${flightsPerDay} daily flight${flightsPerDay !== '1' ? 's' : ''} on this route.`}
        {duration && duration !== 'Data not available' && (
          <Box component="span" sx={{ display: 'block', mt: 1 }}>
            • <strong>Flight Duration:</strong> {duration} (average flight time)
          </Box>
        )}
        {distance && (
          <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
            • <strong>Distance:</strong> {distance} (air miles between airports)
          </Box>
        )}
        {flightsPerDay && (
          <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
            • <strong>Daily Flights:</strong> {flightsPerDay} (scheduled departures per day)
          </Box>
        )}
      </Typography>

      {/* Airport Cards */}
      <Grid container spacing={2} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'left', border: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: 1 }}>
              <Avatar
                src={getAirportImageUrl(origin)}
                alt={origin}
                variant="rounded"
                sx={{ width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 }, flexShrink: 0 }}
              >
                {origin}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    wordBreak: 'break-word',
                  }}
                >
                  {originDisplay}
                </Typography>
                {originCountry && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    {originCountry}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={2} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center', py: 2 }}>
          <FlightIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'left', border: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: 1 }}>
              <Avatar
                src={getAirportImageUrl(destination)}
                alt={destination}
                variant="rounded"
                sx={{ width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 }, flexShrink: 0 }}
              >
                {destination}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    wordBreak: 'break-word',
                  }}
                >
                  {destinationDisplay}
                </Typography>
                {destinationCountry && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    {destinationCountry}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Flight Time and Distance */}
      <Grid container spacing={2}>
        {duration && duration !== 'Data not available' && (
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'background.default' }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 0.5,
                  fontSize: { xs: '0.7rem', sm: '0.875rem' },
                }}
              >
                FLIGHT TIME
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.5rem' },
                }}
              >
                {duration}
              </Typography>
            </Paper>
          </Grid>
        )}
        {distance && (
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'background.default' }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 0.5,
                  fontSize: { xs: '0.7rem', sm: '0.875rem' },
                }}
              >
                FLIGHT DISTANCE
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.5rem' },
                }}
              >
                {distance}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

