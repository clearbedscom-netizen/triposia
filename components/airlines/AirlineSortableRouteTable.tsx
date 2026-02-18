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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import Link from 'next/link';
import FlightIcon from '@mui/icons-material/Flight';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StraightenIcon from '@mui/icons-material/Straighten';
import ReliabilityBadge from '@/components/flights/ReliabilityBadge';

interface Route {
  destination: string;
  display: string;
  weeklyFlights: number;
  duration?: string;
  distance?: number;
  aircraft?: string;
  reliability?: 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited';
  is_domestic?: boolean;
  country?: string;
}

interface AirlineSortableRouteTableProps {
  routes: Route[];
  airlineName: string;
  airlineCode: string;
  originIata: string;
}

type SortField = 'destination' | 'frequency' | 'duration' | 'distance';
type SortDirection = 'asc' | 'desc';

export default function AirlineSortableRouteTable({
  routes,
  airlineName,
  airlineCode,
  originIata,
}: AirlineSortableRouteTableProps) {
  const [sortField, setSortField] = useState<SortField>('frequency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [airlineFilter, setAirlineFilter] = useState<string>('all');

  // Parse duration string to minutes for sorting
  const parseDuration = (duration?: string): number => {
    if (!duration) return 0;
    try {
      const match = duration.match(/(\d+)h\s*(\d+)m/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        return hours * 60 + minutes;
      }
      const hourMatch = duration.match(/(\d+)h/);
      if (hourMatch) {
        return parseInt(hourMatch[1], 10) * 60;
      }
    } catch {
      return 0;
    }
    return 0;
  };

  const sortedRoutes = useMemo(() => {
    const filtered = routes.filter(route => {
      if (regionFilter === 'domestic' && !route.is_domestic) return false;
      if (regionFilter === 'international' && route.is_domestic) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'destination':
          aValue = a.display.toLowerCase();
          bValue = b.display.toLowerCase();
          break;
        case 'frequency':
          aValue = a.weeklyFlights;
          bValue = b.weeklyFlights;
          break;
        case 'duration':
          aValue = parseDuration(a.duration);
          bValue = parseDuration(b.duration);
          break;
        case 'distance':
          aValue = a.distance || 0;
          bValue = b.distance || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [routes, sortField, sortDirection, regionFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
          All {airlineName} Routes from {originIata}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Region</InputLabel>
            <Select value={regionFilter} label="Region" onChange={(e) => setRegionFilter(e.target.value)}>
              <MenuItem value="all">All Routes</MenuItem>
              <MenuItem value="domestic">Domestic</MenuItem>
              <MenuItem value="international">International</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <TableContainer component={Paper}>
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
                  active={sortField === 'frequency'}
                  direction={sortField === 'frequency' ? sortDirection : 'desc'}
                  onClick={() => handleSort('frequency')}
                >
                  Weekly Flights
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
                  active={sortField === 'distance'}
                  direction={sortField === 'distance' ? sortDirection : 'desc'}
                  onClick={() => handleSort('distance')}
                >
                  Distance
                </TableSortLabel>
              </TableCell>
              <TableCell>Aircraft</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRoutes.map((route) => {
              const routeSlug = `${originIata.toLowerCase()}-${route.destination.toLowerCase()}`;
              return (
                <TableRow
                  key={route.destination}
                  sx={{
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <TableCell>
                    <Box
                      component={Link}
                      href={`/airlines/${airlineCode.toLowerCase()}/${routeSlug}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      <FlightIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {route.display}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {route.weeklyFlights}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {route.duration ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">{route.duration}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {route.distance ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <StraightenIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">{Math.round(route.distance)} km</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {route.aircraft ? (
                      <Chip label={route.aircraft} size="small" variant="outlined" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {route.is_domestic !== undefined && (
                        <Chip
                          label={route.is_domestic ? 'Domestic' : 'International'}
                          size="small"
                          color={route.is_domestic ? 'success' : 'info'}
                          variant="outlined"
                        />
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
    </Box>
  );
}
