'use client';

import { Box, Typography, Paper } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';

interface AISummaryBlockProps {
  airportName: string;
  airportCode: string;
  totalDestinations: number;
  totalAirlines: number;
  topRoutes: Array<{
    display: string;
    iata: string;
  }>;
}

export default function AISummaryBlock({
  airportName,
  airportCode,
  totalDestinations,
  totalAirlines,
  topRoutes,
}: AISummaryBlockProps) {
  // Generate AI-ready summary text
  const generateSummary = () => {
    const topRoutesText = topRoutes.length > 0
      ? topRoutes.slice(0, 3).map(r => r.display).join(', ')
      : '';

    let summary = `${airportName} (${airportCode}) offers ${totalDestinations} direct destination${totalDestinations !== 1 ? 's' : ''} served by ${totalAirlines} airline${totalAirlines !== 1 ? 's' : ''}.`;
    
    if (topRoutesText) {
      summary += ` The busiest routes include ${topRoutesText}.`;
    }

    return summary;
  };

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        mb: 4,
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <AutoAwesome sx={{ color: 'primary.main', fontSize: 24, mt: 0.5, flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
            Airport Summary
          </Typography>
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.8,
              color: 'text.primary',
              fontSize: { xs: '0.95rem', sm: '1rem' },
            }}
          >
            {generateSummary()}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
