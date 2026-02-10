import { Typography, Box, Paper } from '@mui/material';

interface RouteTruthBlockProps {
  fromCity: string;
  fromIata: string;
  toCity: string;
  toIata: string;
  airlineCount: number;
  flightsPerDay: string | number;
  averageDuration?: string;
  distance?: string;
}

/**
 * RouteTruthBlock - Factual, numeric, neutral route information
 * 
 * Content Generation Guidelines:
 * - Factual data only
 * - No AI-written prose
 * - No marketing language
 * - Numeric summaries
 * - Data-derived sentences
 */
export default function RouteTruthBlock({
  fromCity,
  fromIata,
  toCity,
  toIata,
  airlineCount,
  flightsPerDay,
  averageDuration,
  distance,
}: RouteTruthBlockProps) {
  return (
    <Paper sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
      <Typography 
        variant="h2" 
        gutterBottom 
        sx={{ 
          fontSize: { xs: '1.5rem', sm: '1.75rem' }, 
          mb: 2,
          textAlign: 'left',
          fontWeight: 600,
        }}
      >
        Flights operate between {fromCity} ({fromIata}) and {toCity} ({toIata}).
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="body1" sx={{ textAlign: 'left', lineHeight: 1.8 }}>
          {airlineCount} {airlineCount === 1 ? 'airline operates' : 'airlines operate'} this route with {flightsPerDay} daily {Number(flightsPerDay) === 1 ? 'flight' : 'flights'}.
        </Typography>
        
        {averageDuration && averageDuration !== 'Data not available' && (
          <Typography variant="body1" sx={{ textAlign: 'left', lineHeight: 1.8 }}>
            Average flight time is {averageDuration}.
          </Typography>
        )}
        
        {distance && (
          <Typography variant="body1" sx={{ textAlign: 'left', lineHeight: 1.8 }}>
            Route distance is {distance}.
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
