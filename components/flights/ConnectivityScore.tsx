'use client';

import { Box, Typography, Paper, Grid, LinearProgress, Chip } from '@mui/material';
import { SignalCellularAlt, TrendingUp, CheckCircle, Flight } from '@mui/icons-material';

interface ConnectivityScoreProps {
  overallScore: number; // 0-100
  routeDiversity: number; // 0-100
  airlineDiversity: number; // 0-100
  growthTrend: 'growing' | 'stable' | 'declining';
  reliabilityScore: number; // 0-100
}

export default function ConnectivityScore({
  overallScore,
  routeDiversity,
  airlineDiversity,
  growthTrend,
  reliabilityScore,
}: ConnectivityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'info';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'Limited';
  };

  const getGrowthColor = (trend: string) => {
    switch (trend) {
      case 'growing':
        return 'success';
      case 'stable':
        return 'info';
      case 'declining':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <SignalCellularAlt sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Airport Connectivity Score
        </Typography>
      </Box>

      {/* Overall Score */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '3rem', sm: '4rem' },
                fontWeight: 700,
                color: `${getScoreColor(overallScore)}.main`,
              }}
            >
              {overallScore}
            </Typography>
          </Box>
        </Box>
        <Typography variant="h6" sx={{ mb: 1, color: `${getScoreColor(overallScore)}.main` }}>
          {getScoreLabel(overallScore)} Connectivity
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overall airport connectivity rating based on route diversity, airline presence, and service reliability
        </Typography>
      </Box>

      {/* Breakdown Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Flight sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Route Diversity
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: `${getScoreColor(routeDiversity)}.main` }}>
                {routeDiversity}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={routeDiversity}
              color={getScoreColor(routeDiversity) as any}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SignalCellularAlt sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Airline Diversity
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: `${getScoreColor(airlineDiversity)}.main` }}>
                {airlineDiversity}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={airlineDiversity}
              color={getScoreColor(airlineDiversity) as any}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Growth Trend
                </Typography>
              </Box>
              <Chip
                label={growthTrend}
                size="small"
                color={getGrowthColor(growthTrend) as any}
                sx={{ textTransform: 'capitalize', fontWeight: 600 }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={growthTrend === 'growing' ? 80 : growthTrend === 'stable' ? 50 : 30}
              color={getGrowthColor(growthTrend) as any}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Reliability
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: `${getScoreColor(reliabilityScore)}.main` }}>
                {reliabilityScore}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={reliabilityScore}
              color={getScoreColor(reliabilityScore) as any}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
