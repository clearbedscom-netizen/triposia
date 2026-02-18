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
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="text.secondary">
              Overall Connectivity Score
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `conic-gradient(${getScoreColor(connectivityScore) === 'success' ? '#4caf50' : getScoreColor(connectivityScore) === 'info' ? '#2196f3' : getScoreColor(connectivityScore) === 'warning' ? '#ff9800' : '#f44336'} 0deg ${(connectivityScore / 100) * 360}deg, #e0e0e0 ${(connectivityScore / 100) * 360}deg 360deg)`,
                }}
              >
                <Box
                  sx={{
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {connectivityScore}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getScoreLabel(connectivityScore)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Route Diversity</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {totalRoutes >= 30 ? 'High' : totalRoutes >= 10 ? 'Medium' : 'Low'}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (totalRoutes / 50) * 100)}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Top Routes */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="text.secondary" sx={{ mb: 2 }}>
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
                        p: 2,
                        textDecoration: 'none',
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
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                          {route.display}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Chip
                          label={`${route.weeklyFlights}/week`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                        {route.duration && (
                          <Chip
                            icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                            label={route.duration}
                            size="small"
                            variant="outlined"
                          />
                        )}
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
                          />
                        )}
                      </Box>
                      {route.distance && (
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(route.distance)} km
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>

        {/* Growth Trend */}
        {routeGrowth && (
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="text.secondary">
                Route Growth Trend
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                {routeGrowth === 'growing' ? (
                  <TrendingUpIcon sx={{ fontSize: 48, color: 'success.main' }} />
                ) : routeGrowth === 'declining' ? (
                  <TrendingDownIcon sx={{ fontSize: 48, color: 'error.main' }} />
                ) : (
                  <TrendingFlatIcon sx={{ fontSize: 48, color: 'info.main' }} />
                )}
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {routeGrowth === 'growing' ? 'Growing' : routeGrowth === 'declining' ? 'Declining' : 'Stable'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Network trend
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Best Time to Fly */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="text.secondary">
              Best Time to Fly
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Peak Frequency Hours
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Most flights operate during{' '}
                <strong>morning (6 AM - 10 AM)</strong> and{' '}
                <strong>evening (6 PM - 10 PM)</strong> hours for optimal schedule flexibility.
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Reliability Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="text.secondary">
              Service Reliability
            </Typography>
            <Box sx={{ mt: 2 }}>
              {(() => {
                const stableCount = topRoutes.filter(
                  r => r.reliability === 'Very Stable' || r.reliability === 'Moderate'
                ).length;
                const reliabilityPercent = Math.round((stableCount / Math.max(topRoutes.length, 1)) * 100);
                return (
                  <>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {reliabilityPercent}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
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
