import { Flight } from './queries';

/**
 * Get flight time range (min and max duration)
 */
export function getFlightTimeRange(flights: Flight[]): string | undefined {
  if (!flights || flights.length === 0) return undefined;

  const durations: number[] = [];
  flights.forEach((flight) => {
    if (flight.duration && typeof flight.duration === 'string') {
      try {
        // Parse duration like "2h 30m" or "1h 45m"
        const match = String(flight.duration).match(/(\d+)h\s*(\d+)m/);
        if (match && match[1] && match[2]) {
          const hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          if (!isNaN(hours) && !isNaN(minutes)) {
            durations.push(hours * 60 + minutes);
          }
        }
      } catch (error) {
        // Skip invalid duration
      }
    }
  });

  if (durations.length === 0) return undefined;

  const minMinutes = Math.min(...durations);
  const maxMinutes = Math.max(...durations);

  const minHours = Math.floor(minMinutes / 60);
  const minMins = minMinutes % 60;
  const maxHours = Math.floor(maxMinutes / 60);
  const maxMins = maxMinutes % 60;

  return `${minHours}h ${minMins}m - ${maxHours}h ${maxMins}m`;
}

/**
 * Get earliest flight time
 */
export function getEarliestFlight(flights: Flight[]): string | undefined {
  if (!flights || flights.length === 0) return undefined;

  const times = flights
    .map((f) => f.departure_time)
    .filter(Boolean)
    .sort();

  return times[0];
}

/**
 * Get last flight time
 */
export function getLastFlight(flights: Flight[]): string | undefined {
  if (!flights || flights.length === 0) return undefined;

  const times = flights
    .map((f) => f.departure_time)
    .filter(Boolean)
    .sort();

  return times[times.length - 1];
}

/**
 * Calculate flights per week from flights per day
 */
export function calculateFlightsPerWeek(flightsPerDay: string | undefined | null): number | undefined {
  // Comprehensive null/undefined checks
  if (!flightsPerDay || flightsPerDay === null || flightsPerDay === undefined) return undefined;
  if (typeof flightsPerDay !== 'string') return undefined;
  if (flightsPerDay.length === 0) return undefined;

  try {
    // Extract number from strings like "12-21 flights" or "15 flights"
    // Use String() conversion as final safeguard
    const str = String(flightsPerDay);
    const match = str.match(/(\d+)/);
    if (match && match[1]) {
      const avg = parseInt(match[1], 10);
      if (!isNaN(avg)) {
        return avg * 7;
      }
    }
  } catch (error) {
    // If anything goes wrong, return undefined
    console.error('Error calculating flights per week:', error, flightsPerDay);
    return undefined;
  }

  return undefined;
}

/**
 * Format distance with miles and km
 */
export function formatDistance(distance: string | undefined): string | undefined {
  if (!distance) return undefined;

  // If already formatted, return as is
  if (distance.includes('miles') || distance.includes('km')) {
    return distance;
  }

  // If just a number (assume km), convert to miles and format
  try {
    if (typeof distance !== 'string') return distance;
    const kmMatch = String(distance).match(/(\d+(?:\.\d+)?)\s*(?:km|kilometers?)?/i);
    if (kmMatch && kmMatch[1]) {
      const km = parseFloat(kmMatch[1]);
      if (!isNaN(km)) {
        const miles = Math.round(km * 0.621371);
        return `${miles} miles (${Math.round(km)} km)`;
      }
    }
  } catch (error) {
    // Return original distance if parsing fails
  }

  return distance;
}

/**
 * Get terminal for a specific airline at an airport
 */
export function getTerminalForAirline(
  terminals: Array<{ name: string; airlines: string[] }> | undefined,
  airlineCode: string
): string | undefined {
  if (!terminals || !airlineCode) return undefined;

  const terminal = terminals.find((t) =>
    t.airlines.some((a) => a.toUpperCase() === airlineCode.toUpperCase())
  );

  return terminal?.name;
}

/**
 * Get all terminals used by airlines on a route
 */
export function getTerminalsForRoute(
  originTerminals: Array<{ name: string; airlines: string[] }> | undefined,
  destinationTerminals: Array<{ name: string; airlines: string[] }> | undefined,
  airlines: string[]
): { departing?: string; arriving?: string } {
  const departingTerminals = new Set<string>();
  const arrivingTerminals = new Set<string>();

  airlines.forEach((airlineCode) => {
    const depTerminal = getTerminalForAirline(originTerminals, airlineCode);
    if (depTerminal) departingTerminals.add(depTerminal);

    const arrTerminal = getTerminalForAirline(destinationTerminals, airlineCode);
    if (arrTerminal) arrivingTerminals.add(arrTerminal);
  });

  return {
    departing: departingTerminals.size > 0 ? Array.from(departingTerminals).join(' & ') : undefined,
    arriving: arrivingTerminals.size > 0 ? Array.from(arrivingTerminals).join(' & ') : undefined,
  };
}

