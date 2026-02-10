import { Typography, Box, Paper } from '@mui/material';

interface AirportOperationsOverviewProps {
  airportName: string;
  iata: string;
  destinationCount: number;
  airlineCount: number;
  peakHours?: string[];
  isPrimarilyDomestic?: boolean;
}

/**
 * Airport Operations Overview - Factual, operational data only
 * 
 * Content Generation Guidelines:
 * - Factual data only
 * - No AI-written prose
 * - No marketing language
 * - No city descriptions or tourism text
 * - Operational reference style
 * - Numeric summaries
 * - Data-derived sentences
 * 
 * If AI summarization needed: Use Meta LLaMA 3/3.1 ONLY
 * - Temperature: 0
 * - Prompt type: DATA TO SENTENCE
 * - No opinions or advice
 */
export default function AirportOperationsOverview({
  airportName,
  iata,
  destinationCount,
  airlineCount,
  peakHours,
  isPrimarilyDomestic,
}: AirportOperationsOverviewProps) {
  const primaryService = isPrimarilyDomestic ? 'domestic flights' : 'international and domestic flights';
  
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
        Airport Operations Overview
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="body1" sx={{ textAlign: 'left', lineHeight: 1.8 }}>
          {airportName} ({iata}) primarily handles {primaryService}, with scheduled service to {destinationCount} {destinationCount === 1 ? 'destination' : 'destinations'}.
        </Typography>
        
        <Typography variant="body1" sx={{ textAlign: 'left', lineHeight: 1.8 }}>
          The airport supports operations from {airlineCount} {airlineCount === 1 ? 'airline' : 'airlines'}.
        </Typography>
        
        {peakHours && peakHours.length > 0 && (
          <Typography variant="body1" sx={{ textAlign: 'left', lineHeight: 1.8 }}>
            Peak departure activity occurs during {peakHours.slice(0, 3).join(', ')}.
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
