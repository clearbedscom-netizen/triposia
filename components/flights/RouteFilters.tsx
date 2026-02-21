'use client';

import { memo } from 'react';
import { Box, Chip, Typography, Stack, Select, MenuItem, FormControl, InputLabel, OutlinedInput, Slider } from '@mui/material';
import { FilterList } from '@mui/icons-material';

export type RouteTypeFilter = 'all' | 'domestic' | 'international';
export type StopFilter = 'all' | 'direct' | 'one-stop' | 'two-stop';
export type DistanceFilter = 'all' | 'short' | 'medium' | 'long' | 'custom';

interface Airline {
  code: string;
  name: string;
  iata?: string;
}

interface RouteFiltersProps {
  routeType: RouteTypeFilter;
  onRouteTypeChange: (value: RouteTypeFilter) => void;
  stopType: StopFilter;
  onStopTypeChange: (value: StopFilter) => void;
  showStopFilter?: boolean; // Optional - only show if we have stop data
  // New filters
  selectedAirlines?: string[];
  onAirlinesChange?: (airlines: string[]) => void;
  availableAirlines?: Airline[];
  distanceFilter?: DistanceFilter;
  onDistanceFilterChange?: (value: DistanceFilter) => void;
  distanceRange?: [number, number];
  onDistanceRangeChange?: (range: [number, number]) => void;
  maxDistance?: number;
}

function RouteFilters({
  routeType,
  onRouteTypeChange,
  stopType,
  onStopTypeChange,
  showStopFilter = false,
  selectedAirlines = [],
  onAirlinesChange,
  availableAirlines = [],
  distanceFilter = 'all',
  onDistanceFilterChange,
  distanceRange = [0, 20000],
  onDistanceRangeChange,
  maxDistance = 20000,
}: RouteFiltersProps) {
  const handleAirlinesChange = (event: any) => {
    const value = event.target.value;
    if (onAirlinesChange) {
      onAirlinesChange(typeof value === 'string' ? value.split(',') : value);
    }
  };

  const handleDistancePreset = (preset: DistanceFilter) => {
    if (onDistanceFilterChange) {
      onDistanceFilterChange(preset);
    }
    if (onDistanceRangeChange) {
      switch (preset) {
        case 'short':
          onDistanceRangeChange([0, 1000]);
          break;
        case 'medium':
          onDistanceRangeChange([1000, 3000]);
          break;
        case 'long':
          onDistanceRangeChange([3000, maxDistance]);
          break;
        case 'all':
          onDistanceRangeChange([0, maxDistance]);
          break;
      }
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FilterList fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Filters
        </Typography>
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
        {/* Route Type Filter */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Route Type
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label="All"
              onClick={() => onRouteTypeChange('all')}
              color={routeType === 'all' ? 'primary' : 'default'}
              variant={routeType === 'all' ? 'filled' : 'outlined'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Domestic"
              onClick={() => onRouteTypeChange('domestic')}
              color={routeType === 'domestic' ? 'primary' : 'default'}
              variant={routeType === 'domestic' ? 'filled' : 'outlined'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="International"
              onClick={() => onRouteTypeChange('international')}
              color={routeType === 'international' ? 'primary' : 'default'}
              variant={routeType === 'international' ? 'filled' : 'outlined'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
          </Stack>
        </Box>

        {/* Airlines Filter */}
        {availableAirlines.length > 0 && onAirlinesChange && (
          <Box sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Airlines
            </Typography>
            <FormControl size="small" fullWidth>
              <Select
                multiple
                value={selectedAirlines}
                onChange={handleAirlinesChange}
                input={<OutlinedInput label="Airlines" />}
                renderValue={(selected) => {
                  if (selected.length === 0 || (selected.length === 1 && selected[0] === 'all')) return 'All Airlines';
                  if (selected.length === 1) {
                    const airline = availableAirlines.find(a => a.code === selected[0] || a.iata === selected[0]);
                    return airline?.name || selected[0];
                  }
                  return `${selected.length} airlines`;
                }}
                sx={{ minHeight: 36 }}
              >
                {availableAirlines.map((airline) => (
                  <MenuItem key={airline.code || airline.iata} value={airline.code || airline.iata}>
                    {airline.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Distance Filter */}
        {onDistanceFilterChange && onDistanceRangeChange && (
          <Box sx={{ minWidth: { xs: '100%', sm: 250 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Distance
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label="All"
                  onClick={() => handleDistancePreset('all')}
                  color={distanceFilter === 'all' ? 'primary' : 'default'}
                  variant={distanceFilter === 'all' ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label="Short (<1,000 km)"
                  onClick={() => handleDistancePreset('short')}
                  color={distanceFilter === 'short' ? 'primary' : 'default'}
                  variant={distanceFilter === 'short' ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label="Medium (1,000-3,000 km)"
                  onClick={() => handleDistancePreset('medium')}
                  color={distanceFilter === 'medium' ? 'primary' : 'default'}
                  variant={distanceFilter === 'medium' ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label="Long (>3,000 km)"
                  onClick={() => handleDistancePreset('long')}
                  color={distanceFilter === 'long' ? 'primary' : 'default'}
                  variant={distanceFilter === 'long' ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ cursor: 'pointer' }}
                />
              </Stack>
              {distanceFilter === 'custom' && (
                <Box sx={{ px: 1 }}>
                  <Slider
                    value={distanceRange}
                    onChange={(_, newValue) => {
                      if (onDistanceRangeChange && Array.isArray(newValue)) {
                        onDistanceRangeChange([newValue[0], newValue[1]]);
                      }
                    }}
                    valueLabelDisplay="auto"
                    min={0}
                    max={maxDistance}
                    step={100}
                    valueLabelFormat={(value) => `${value} km`}
                    sx={{ mt: 1 }}
                  />
                </Box>
              )}
            </Stack>
          </Box>
        )}

        {/* Stop Filter */}
        {showStopFilter && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Stops
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label="All"
                onClick={() => onStopTypeChange('all')}
                color={stopType === 'all' ? 'primary' : 'default'}
                variant={stopType === 'all' ? 'filled' : 'outlined'}
                size="small"
                sx={{ cursor: 'pointer' }}
              />
              <Chip
                label="Direct"
                onClick={() => onStopTypeChange('direct')}
                color={stopType === 'direct' ? 'primary' : 'default'}
                variant={stopType === 'direct' ? 'filled' : 'outlined'}
                size="small"
                sx={{ cursor: 'pointer' }}
              />
              <Chip
                label="1 Stop"
                onClick={() => onStopTypeChange('one-stop')}
                color={stopType === 'one-stop' ? 'primary' : 'default'}
                variant={stopType === 'one-stop' ? 'filled' : 'outlined'}
                size="small"
                sx={{ cursor: 'pointer' }}
              />
              <Chip
                label="2 Stops"
                onClick={() => onStopTypeChange('two-stop')}
                color={stopType === 'two-stop' ? 'primary' : 'default'}
                variant={stopType === 'two-stop' ? 'filled' : 'outlined'}
                size="small"
                sx={{ cursor: 'pointer' }}
              />
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(RouteFilters);
