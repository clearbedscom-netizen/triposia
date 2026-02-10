import { Typography, Box, Paper } from '@mui/material';

interface AirlineOperationsSummaryProps {
  airlineName: string;
  countryCount: number;
  hubCount: number;
  totalRoutes: number;
  fleetSize?: number;
  averageUtilization?: string;
}

/**
 * Airline Operations Summary - Factual, operational data only
 * 
 * Content Generation Guidelines:
 * - Factual data only
 * - No AI-written prose
 * - No marketing language
 * - Operational reference style
 * - Numeric summaries
 * - Data-derived sentences
 * 
 * If AI summarization needed: Use Meta LLaMA 3/3.1 ONLY
 * - Temperature: 0
 * - Prompt type: DATA TO SENTENCE
 * - No opinions or advice
 */
export default function AirlineOperationsSummary({
  airlineName,
  countryCount,
  hubCount,
  totalRoutes,
  fleetSize,
  averageUtilization,
}: AirlineOperationsSummaryProps) {
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
        Airline Operations Summary
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="body1" sx={{ textAlign: 'left', lineHeight: 1.8 }}>
          {airlineName} operates scheduled passenger flights across {countryCount} {countryCount === 1 ? 'country' : 'countries'} from {hubCount} primary {hubCount === 1 ? 'hub' : 'hubs'}.
        </Typography>
        
        <Typography variant="body1" sx={{ textAlign: 'left', lineHeight: 1.8 }}>
          The airline operates approximately {totalRoutes} {totalRoutes === 1 ? 'route' : 'routes'}.
        </Typography>
        
        {fleetSize && (
          <Typography variant="body1" sx={{ textAlign: 'left', lineHeight: 1.8 }}>
            Fleet size: {fleetSize} {fleetSize === 1 ? 'aircraft' : 'aircraft'}.
          </Typography>
        )}
        
        {averageUtilization && (
          <Typography variant="body1" sx={{ textAlign: 'left', lineHeight: 1.8 }}>
            Average fleet utilization: {averageUtilization}.
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
