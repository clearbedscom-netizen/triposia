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

interface AirlineRouteIntelligenceServerProps {
  airlineName: string;
  airportCode: string;
  topRoutes: Route[];
  totalRoutes: number;
  totalWeeklyFlights: number;
  averageFrequency?: number;
  routeGrowth?: 'growing' | 'stable' | 'declining';
}

/**
 * Server-rendered version of Route Intelligence Dashboard
 * This ensures all critical SEO content (stats, routes, scores) is in the initial HTML
 * Only the interactive chart is client-side rendered
 */
export default function AirlineRouteIntelligenceServer({
  airlineName,
  airportCode,
  topRoutes,
  totalRoutes,
  totalWeeklyFlights,
  averageFrequency,
  routeGrowth,
}: AirlineRouteIntelligenceServerProps) {
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

  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    if (score >= 25) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 75) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 25) return 'Moderate';
    return 'Limited';
  };

  const getGrowthIcon = () => {
    if (routeGrowth === 'growing') return <TrendingUpIcon sx={{ color: 'success.main' }} />;
    if (routeGrowth === 'declining') return <TrendingDownIcon sx={{ color: 'error.main' }} />;
    return <TrendingFlatIcon sx={{ color: 'text.secondary' }} />;
  };

  const getGrowthLabel = (): string => {
    if (routeGrowth === 'growing') return 'Growing';
    if (routeGrowth === 'declining') return 'Declining';
    return 'Stable';
  };

  return (
    <Box sx={{ mb: 4 }} component="section" aria-label="Route Intelligence Dashboard">
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
                  border: `8px solid`,
                  borderColor: `${getScoreColor(connectivityScore)}.main`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 700, fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }}>
                  {connectivityScore}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {getScoreLabel(connectivityScore)}
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={connectivityScore}
              color={getScoreColor(connectivityScore)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Paper>
        </Grid>

        {/* Route Diversity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
              Route Diversity
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <FlightIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {totalRoutes}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Direct Routes
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {airlineName} serves {totalRoutes} destination{totalRoutes !== 1 ? 's' : ''} from {airportCode}
            </Typography>
          </Paper>
        </Grid>

        {/* Weekly Frequency */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
              Weekly Frequency
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ScheduleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {totalWeeklyFlights.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Weekly Flights
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              {getGrowthIcon()}
              <Typography variant="body2" color="text.secondary">
                Trend: {getGrowthLabel()}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Note: Chart is rendered separately as a client component for interactivity */}

        {/* Top 5 Most Frequent Routes - Details (Server-rendered for SEO) */}
        {topRoutes.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                Top {Math.min(5, topRoutes.length)} Most Frequent Routes - Details
              </Typography>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <Box component="thead">
                  <Box component="tr" sx={{ borderBottom: '2px solid', borderColor: 'divider' }}>
                    <Box component="th" sx={{ textAlign: 'left', p: 2, fontWeight: 600 }}>Route</Box>
                    <Box component="th" sx={{ textAlign: 'center', p: 2, fontWeight: 600 }}>Weekly Flights</Box>
                    <Box component="th" sx={{ textAlign: 'center', p: 2, fontWeight: 600 }}>Duration</Box>
                    <Box component="th" sx={{ textAlign: 'center', p: 2, fontWeight: 600 }}>Distance</Box>
                    <Box component="th" sx={{ textAlign: 'center', p: 2, fontWeight: 600 }}>Reliability</Box>
                  </Box>
                </Box>
                <Box component="tbody">
                  {topRoutes.slice(0, 5).map((route, index) => (
                    <Box
                      key={route.destination}
                      component="tr"
                      sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      <Box component="td" sx={{ p: 2 }}>
                        <Link
                          href={`/airlines/${airlineName.toLowerCase().replace(/\s+/g, '-')}/${airportCode.toLowerCase()}-${route.destination.toLowerCase()}`}
                          style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}
                        >
                          {airportCode} → {route.display} ({route.destination})
                        </Link>
                      </Box>
                      <Box component="td" sx={{ textAlign: 'center', p: 2 }}>
                        <Chip label={`${route.weeklyFlights}/week`} color="primary" size="small" />
                      </Box>
                      <Box component="td" sx={{ textAlign: 'center', p: 2 }}>
                        {route.duration || 'N/A'}
                      </Box>
                      <Box component="td" sx={{ textAlign: 'center', p: 2 }}>
                        {route.distance ? `${route.distance.toLocaleString()} km` : 'N/A'}
                      </Box>
                      <Box component="td" sx={{ textAlign: 'center', p: 2 }}>
                        <Chip
                          label={route.reliability || 'Unknown'}
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
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
