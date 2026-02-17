'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Collapse,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FlightIcon from '@mui/icons-material/Flight';
import AirlineIcon from '@mui/icons-material/AirlineStops';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StraightenIcon from '@mui/icons-material/Straighten';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
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
  popularity_score?: number;
  airline_count?: number;
  aircraft_types?: string[];
  airlines?: string[];
}

interface ExpandableRouteCardProps {
  route: Route;
  originIata: string;
}

export default function ExpandableRouteCard({
  route,
  originIata,
}: ExpandableRouteCardProps) {
  const [expanded, setExpanded] = useState(false);
  const routeSlug = `${originIata.toLowerCase()}-${route.iata.toLowerCase()}`;

  const getGrowthIcon = (growth?: string) => {
    switch (growth) {
      case 'growing':
        return <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'declining':
        return <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />;
      default:
        return <RemoveIcon sx={{ fontSize: 16, color: 'text.disabled' }} />;
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          boxShadow: 4,
          borderColor: 'primary.main',
        },
        transition: 'all 0.2s',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FlightIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {route.display}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Chip
                label={`${route.flights_per_day} daily`}
                size="small"
                variant="outlined"
              />
              {route.flights_per_week && (
                <Chip
                  label={`${route.flights_per_week} weekly`}
                  size="small"
                  variant="outlined"
                />
              )}
              {route.airline_count && (
                <Chip
                  label={`${route.airline_count} airlines`}
                  size="small"
                  variant="outlined"
                />
              )}
              {/* Distance and Duration - Always visible */}
              {route.distance_km && (
                <Chip
                  icon={<StraightenIcon sx={{ fontSize: 14 }} />}
                  label={`${Math.round(route.distance_km)} km`}
                  size="small"
                  variant="outlined"
                  color="info"
                />
              )}
              {route.average_duration && (
                <Chip
                  icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                  label={route.average_duration}
                  size="small"
                  variant="outlined"
                  color="info"
                />
              )}
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
          </Box>
          <Button
            onClick={() => setExpanded(!expanded)}
            size="small"
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ ml: 2 }}
          >
            {expanded ? 'Less' : 'More'}
          </Button>
        </Box>

        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            {route.distance_km && (
              <Grid item xs={6} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StraightenIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Distance
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {Math.round(route.distance_km)} km
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
            {route.average_duration && (
              <Grid item xs={6} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Duration
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {route.average_duration}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
            {route.popularity_score && (
              <Grid item xs={6} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Popularity
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {route.popularity_score.toFixed(1)}/10
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
            {route.route_growth && (
              <Grid item xs={6} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getGrowthIcon(route.route_growth)}
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Growth
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                      {route.route_growth}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
            {route.airlines && route.airlines.length > 0 && (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Operating Airlines
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {route.airlines.map((airline, idx) => (
                      <Chip
                        key={idx}
                        label={airline}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}
            {route.aircraft_types && route.aircraft_types.length > 0 && (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Aircraft Types
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {route.aircraft_types.map((type, idx) => (
                      <Chip
                        key={idx}
                        label={type}
                        size="small"
                        variant="outlined"
                        color="secondary"
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </Collapse>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          component={Link}
          href={`/flights/${routeSlug}`}
          variant="contained"
          size="small"
          fullWidth
        >
          View Full Route Details
        </Button>
      </CardActions>
    </Card>
  );
}
