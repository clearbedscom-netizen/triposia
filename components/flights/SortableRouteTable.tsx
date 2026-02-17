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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
  Button,
} from '@mui/material';
import TableViewIcon from '@mui/icons-material/TableView';
import FlightIcon from '@mui/icons-material/Flight';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import Link from 'next/link';
import ReliabilityBadge from './ReliabilityBadge';
import { categorizeByRegion } from '@/lib/regionUtils';

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
  country?: string;
  is_domestic?: boolean;
}

type SortField = 'destination' | 'airline' | 'frequency' | 'distance' | 'duration' | 'popularity';
type SortDirection = 'asc' | 'desc';

interface Airline {
  code: string;
  name: string;
  iata?: string;
}

interface SortableRouteTableProps {
  routes: Route[];
  originIata: string;
  airlines?: Airline[];
  originCountry?: string;
  routeAirlinesMap?: Map<string, string[]>; // Map of route IATA to airline codes
}

export default function SortableRouteTable({
  routes,
  originIata,
  airlines = [],
  originCountry,
  routeAirlinesMap,
}: SortableRouteTableProps) {
  const [sortField, setSortField] = useState<SortField>('frequency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedAirline, setSelectedAirline] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [routeType, setRouteType] = useState<string>('all'); // 'all', 'direct', 'connecting'

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get unique regions from routes
  const regions = useMemo(() => {
    if (!routes.length) return [];
    const regionGroups = categorizeByRegion(routes, originCountry);
    return regionGroups.map(g => g.name);
  }, [routes, originCountry]);

  // Filter routes based on selected filters
  const filteredRoutes = useMemo(() => {
    let filtered = [...routes];

    // Filter by airline
    if (selectedAirline !== 'all' && routeAirlinesMap) {
      filtered = filtered.filter(route => {
        const routeAirlines = routeAirlinesMap.get(route.iata) || [];
        return routeAirlines.some(code => 
          code.toLowerCase() === selectedAirline.toLowerCase()
        );
      });
    }

    // Filter by region
    if (selectedRegion !== 'all') {
      const regionGroups = categorizeByRegion(routes, originCountry);
      const targetGroup = regionGroups.find(g => g.name === selectedRegion);
      if (targetGroup) {
        const targetIatas = new Set(targetGroup.routes.map(r => r.iata));
        filtered = filtered.filter(r => targetIatas.has(r.iata));
      }
    }

    // Filter by route type (direct vs connecting)
    // Note: This is a placeholder - would need actual route data to determine if connecting
    if (routeType === 'direct') {
      // Assume all routes are direct for now (would need actual data)
      filtered = filtered.filter(r => !r.seasonal); // Filter out seasonal as proxy
    }

    return filtered;
  }, [routes, selectedAirline, selectedRegion, routeType, routeAirlinesMap, originCountry]);

  const sortedRoutes = useMemo(() => {
    return [...filteredRoutes].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'destination':
          aValue = a.display.toLowerCase();
          bValue = b.display.toLowerCase();
          break;
        case 'frequency':
          // Safely parse flights_per_day with comprehensive null checks
          aValue = (a.flights_per_day && typeof a.flights_per_day === 'string')
            ? (() => {
                try {
                  const match = String(a.flights_per_day).match(/(\d+(?:\.\d+)?)/);
                  return match && match[1] ? parseFloat(match[1]) : 0;
                } catch {
                  return 0;
                }
              })()
            : 0;
          bValue = (b.flights_per_day && typeof b.flights_per_day === 'string')
            ? (() => {
                try {
                  const match = String(b.flights_per_day).match(/(\d+(?:\.\d+)?)/);
                  return match && match[1] ? parseFloat(match[1]) : 0;
                } catch {
                  return 0;
                }
              })()
            : 0;
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
  }, [filteredRoutes, sortField, sortDirection]);

  const hasActiveFilters = selectedAirline !== 'all' || selectedRegion !== 'all' || routeType !== 'all';

  const clearFilters = () => {
    setSelectedAirline('all');
    setSelectedRegion('all');
    setRouteType('all');
  };

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TableViewIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            All Routes
          </Typography>
          <Chip 
            label={`${filteredRoutes.length}${hasActiveFilters ? ` of ${routes.length}` : ''} routes`} 
            size="small" 
            variant="outlined" 
            color={hasActiveFilters ? 'primary' : 'default'}
          />
        </Box>
        {hasActiveFilters && (
          <Button
            startIcon={<ClearIcon />}
            onClick={clearFilters}
            size="small"
            variant="outlined"
          >
            Clear Filters
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {airlines.length > 0 && (
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Airline</InputLabel>
              <Select
                value={selectedAirline}
                label="Filter by Airline"
                onChange={(e: SelectChangeEvent) => setSelectedAirline(e.target.value)}
              >
                <MenuItem value="all">All Airlines</MenuItem>
                {airlines.map(airline => (
                  <MenuItem key={airline.code} value={airline.code.toLowerCase()}>
                    {airline.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        {regions.length > 0 && (
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Region</InputLabel>
              <Select
                value={selectedRegion}
                label="Filter by Region"
                onChange={(e: SelectChangeEvent) => setSelectedRegion(e.target.value)}
              >
                <MenuItem value="all">All Regions</MenuItem>
                {regions.map(region => (
                  <MenuItem key={region} value={region}>
                    {region}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Route Type</InputLabel>
            <Select
              value={routeType}
              label="Route Type"
              onChange={(e: SelectChangeEvent) => setRouteType(e.target.value)}
            >
              <MenuItem value="all">All Routes</MenuItem>
              <MenuItem value="direct">Direct Only</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

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
                      {(() => {
                        if (route.flights_per_week) return route.flights_per_week;
                        if (route.flights_per_day && typeof route.flights_per_day === 'string') {
                          try {
                            const match = String(route.flights_per_day).match(/(\d+(?:\.\d+)?)/);
                            if (match && match[1]) {
                              const daily = parseFloat(match[1]);
                              if (!isNaN(daily)) return Math.round(daily * 7);
                            }
                          } catch {}
                        }
                        return 0;
                      })()}
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
