'use client';

import dynamic from 'next/dynamic';
import { Box } from '@mui/material';

const RouteDataVisualization = dynamic(
  () => import('./RouteDataVisualization'),
  { 
    ssr: false,
    loading: () => (
      <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading charts...
      </Box>
    )
  }
);

export default RouteDataVisualization;
