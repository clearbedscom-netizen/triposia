'use client';

import dynamic from 'next/dynamic';
import { Box, Typography } from '@mui/material';

const FilterableRoutesSection = dynamic(() => import('./FilterableRoutesSection'), {
  ssr: false,
  loading: () => (
    <Box sx={{ p: 3, textAlign: 'center', minHeight: 200 }}>
      <Typography variant="body2" color="text.secondary">Loading routes...</Typography>
    </Box>
  ),
});

export default FilterableRoutesSection;
