'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  Typography,
  Grid,
  Button,
  ButtonGroup,
  TextField,
  Autocomplete,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  IconButton,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import Link from 'next/link';
import FlightIcon from '@mui/icons-material/Flight';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SortIcon from '@mui/icons-material/Sort';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import StraightIcon from '@mui/icons-material/Straight';
import PublicIcon from '@mui/icons-material/Public';
import SearchIcon from '@mui/icons-material/Search';
import ScrollAnimation from '@/components/ui/ScrollAnimation';

export type SortOption = 'frequency' | 'alphabetical' | 'popularity' | 'distance';
export type AirlineFilter = string | 'all';
export type FrequencyFilter = 'all' | 'daily' | 'weekly';

interface Route {
  iata: string;
  city: string;
  display: string;
  flights_per_day: string;
  flights_per_week?: number;
  is_domestic?: boolean;
  airline_count?: number;
  popularity_score?: number;
  seasonal?: boolean;
  country?: string;
  distance_km?: number;
  average_duration?: string;
  aircraft_types?: string[];
  reliability?: 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited';
  route_growth?: 'growing' | 'stable' | 'declining';
}

interface AirportToolPanelProps {
  routes: Route[];
  airlines: Array<{ code: string; name: string; iata?: string }>;
  originIata: string;
  originDisplay: string;
  originAirport?: { lat?: number; lng?: number; country?: string };
  routeAirlinesMap?: Map<string, string[]>;
}

export default function AirportToolPanel({
  routes,
  airlines,
  originIata,
  originDisplay,
  originAirport,
  routeAirlinesMap,
}: AirportToolPanelProps) {
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('frequency');
  const [showTopOnly, setShowTopOnly] = useState(false);
  const [destinationSearch, setDestinationSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<FrequencyFilter>('all');
  const [nonstopOnly, setNonstopOnly] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  // Sticky filter bar
  useEffect(() => {
    const handleScroll = () => {
      if (filterBarRef.current) {
        const rect = filterBarRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parse flights_per_day to number for sorting
  const parseFlightsPerDay = (fpd: string): number => {
    const match = fpd.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Get unique countries from routes
  const countries = useMemo(() => {
    const countrySet = new Set(routes.map(r => r.country).filter(Boolean));
    return Array.from(countrySet).sort();
  }, [routes]);

  // Calculate max distance for slider
  const maxDistance = useMemo(() => {
    const distances = routes.map(r => r.distance_km || 0).filter(d => d > 0);
    return distances.length > 0 ? Math.max(...distances) : 20000;
  }, [routes]);

  // Initialize distance range - will be updated when maxDistance is available
  const [distanceRange, setDistanceRange] = useState<[number, number]>([0, 20000]);
  
  // Update distance range when maxDistance changes
  useEffect(() => {
    if (maxDistance > 0) {
      setDistanceRange([0, maxDistance]);
    }
  }, [maxDistance]);

  // Filter and sort routes
  const filteredAndSortedRoutes = useMemo(() => {
    let filtered = routes;

    // Filter by airline (multi-select) - now works with routeAirlinesMap
    if (selectedAirlines.length > 0 && routeAirlinesMap) {
      filtered = filtered.filter(r => {
        const routeAirlines = routeAirlinesMap.get(r.iata) || [];
        return selectedAirlines.some(selected => 
          routeAirlines.some(airline => 
            airline.toLowerCase() === selected.toLowerCase()
          )
        );
      });
    }

    // Filter by destination search
    if (destinationSearch) {
      const searchLower = destinationSearch.toLowerCase();
      filtered = filtered.filter(r => 
        r.display.toLowerCase().includes(searchLower) ||
        r.city.toLowerCase().includes(searchLower) ||
        r.iata.toLowerCase().includes(searchLower)
      );
    }

    // Filter by country/region
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(r => r.country === selectedCountry);
    }

    // Filter by distance range
    filtered = filtered.filter(r => {
      const distance = r.distance_km || 0;
      return distance >= distanceRange[0] && distance <= distanceRange[1];
    });

    // Filter by frequency
    if (frequencyFilter !== 'all') {
      filtered = filtered.filter(r => {
        const daily = parseFlightsPerDay(r.flights_per_day);
        if (frequencyFilter === 'daily') {
          return daily >= 1;
        } else if (frequencyFilter === 'weekly') {
          return daily >= 0.14; // At least 1 flight per week
        }
        return true;
      });
    }

    // Filter nonstop (placeholder - would need route data)
    if (nonstopOnly) {
      // filtered = filtered.filter(r => r.is_nonstop === true);
    }

    // Sort routes
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'frequency':
          return parseFlightsPerDay(b.flights_per_day) - parseFlightsPerDay(a.flights_per_day);
        case 'popularity':
          const aScore = a.popularity_score || parseFlightsPerDay(a.flights_per_day);
          const bScore = b.popularity_score || parseFlightsPerDay(b.flights_per_day);
          return bScore - aScore;
        case 'alphabetical':
          return a.display.localeCompare(b.display);
        case 'distance':
          const aDist = a.distance_km || 0;
          const bDist = b.distance_km || 0;
          return aDist - bDist;
        default:
          return 0;
      }
    });

    // Show top 5 only if enabled
    return showTopOnly ? sorted.slice(0, 5) : sorted;
  }, [routes, selectedAirlines, sortBy, showTopOnly, destinationSearch, selectedCountry, distanceRange, frequencyFilter, nonstopOnly, routeAirlinesMap]);

  const clearFilters = () => {
    setSelectedAirlines([]);
    setDestinationSearch('');
    setSelectedCountry('all');
    setDistanceRange([0, maxDistance]);
    setFrequencyFilter('all');
    setNonstopOnly(false);
  };

  const hasActiveFilters = selectedAirlines.length > 0 || destinationSearch || selectedCountry !== 'all' || 
    distanceRange[0] > 0 || distanceRange[1] < maxDistance || frequencyFilter !== 'all' || nonstopOnly;

  // Get top 5 busiest routes
  const topBusiestRoutes = useMemo(() => {
    return [...routes]
      .sort((a, b) => parseFlightsPerDay(b.flights_per_day) - parseFlightsPerDay(a.flights_per_day))
      .slice(0, 5);
  }, [routes]);

  const handleAirlineChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedAirlines(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
  };

  // Calculate summary stats
  const totalDestinations = filteredAndSortedRoutes.length;
  const directDestinations = routes.filter(r => !r.seasonal).length;
  const totalDailyFlights = routes.reduce((sum, r) => sum + parseFlightsPerDay(r.flights_per_day), 0);

  return (
    <Box sx={{ mb: 4 }}>
      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {totalDestinations}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hasActiveFilters ? 'Filtered Destinations' : 'Direct Destinations'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {directDestinations}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Year-Round Routes
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {airlines.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Operating Airlines
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {totalDailyFlights.toFixed(0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Daily Flights
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Sticky Filter Bar */}
      <Paper 
        ref={filterBarRef}
        sx={{ 
          p: 3, 
          mb: 3,
          position: isSticky ? 'sticky' : 'relative',
          top: isSticky ? 0 : 'auto',
          zIndex: isSticky ? 1000 : 'auto',
          bgcolor: isSticky ? 'background.paper' : 'transparent',
          boxShadow: isSticky ? 3 : 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filters & Sort
            </Typography>
            {hasActiveFilters && (
              <Chip 
                label={`${filteredAndSortedRoutes.length} results`} 
                size="small" 
                color="primary" 
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {hasActiveFilters && (
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
              >
                Clear All
              </Button>
            )}
            <IconButton
              size="small"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
            >
              {filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Basic Filters (Always Visible) */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search Destination"
              value={destinationSearch}
              onChange={(e) => setDestinationSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Airline</InputLabel>
              <Select
                multiple
                value={selectedAirlines}
                label="Filter by Airline"
                onChange={handleAirlineChange}
                renderValue={(selected) => 
                  selected.length === 0 
                    ? 'All Airlines' 
                    : selected.length === 1 
                    ? airlines.find(a => a.code === selected[0])?.name || selected[0]
                    : `${selected.length} airlines`
                }
              >
                {airlines.map((airline) => (
                  <MenuItem key={airline.code} value={airline.code}>
                    <Checkbox checked={selectedAirlines.indexOf(airline.code) > -1} />
                    {airline.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Sort by:</Typography>
              <ButtonGroup size="small" variant="outlined" fullWidth>
                <Button
                  onClick={() => handleSortChange('frequency')}
                  variant={sortBy === 'frequency' ? 'contained' : 'outlined'}
                  startIcon={<TrendingUpIcon />}
                >
                  Frequency
                </Button>
                <Button
                  onClick={() => handleSortChange('popularity')}
                  variant={sortBy === 'popularity' ? 'contained' : 'outlined'}
                  startIcon={<SortIcon />}
                >
                  Popularity
                </Button>
                <Button
                  onClick={() => handleSortChange('alphabetical')}
                  variant={sortBy === 'alphabetical' ? 'contained' : 'outlined'}
                >
                  A-Z
                </Button>
                <Button
                  onClick={() => handleSortChange('distance')}
                  variant={sortBy === 'distance' ? 'contained' : 'outlined'}
                  startIcon={<StraightIcon />}
                >
                  Distance
                </Button>
              </ButtonGroup>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant={showTopOnly ? 'contained' : 'outlined'}
              onClick={() => setShowTopOnly(!showTopOnly)}
              startIcon={<CalendarTodayIcon />}
              fullWidth
            >
              {showTopOnly ? 'Show All Routes' : 'Show Top 5 Only'}
            </Button>
          </Grid>
        </Grid>

        {/* Advanced Filters (Collapsible) */}
        <Collapse in={filtersExpanded}>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Region / Country</InputLabel>
                <Select
                  value={selectedCountry}
                  label="Region / Country"
                  onChange={(e) => setSelectedCountry(e.target.value)}
                >
                  <MenuItem value="all">All Countries</MenuItem>
                  {countries.map((country) => (
                    <MenuItem key={country} value={country}>
                      {country}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Distance Range: {distanceRange[0]} - {distanceRange[1]} km
                </Typography>
                <Slider
                  value={distanceRange}
                  onChange={(_, newValue) => setDistanceRange(newValue as [number, number])}
                  valueLabelDisplay="auto"
                  min={0}
                  max={maxDistance}
                  step={100}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={frequencyFilter}
                  label="Frequency"
                  onChange={(e) => setFrequencyFilter(e.target.value as FrequencyFilter)}
                >
                  <MenuItem value="all">All Frequencies</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={nonstopOnly}
                    onChange={(e) => setNonstopOnly(e.target.checked)}
                  />
                }
                label="Nonstop Only"
              />
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {/* Top 5 Busiest Routes */}
      {topBusiestRoutes.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom sx={{ fontSize: '1.25rem', fontWeight: 600, mb: 2 }}>
            Top 5 Busiest Routes from {originDisplay}
          </Typography>
          <Grid container spacing={2}>
            {topBusiestRoutes.map((route, index) => {
              const routeSlug = `${originIata.toLowerCase()}-${route.iata.toLowerCase()}`;
              const flightsPerWeek = route.flights_per_week || parseFlightsPerDay(route.flights_per_day) * 7;
              
              return (
                <Grid item xs={12} sm={6} md={4} key={route.iata}>
                  <Paper
                    component={Link}
                    href={`/flights/${routeSlug}`}
                    sx={{
                      p: 2,
                      textDecoration: 'none',
                      display: 'block',
                      height: '100%',
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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={`#${index + 1}`}
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                        <FlightIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      </Box>
                      {route.seasonal && (
                        <Chip
                          label="Seasonal"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {route.display}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {route.flights_per_day} daily
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ~{Math.round(flightsPerWeek)} flights/week
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Route List */}
      <Box id="routes-section">
        <Typography variant="h3" gutterBottom sx={{ fontSize: '1.25rem', fontWeight: 600, mb: 2 }}>
          {hasActiveFilters ? 'Filtered Routes' : `All Routes from ${originDisplay}`}
        </Typography>
        <Grid container spacing={2}>
          {filteredAndSortedRoutes.map((route, index) => {
            const routeSlug = `${originIata.toLowerCase()}-${route.iata.toLowerCase()}`;
            const flightsPerWeek = route.flights_per_week || parseFlightsPerDay(route.flights_per_day) * 7;
            const popularityBadge = route.popularity_score 
              ? route.popularity_score > 8 ? 'Very Popular' 
                : route.popularity_score > 5 ? 'Popular' 
                : route.popularity_score > 2 ? 'Moderate' 
                : 'Limited'
              : null;
            const isExpanded = expandedRoute === route.iata;

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={route.iata}>
                <ScrollAnimation delay={index * 50} direction="fadeIn">
                  <Paper
                    sx={{
                      p: 2,
                      display: 'block',
                      height: '100%',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: 'primary.main',
                        transform: 'translateY(-4px) scale(1.02)',
                        boxShadow: 4,
                        '& .route-preview': {
                          opacity: 1,
                          maxHeight: '200px',
                        },
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                  <Box 
                    component={Link}
                    href={`/flights/${routeSlug}`}
                    sx={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <FlightIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {route.seasonal && (
                          <Chip label="Seasonal" size="small" color="warning" variant="outlined" />
                        )}
                        {popularityBadge && (
                          <Chip
                            label={popularityBadge}
                            size="small"
                            color={route.popularity_score! > 8 ? 'success' : route.popularity_score! > 5 ? 'info' : 'default'}
                            variant="outlined"
                          />
                        )}
                        {route.reliability && (
                          <Chip
                            label={route.reliability}
                            size="small"
                            color={
                              route.reliability === 'Very Stable' ? 'success' :
                              route.reliability === 'Moderate' ? 'info' :
                              route.reliability === 'Seasonal' ? 'warning' : 'default'
                            }
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {route.display}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {route.flights_per_day} daily • ~{Math.round(flightsPerWeek)}/week
                    </Typography>
                    {route.airline_count && route.airline_count > 1 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {route.airline_count} airlines
                      </Typography>
                    )}
                    {route.distance_km && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {route.distance_km.toLocaleString()} km
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Hover Preview - Shows on hover */}
                  <Box
                    className="route-preview"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      bgcolor: 'background.paper',
                      p: 1.5,
                      opacity: 0,
                      maxHeight: 0,
                      transition: 'opacity 0.3s, max-height 0.3s',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Quick Stats:
                    </Typography>
                    {route.average_duration && (
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        ⏱️ {route.average_duration}
                      </Typography>
                    )}
                    {route.airline_count && route.airline_count > 0 && (
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        ✈️ {route.airline_count} airline{route.airline_count !== 1 ? 's' : ''}
                      </Typography>
                    )}
                    {route.reliability && (
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        ✓ {route.reliability}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Expandable Details */}
                  <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      size="small"
                      fullWidth
                      onClick={(e) => {
                        e.preventDefault();
                        setExpandedRoute(isExpanded ? null : route.iata);
                      }}
                      endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                      {isExpanded ? 'Less Details' : 'More Details'}
                    </Button>
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2 }}>
                        <Grid container spacing={1}>
                          {route.average_duration && (
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Duration:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {route.average_duration}
                              </Typography>
                            </Grid>
                          )}
                          {route.distance_km && (
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Distance:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {route.distance_km.toLocaleString()} km
                              </Typography>
                            </Grid>
                          )}
                          {route.aircraft_types && route.aircraft_types.length > 0 && (
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary">
                                Aircraft:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {route.aircraft_types.slice(0, 3).join(', ')}
                                {route.aircraft_types.length > 3 && '...'}
                              </Typography>
                            </Grid>
                          )}
                          {route.popularity_score !== undefined && (
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Popularity:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {route.popularity_score.toFixed(1)}/10
                              </Typography>
                            </Grid>
                          )}
                          {route.route_growth && (
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Trend:
                              </Typography>
                              <Chip
                                label={route.route_growth}
                                size="small"
                                color={
                                  route.route_growth === 'growing' ? 'success' :
                                  route.route_growth === 'stable' ? 'info' : 'default'
                                }
                              />
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    </Collapse>
                  </Box>
                </Paper>
              </ScrollAnimation>
            </Grid>
          );
        })}
        </Grid>
        {filteredAndSortedRoutes.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No routes match your filters. Try adjusting your search criteria.
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
