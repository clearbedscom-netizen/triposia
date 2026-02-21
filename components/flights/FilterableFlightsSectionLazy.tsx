'use client';

import dynamic from 'next/dynamic';
import { Box, Typography } from '@mui/material';

const FilterableFlightsSection = dynamic(() => import('./FilterableFlightsSection'), {
  ssr: false,
  loading: () => (
    <Box sx={{ p: 3, textAlign: 'center', minHeight: 200 }}>
      <Typography variant="body2" color="text.secondary">Loading flights...</Typography>
    </Box>
  ),
});

export default FilterableFlightsSection;
