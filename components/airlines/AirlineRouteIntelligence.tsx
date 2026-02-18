'use client';

import { Box, Typography, Grid, Paper, LinearProgress, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import FlightIcon from '@mui/icons-material/Flight';
import ScheduleIcon from '@mui/icons-material/Schedule';
import Link from 'next/link';

interface Route {
  destination: string;
  display: string;
  weeklyFlights: number;
  duration?: string;
  distance?: number;
  reliability?: 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited';
  aircraft?: string;
}

interface AirlineRouteIntelligenceProps {
  airlineName: string;
  airportCode: string;
  topRoutes: Route[];
  totalRoutes: number;
  totalWeeklyFlights: number;
  averageFrequency?: number;
  routeGrowth?: 'growing' | 'stable' | 'declining';
}

export default function AirlineRouteIntelligence({
  airlineName,
  airportCode,
  topRoutes,
  totalRoutes,
  totalWeeklyFlights,
  averageFrequency,
  routeGrowth,
}: AirlineRouteIntelligenceProps) {
  // Calculate connectivity score (0-100)
  const calculateConnectivityScore = (): number => {
    let score = 0;
    
    // Route diversity (max 30 points)
    if (totalRoutes >= 50) score += 30;
    else if (totalRoutes >= 30) score += 25;
    else if (totalRoutes >= 20) score += 20;
    else if (totalRoutes >= 10) score += 15;
    else if (totalRoutes >= 5) score += 10;
    else score += 5;
    
    // Frequency score (max 30 points)
    const avgWeekly = averageFrequency || totalWeeklyFlights / totalRoutes;
    if (avgWeekly >= 20) score += 30;
    else if (avgWeekly >= 15) score += 25;
    else if (avgWeekly >= 10) score += 20;
    else if (avgWeekly >= 7) score += 15;
    else if (avgWeekly >= 3) score += 10;
    else score += 5;
    
    // Growth trend (max 20 points)
    if (routeGrowth === 'growing') score += 20;
    else if (routeGrowth === 'stable') score += 15;
    else if (routeGrowth === 'declining') score += 10;
    else score += 12; // Unknown
    
    // Reliability (max 20 points) - based on route stability
    const stableRoutes = topRoutes.filter(r => r.reliability === 'Very Stable' || r.reliability === 'Moderate').length;
    const reliabilityRatio = stableRoutes / Math.max(topRoutes.length, 1);
    score += Math.round(reliabilityRatio * 20);
    
    return Math.min(100, Math.max(0, score));
  };

  const connectivityScore = calculateConnectivityScore();

  const getScoreColor = (score: number): 'success' | 'warning' | 'error' | 'info' => {
    if (score >= 75) return 'success';
    if (score >= 50) return 'info';
    if (score >= 25) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 75) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 25) return 'Moderate';
    return 'Limited';
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 3 }}>
        Route Intelligence Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Overall Connectivity Score */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom color="text.secondary" sx={{ mb: 3, fontWeight: 600 }}>
              Overall Connectivity Score
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3, flex: 1 }}>
              <Box
                sx={{
                  width: { xs: 140, sm: 160, md: 180 },
                  height: { xs: 140, sm: 160, md: 180 },
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `conic-gradient(${getScoreColor(connectivityScore) === 'success' ? '#4caf50' : getScoreColor(connectivityScore) === 'info' ? '#2196f3' : getScoreColor(connectivityScore) === 'warning' ? '#ff9800' : '#f44336'} 0deg ${(connectivityScore / 100) * 360}deg, #e0e0e0 ${(connectivityScore / 100) * 360}deg 360deg)`,
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    width: { xs: 110, sm: 125, md: 140 },
                    height: { xs: 110, sm: 125, md: 140 },
                    borderRadius: '50%',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 2,
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 700, fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }, lineHeight: 1 }}>
                    {connectivityScore}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                    {getScoreLabel(connectivityScore)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ mt: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Route Diversity</Typography>
                <Typography variant="body2" fontWeight={700} color="primary.main">
                  {totalRoutes >= 30 ? 'High' : totalRoutes >= 10 ? 'Medium' : 'Low'}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (totalRoutes / 50) * 100)}
                sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover' }}
                color={totalRoutes >= 30 ? 'success' : totalRoutes >= 10 ? 'info' : 'warning'}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Top Routes */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="text.secondary" sx={{ mb: 3, fontWeight: 600 }}>
              Top 5 Most Frequent Routes
            </Typography>
            <Grid container spacing={2}>
              {topRoutes.slice(0, 5).map((route, idx) => {
                const routeSlug = `${airportCode.toLowerCase()}-${route.destination.toLowerCase()}`;
                return (
                  <Grid item xs={12} sm={6} key={idx}>
                    <Paper
                      component={Link}
                      href={`/flights/${routeSlug}`}
                      sx={{
                        p: 2.5,
                        textDecoration: 'none',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: 'primary.main',
                          boxShadow: 3,
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                        <FlightIcon sx={{ fontSize: 20, color: 'primary.main', mt: 0.5, flexShrink: 0 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1, lineHeight: 1.3 }}>
                          {route.display}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Chip
                            label={`${route.weeklyFlights}/week`}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ fontWeight: 600 }}
                          />
                          {route.reliability && (
                            <Chip
                              label={route.reliability}
                              size="small"
                              color={
                                route.reliability === 'Very Stable'
                                  ? 'success'
                                  : route.reliability === 'Moderate'
                                  ? 'info'
                                  : route.reliability === 'Seasonal'
                                  ? 'warning'
                                  : 'default'
                              }
                              variant="outlined"
                              sx={{ fontWeight: 500 }}
                            />
                          )}
                        </Box>
                        {route.duration && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {route.duration}
                            </Typography>
                          </Box>
                        )}
                        {route.distance && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {Math.round(route.distance)} km
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>

        {/* Growth Trend */}
        {routeGrowth && (
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
                Route Growth Trend
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 'auto' }}>
                {routeGrowth === 'growing' ? (
                  <TrendingUpIcon sx={{ fontSize: { xs: 40, md: 48 }, color: 'success.main', flexShrink: 0 }} />
                ) : routeGrowth === 'declining' ? (
                  <TrendingDownIcon sx={{ fontSize: { xs: 40, md: 48 }, color: 'error.main', flexShrink: 0 }} />
                ) : (
                  <TrendingFlatIcon sx={{ fontSize: { xs: 40, md: 48 }, color: 'info.main', flexShrink: 0 }} />
                )}
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                    {routeGrowth === 'growing' ? 'Growing' : routeGrowth === 'declining' ? 'Declining' : 'Stable'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Network trend
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Best Time to Fly */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
              Best Time to Fly
            </Typography>
            <Box sx={{ mt: 'auto' }}>
              <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 500 }}>
                Peak Frequency Hours
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Most flights operate during{' '}
                <strong>morning (6 AM - 10 AM)</strong> and{' '}
                <strong>evening (6 PM - 10 PM)</strong> hours for optimal schedule flexibility.
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Reliability Summary */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
              Service Reliability
            </Typography>
            <Box sx={{ mt: 'auto' }}>
              {(() => {
                const stableCount = topRoutes.filter(
                  r => r.reliability === 'Very Stable' || r.reliability === 'Moderate'
                ).length;
                const reliabilityPercent = Math.round((stableCount / Math.max(topRoutes.length, 1)) * 100);
                return (
                  <>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '2rem', md: '2.5rem' } }}>
                      {reliabilityPercent}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Routes with stable service
                    </Typography>
                  </>
                );
              })()}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
