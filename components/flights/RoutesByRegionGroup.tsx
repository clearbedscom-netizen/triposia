'use client';

import { Box, Typography, Paper, Grid, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PublicIcon from '@mui/icons-material/Public';
import FlightIcon from '@mui/icons-material/Flight';
import StraightenIcon from '@mui/icons-material/Straighten';
import ScheduleIcon from '@mui/icons-material/Schedule';
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
                      <Grid item xs={12} sm={6} md={4} lg={3} key={route.iata}>
                        <Paper
                          component={Link}
                          href={`/flights/${routeSlug}`}
                          sx={{
                            p: 2,
                            textDecoration: 'none',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: { xs: 'auto', sm: '160px' },
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            '&:hover': {
                              bgcolor: 'action.hover',
                              borderColor: 'primary.main',
                              boxShadow: 3,
                              transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <FlightIcon sx={{ fontSize: 20, color: 'primary.main', flexShrink: 0 }} />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 600, 
                                flex: 1,
                                lineHeight: 1.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {route.display}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {route.flights_per_day} daily
                              {route.flights_per_week && ` • ${route.flights_per_week}/week`}
                            </Typography>
                            
                            {/* Distance and Duration */}
                            {(route.distance_km || route.average_duration) && (
                              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 0.5 }}>
                                {route.distance_km && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <StraightenIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">
                                      {Math.round(route.distance_km)} km
                                    </Typography>
                                  </Box>
                                )}
                                {route.average_duration && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">
                                      {route.average_duration}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            )}
                            
                            {route.country && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {route.country}
                              </Typography>
                            )}
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5, flexWrap: 'wrap' }}>
                            {route.seasonal && (
                              <Chip
                                label="Seasonal"
                                size="small"
                                color="warning"
                                variant="outlined"
                                sx={{ fontSize: '0.65rem', height: '20px' }}
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
