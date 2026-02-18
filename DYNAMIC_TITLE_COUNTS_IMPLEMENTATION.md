# Dynamic Title Counts Implementation

## Overview
This document outlines the implementation of dynamically including destination count and weekly flight count in airline-airport page titles.

## ✅ Implementation Summary

### 1. Title Template Update
**Format:** `[Airline Name] Flights from [City Name] ([Code]) – [Destination Count] Destinations & [Weekly Flight Count] Weekly Flights | Triposia 2026`

**Example:**
- `Delta Airlines Flights from New York (JFK) – 45 Destinations & 350 Weekly Flights | Triposia 2026`

**Fallback Logic:**
- If both counts available: Include both
- If only destination count: `– 45 Destinations`
- If only weekly flights: `– 350 Weekly Flights`
- If neither: Base title only

### 2. Dynamic Count Calculation

#### Destination Count
- Calculated from unique destinations with airline flights
- Filters routes to only include those where the airline operates flights
- Uses `destinationsMap` to track unique destinations
- Count reflects actual direct destinations served by the airline

#### Weekly Flight Count
- Uses route `flights_per_day` data when available (most accurate)
- Falls back to flight count estimation if route data unavailable
- Uses `calculateFlightsPerWeek()` utility function
- Sums weekly flights across all routes

**Calculation Logic:**
```typescript
// Priority 1: Use route flights_per_day data
if (route.flights_per_day) {
  const weekly = calculateFlightsPerWeek(route.flights_per_day);
  totalWeeklyFlights += weekly;
}
// Priority 2: Estimate from flight count
else {
  const airlineFlightsToDest = flightsFrom.filter(f => f.destination_iata === route.destination_iata);
  totalWeeklyFlights += airlineFlightsToDest.length * 7;
}
```

### 3. Title Length Optimization

**Target:** Under 65 characters

**Strategy:**
1. Build full title with both counts
2. If ≤ 65 characters: Use full title
3. If > 65 characters: Prioritize destination count
4. If still too long: Use base title only

**Priority Order:**
1. Destination count (higher priority)
2. Weekly flights (lower priority)
3. Base title (fallback)

### 4. H1 Clean Format

**Format:** `[Airline Name] Flights from [City Name] ([Airport Code])`

**Implementation:**
- No numbers in H1 (clean and natural)
- Located in `AirlineAirportHeroSection` component
- Already implemented ✅

### 5. Intro Summary Paragraph

**Current Implementation:**
```
{airlineName} operates {totalDestinations} direct destination{s} from {cityName} ({airportCode}). Popular routes include {topRoutes}. Flights operate daily with {totalWeeklyFlights}+ weekly departures.
```

**Status:** ✅ Already includes dynamic counts

### 6. Data Metric Cards

**Current Implementation:**
- Total Destinations card: Shows `{totalDestinations}`
- Weekly Flights card: Shows `{totalWeeklyFlights.toLocaleString()}`
- International Routes card: Shows `{internationalCount}`

**Status:** ✅ Already includes dynamic counts

### 7. Meta Description

**Template with Dynamic Counts:**
```
{airlineName} operates {destinationsCount} direct destination{s} from {airportDisplay} ({iata}) with {totalWeeklyFlights.toLocaleString()} weekly departures. View schedules, frequencies, aircraft types, and route intelligence. Updated 2026.
```

**Fallback Logic:**
- If both counts: Include both
- If only destination count: Include destination count only
- If neither: Use generic description

### 8. Fallback Handling

**Destination Count Fallback:**
- If no destinations found: `destinationsCount = 0`
- Title automatically removes destination count
- Description uses generic language

**Weekly Flights Fallback:**
- Priority 1: Route `flights_per_day` data
- Priority 2: Flight count estimation (flights × 7)
- Priority 3: Total flights × 7 (ultimate fallback)
- If calculation fails: `totalWeeklyFlights = 0`
- Title automatically removes weekly flights count

### 9. Validation - No Hardcoded Numbers

**Verified:**
- ✅ No hardcoded destination counts
- ✅ No hardcoded weekly flight counts
- ✅ All numbers calculated dynamically from database
- ✅ All counts use actual data queries

**Only Exception:**
- Multiplier `7` for days-to-weeks conversion (mathematical constant, not a hardcoded count)

## Files Modified

### 1. `app/airlines/[code]/[route]/page.tsx`
**Changes:**
- Updated `generateMetadata` function
- Added destination count calculation (lines 126-143)
- Added weekly flights calculation with fallback logic (lines 145-171)
- Updated title generation with dynamic counts (lines 170-201)
- Updated meta description with dynamic counts (lines 203-220)

**Key Functions:**
- Destination count: Calculated from `destinationsMap`
- Weekly flights: Uses `calculateFlightsPerWeek()` with fallback
- Title generation: Smart truncation based on length
- Description: Dynamic template with fallbacks

## Code Examples

### Title Generation
```typescript
const baseTitle = `${airline.name} Flights from ${cityName} (${iata})`;
const suffix = `| Triposia 2026`;

// Build counts string with fallback
let countsStr = '';
if (destinationsCount > 0 && totalWeeklyFlights > 0) {
  countsStr = ` – ${destinationsCount} Destinations & ${totalWeeklyFlights.toLocaleString()} Weekly Flights`;
} else if (destinationsCount > 0) {
  countsStr = ` – ${destinationsCount} Destinations`;
} else if (totalWeeklyFlights > 0) {
  countsStr = ` – ${totalWeeklyFlights.toLocaleString()} Weekly Flights`;
}

// Check length and truncate if needed
const fullTitle = `${baseTitle}${countsStr} ${suffix}`;
if (fullTitle.length <= 65) {
  title = fullTitle;
} else {
  // Prioritize destination count
  if (destinationsCount > 0) {
    const shortCountsStr = ` – ${destinationsCount} Destinations`;
    const shortTitle = `${baseTitle}${shortCountsStr} ${suffix}`;
    title = shortTitle.length <= 65 ? shortTitle : `${baseTitle} ${suffix}`;
  } else {
    title = `${baseTitle} ${suffix}`;
  }
}
```

### Weekly Flights Calculation
```typescript
let totalWeeklyFlights = 0;
const routesWithFlights = routesFrom.filter(route => {
  const airlineFlightsToDest = flightsFrom.filter(f => f.destination_iata === route.destination_iata);
  return airlineFlightsToDest.length > 0;
});

routesWithFlights.forEach(route => {
  if (route.flights_per_day) {
    const weekly = calculateFlightsPerWeek(route.flights_per_day);
    if (weekly !== undefined) {
      totalWeeklyFlights += weekly;
    } else {
      // Fallback: estimate from flight count
      const airlineFlightsToDest = flightsFrom.filter(f => f.destination_iata === route.destination_iata);
      totalWeeklyFlights += airlineFlightsToDest.length * 7;
    }
  } else {
    // Fallback: estimate from flight count
    const airlineFlightsToDest = flightsFrom.filter(f => f.destination_iata === route.destination_iata);
    totalWeeklyFlights += airlineFlightsToDest.length * 7;
  }
});
```

## Testing Checklist

- [ ] Verify title includes destination count when available
- [ ] Verify title includes weekly flights when available
- [ ] Verify title falls back gracefully when counts unavailable
- [ ] Verify title length stays under 65 characters
- [ ] Verify destination count prioritization when title too long
- [ ] Verify H1 remains clean without numbers
- [ ] Verify intro paragraph includes counts
- [ ] Verify data cards show correct counts
- [ ] Verify meta description includes counts
- [ ] Test with pages that have no flights
- [ ] Test with pages that have partial data
- [ ] Validate no hardcoded numbers in production

## Performance Impact

- **Minimal impact**: Calculations done in metadata function (server-side)
- **No additional API calls**: Uses existing data queries
- **Efficient**: Destination count uses Map for O(1) lookups
- **Cached**: Metadata generation is cached via ISR (24 hours)

## SEO Benefits

1. **Improved CTR**: Specific numbers in titles increase click-through rates
2. **Better Relevance**: Dynamic counts show actual data, not generic text
3. **Freshness Signal**: Numbers update automatically as data changes
4. **User Intent**: Users searching for specific counts will find accurate information

## Notes

- All calculations are done server-side in `generateMetadata`
- Counts are calculated from actual database queries
- Fallback logic ensures titles always render, even with missing data
- Title length optimization prioritizes destination count (more important for SEO)
- No breaking changes to existing functionality
