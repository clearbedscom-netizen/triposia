'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Grid,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FlightIcon from '@mui/icons-material/Flight';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StraightenIcon from '@mui/icons-material/Straighten';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Link from 'next/link';
import ReliabilityBadge from '@/components/flights/ReliabilityBadge';

interface AirlineExpandableRouteCardProps {
  originIata: string;
  originDisplay: string;
  destination: string;
  display: string;
  weeklyFlights: number;
  duration?: string;
  distance?: number;
  aircraft?: string;
  reliability?: 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited';
  is_domestic?: boolean;
  seasonal?: boolean;
  popularityScore?: number; // 1-100 based on frequency rank
  airlineCode: string;
}

export default function AirlineExpandableRouteCard({
  originIata,
  originDisplay,
  destination,
  display,
  weeklyFlights,
  duration,
  distance,
  aircraft,
  reliability,
  is_domestic,
  seasonal,
  popularityScore,
  airlineCode,
}: AirlineExpandableRouteCardProps) {
  const [expanded, setExpanded] = useState(false);
  const routeSlug = `${originIata.toLowerCase()}-${destination.toLowerCase()}`;

  const getPopularityLabel = (score?: number): string => {
    if (!score) return '';
    if (score >= 80) return 'Very Popular';
    if (score >= 60) return 'Popular';
    if (score >= 40) return 'Moderate';
    return 'Less Popular';
  };

  const getPopularityColor = (score?: number): 'success' | 'info' | 'warning' | 'default' => {
    if (!score) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'info';
    if (score >= 40) return 'warning';
    return 'default';
  };

  return (
    <Paper
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 3,
          borderColor: 'primary.main',
        },
      }}
    >
      {/* Collapsed View */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <FlightIcon sx={{ color: 'primary.main', fontSize: 24 }} />
          <Box sx={{ flex: 1 }}>
            <Box
              component={Link}
              href={`/airlines/${airlineCode}/${routeSlug}`}
              onClick={(e) => e.stopPropagation()}
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {originDisplay} → {display}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Chip
                label={`${weeklyFlights} weekly`}
                size="small"
                color="primary"
                variant="outlined"
              />
              {duration && (
                <Chip
                  icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                  label={duration}
                  size="small"
                  variant="outlined"
                />
              )}
              {distance && (
                <Chip
                  icon={<StraightenIcon sx={{ fontSize: 14 }} />}
                  label={`${Math.round(distance)} km`}
                  size="small"
                  variant="outlined"
                />
              )}
              {is_domestic !== undefined && (
                <Chip
                  label={is_domestic ? 'Domestic' : 'International'}
                  size="small"
                  color={is_domestic ? 'success' : 'info'}
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Expanded View */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2, pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2}>
            {duration && (
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ScheduleIcon sx={{ fontSize: 16 }} />
                  {duration}
                </Typography>
              </Grid>
            )}
            {distance && (
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Distance
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StraightenIcon sx={{ fontSize: 16 }} />
                  {Math.round(distance)} km ({Math.round(distance * 0.621371)} miles)
                </Typography>
              </Grid>
            )}
            {aircraft && (
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Aircraft Type
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {aircraft}
                </Typography>
              </Grid>
            )}
            {popularityScore !== undefined && (
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Popularity
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Chip
                    label={getPopularityLabel(popularityScore)}
                    size="small"
                    color={getPopularityColor(popularityScore)}
                    variant="outlined"
                  />
                </Box>
              </Grid>
            )}
          </Grid>
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            {seasonal && (
              <Chip
                label="Seasonal Route"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
            {reliability && (
              <ReliabilityBadge level={reliability} size="small" />
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}
