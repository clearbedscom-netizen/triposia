'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import TableViewIcon from '@mui/icons-material/TableView';
import FlightIcon from '@mui/icons-material/Flight';
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
}

type SortField = 'destination' | 'airline' | 'frequency' | 'distance' | 'duration' | 'popularity';
type SortDirection = 'asc' | 'desc';

interface SortableRouteTableProps {
  routes: Route[];
  originIata: string;
}

export default function SortableRouteTable({
  routes,
  originIata,
}: SortableRouteTableProps) {
  const [sortField, setSortField] = useState<SortField>('frequency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'destination':
          aValue = a.display.toLowerCase();
          bValue = b.display.toLowerCase();
          break;
        case 'frequency':
          aValue = parseFloat(a.flights_per_day?.match(/(\d+(?:\.\d+)?)/)?.[1] || '0');
          bValue = parseFloat(b.flights_per_day?.match(/(\d+(?:\.\d+)?)/)?.[1] || '0');
          break;
        case 'distance':
          aValue = a.distance_km || 0;
          bValue = b.distance_km || 0;
          break;
        case 'duration':
          // Extract minutes from duration string (e.g., "2h 30m" -> 150)
          const parseDuration = (dur?: string) => {
            if (!dur) return 0;
            const hours = dur.match(/(\d+)h/)?.[1] || '0';
            const minutes = dur.match(/(\d+)m/)?.[1] || '0';
            return parseInt(hours) * 60 + parseInt(minutes);
          };
          aValue = parseDuration(a.average_duration);
          bValue = parseDuration(b.average_duration);
          break;
        case 'popularity':
          aValue = a.popularity_score || 0;
          bValue = b.popularity_score || 0;
          break;
        case 'airline':
          aValue = a.airline_count || 0;
          bValue = b.airline_count || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [routes, sortField, sortDirection]);

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
    <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <TableViewIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          All Routes
        </Typography>
        <Chip label={`${routes.length} routes`} size="small" variant="outlined" />
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'destination'}
                  direction={sortField === 'destination' ? sortDirection : 'asc'}
                  onClick={() => handleSort('destination')}
                >
                  Destination
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'airline'}
                  direction={sortField === 'airline' ? sortDirection : 'asc'}
                  onClick={() => handleSort('airline')}
                >
                  Airlines
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'frequency'}
                  direction={sortField === 'frequency' ? sortDirection : 'asc'}
                  onClick={() => handleSort('frequency')}
                >
                  Weekly Flights
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'distance'}
                  direction={sortField === 'distance' ? sortDirection : 'asc'}
                  onClick={() => handleSort('distance')}
                >
                  Distance
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'duration'}
                  direction={sortField === 'duration' ? sortDirection : 'asc'}
                  onClick={() => handleSort('duration')}
                >
                  Duration
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'popularity'}
                  direction={sortField === 'popularity' ? sortDirection : 'asc'}
                  onClick={() => handleSort('popularity')}
                >
                  Popularity
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRoutes.map((route) => {
              const routeSlug = `${originIata.toLowerCase()}-${route.iata.toLowerCase()}`;
              return (
                <TableRow
                  key={route.iata}
                  hover
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    cursor: 'pointer',
                  }}
                  onClick={() => window.location.href = `/flights/${routeSlug}`}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FlightIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {route.display}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {route.airline_count ? (
                      <Chip label={route.airline_count} size="small" variant="outlined" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {route.flights_per_week || Math.round(parseFloat(route.flights_per_day?.match(/(\d+(?:\.\d+)?)/)?.[1] || '0') * 7)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {route.flights_per_day} daily
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {route.distance_km ? (
                      <Typography variant="body2">{Math.round(route.distance_km)} km</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {route.average_duration ? (
                      <Typography variant="body2">{route.average_duration}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {route.popularity_score ? (
                      <Chip
                        label={route.popularity_score.toFixed(1)}
                        size="small"
                        color={route.popularity_score >= 7 ? 'success' : route.popularity_score >= 4 ? 'warning' : 'default'}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      {route.route_growth && (
                        <Tooltip title={route.route_growth}>
                          {getGrowthIcon(route.route_growth)}
                        </Tooltip>
                      )}
                      {route.seasonal && (
                        <Chip label="Seasonal" size="small" color="warning" variant="outlined" />
                      )}
                      {route.reliability && (
                        <ReliabilityBadge level={route.reliability} size="small" />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
