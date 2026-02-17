'use client';

import { Box, Typography, Paper, Grid, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PublicIcon from '@mui/icons-material/Public';
import FlightIcon from '@mui/icons-material/Flight';
import Link from 'next/link';
import ReliabilityBadge from './ReliabilityBadge';

interface Route {
  iata: string;
  city: string;
  display: string;
  flights_per_day: string;
  flights_per_week?: number;
  distance_km?: number;
  average_duration?: string;
  seasonal?: boolean;
  reliability?: 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited';
  route_growth?: 'growing' | 'stable' | 'declining';
  country?: string;
  is_domestic?: boolean;
}

interface RegionGroup {
  name: string;
  routes: Route[];
  count: number;
}

interface RoutesByRegionGroupProps {
  regionGroups: RegionGroup[];
  originIata: string;
  originCountry?: string;
}


export default function RoutesByRegionGroup({
  regionGroups,
  originIata,
}: RoutesByRegionGroupProps) {
  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <PublicIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Destinations by Region
        </Typography>
      </Box>

      {regionGroups.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No regional data available
        </Typography>
      ) : (
        <Box>
          {regionGroups.map((region) => (
            <Accordion
              key={region.name}
              defaultExpanded={region.name === 'Domestic'}
              sx={{
                mb: 1,
                '&:before': { display: 'none' },
                boxShadow: 1,
                '&.Mui-expanded': {
                  boxShadow: 2,
                },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {region.name}
                    </Typography>
                    <Chip
                      label={`${region.count} destinations`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {region.routes.map((route) => {
                    const routeSlug = `${originIata.toLowerCase()}-${route.iata.toLowerCase()}`;
                    return (
                      <Grid item xs={12} sm={6} md={4} key={route.iata}>
                        <Paper
                          component={Link}
                          href={`/flights/${routeSlug}`}
                          sx={{
                            p: 2,
                            textDecoration: 'none',
                            height: '100%',
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              borderColor: 'primary.main',
                              boxShadow: 2,
                            },
                            transition: 'all 0.2s',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <FlightIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                              {route.display}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            {route.flights_per_day} daily
                            {route.flights_per_week && ` • ${route.flights_per_week} weekly`}
                          </Typography>
                          {route.country && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              {route.country}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                            {route.seasonal && (
                              <Chip
                                label="Seasonal"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                            {route.reliability && (
                              <ReliabilityBadge level={route.reliability} size="small" />
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Paper>
  );
}
