import { getRoutesFromAirport, getRoutesToAirport, getAirportSummary, getAllAirlines } from './queries';
import { Route, AirportSummary, Airline } from './queries';
import { shouldIndexRoute, shouldIndexAirport } from './indexing';

/**
 * Enhanced linking for airport pages - expanded limits for better internal linking
 * Still maintains SEO safety with quality checks
 */
export const ENHANCED_LINK_LIMITS = {
  airport: {
    relatedAirports: 20, // Expanded from 6
    airlinePages: 10, // Expanded from 6
    topRoutes: 10, // Expanded from 6
    countryHubs: 5,
    nearbyAirports: 5,
    maxTotal: 50, // Increased but still controlled
  },
} as const;

/**
 * Get related airports for an airport page
 * Includes airports from same country, nearby airports, and major hubs
 */
export async function getEnhancedRelatedAirports(
  airportIata: string,
  airport: AirportSummary | null,
  limit: number = ENHANCED_LINK_LIMITS.airport.relatedAirports
): Promise<Array<{ iata: string; city?: string; name?: string; country?: string; shouldIndex: boolean; reason?: string }>> {
  if (!airport) return [];

  const related: Array<{ iata: string; city?: string; name?: string; country?: string; shouldIndex: boolean; reason?: string }> = [];

  // 1. Get airports from routes (destinations and origins)
  const routesFrom = await getRoutesFromAirport(airportIata);
  const routesTo = await getRoutesToAirport(airportIata);
  
  const destinationIatas = Array.from(new Set(routesFrom.map(r => r.destination_iata)));
  const originIatas = Array.from(new Set(routesTo.map(r => r.origin_iata)));
  
  const allRouteAirports = [...destinationIatas, ...originIatas].filter(iata => iata !== airportIata);
  
  // Get airport details for route airports
  const routeAirportsData = await Promise.all(
    allRouteAirports.slice(0, 15).map(async (iata) => {
      const airportData = await getAirportSummary(iata);
      const indexingCheck = airportData ? shouldIndexAirport(airportData, []) : { shouldIndex: false };
      const shouldIndex = indexingCheck.shouldIndex;
      return {
        iata,
        city: airportData?.city,
        name: airportData?.name,
        country: airportData?.country,
        shouldIndex,
        reason: 'Connected route',
      };
    })
  );
  
  related.push(...routeAirportsData.filter(a => a.shouldIndex));

  // 2. Get airports from same country (if we have country data)
  if (airport.country) {
    // This would require a query to get airports by country
    // For now, we'll use route airports that match the country
    const sameCountryAirports = routeAirportsData.filter(
      a => a.country?.toLowerCase() === airport.country?.toLowerCase() && !related.find(r => r.iata === a.iata)
    );
    related.push(...sameCountryAirports.slice(0, 5));
  }

  // 3. Nearby airports (based on coordinates if available)
  if (airport.lat && airport.lng) {
    // This would require a geospatial query
    // For now, placeholder - would need to implement distance-based search
    // related.push(...nearbyAirports);
  }

  // Remove duplicates and limit
  const unique = Array.from(
    new Map(related.map(item => [item.iata, item])).values()
  ).slice(0, limit);

  return unique;
}

/**
 * Get airline pages operating at an airport
 * Returns airlines with their airport-specific pages
 */
export async function getAirlinePagesForAirport(
  airportIata: string,
  limit: number = ENHANCED_LINK_LIMITS.airport.airlinePages
): Promise<Array<{ code: string; name: string; iata?: string; airportPage: string; routeCount: number }>> {
  const routesFrom = await getRoutesFromAirport(airportIata);
  
  // Get unique airline codes from routes
  const airlineCodes = new Set<string>();
  routesFrom.forEach(route => {
    // Extract airline codes from route data if available
    // This is a placeholder - would need actual airline-route mapping
  });

  // Get flights to extract airline codes
  const { getFlightsFromAirport } = await import('./queries');
  const flights = await getFlightsFromAirport(airportIata);
  const airlineIatas = Array.from(new Set(flights.map(f => f.airline_iata).filter(Boolean)));
  
  // Get airline details
  const allAirlines = await getAllAirlines();
  const airlineMap = new Map(allAirlines.map(a => [a.iata?.toLowerCase() || a.code.toLowerCase(), a]));
  
  const airlinePages = airlineIatas
    .slice(0, limit * 2)
    .map(airlineIata => {
      const airline = airlineMap.get(airlineIata.toLowerCase());
      if (!airline) return null;
      
      const code = airline.iata || airline.code || '';
      const routeCount = routesFrom.filter(r => {
        // Count routes for this airline (would need airline-route mapping)
        return true; // Placeholder
      }).length;
      
      return {
        code: code.toLowerCase(),
        name: airline.name,
        iata: airline.iata,
        airportPage: `/airlines/${code.toLowerCase()}/${airportIata.toLowerCase()}`,
        routeCount,
      };
    })
    .filter((airline): airline is NonNullable<typeof airline> => airline !== null)
    .slice(0, limit);

  return airlinePages;
}

/**
 * Get top route pages from an airport
 */
export async function getTopRoutePages(
  airportIata: string,
  limit: number = ENHANCED_LINK_LIMITS.airport.topRoutes
): Promise<Array<Route & { shouldIndex: boolean; routePage: string }>> {
  const routesFrom = await getRoutesFromAirport(airportIata);
  
  // Check indexing and sort by frequency
  const routesWithIndexing = await Promise.all(
    routesFrom.slice(0, limit * 2).map(async (route) => {
      // Parse flights_per_day for sorting
      // Safely parse flights_per_day with comprehensive null checks
      let frequency = 0;
      if (route.flights_per_day && typeof route.flights_per_day === 'string') {
        try {
          const match = String(route.flights_per_day).match(/(\d+(?:\.\d+)?)/);
          if (match && match[1]) {
            frequency = parseFloat(match[1]);
            if (isNaN(frequency)) frequency = 0;
          }
        } catch (error) {
          frequency = 0;
        }
      }
      
      const shouldIndex = route.has_flight_data === true;
      const routePage = `/flights/${airportIata.toLowerCase()}-${route.destination_iata.toLowerCase()}`;
      
      return {
        ...route,
        shouldIndex,
        routePage,
        frequency,
      };
    })
  );
  
  // Filter indexable routes, sort by frequency, and limit
  return routesWithIndexing
    .filter(r => r.shouldIndex)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit)
    .map(({ frequency, ...route }) => route);
}

/**
 * Get country hub page link (if applicable)
 */
export async function getCountryHubLink(
  airport: AirportSummary
): Promise<{ url: string; label: string } | null> {
  if (!airport.country) return null;
  
  // Format country for URL (lowercase, replace spaces with hyphens)
  const countrySlug = airport.country.toLowerCase().replace(/\s+/g, '-');
  
  return {
    url: `/flights/country/${countrySlug}`,
    label: `${airport.country} Flight Hubs`,
  };
}

/**
 * Get nearby major airports (placeholder - requires geospatial query)
 */
export async function getNearbyMajorAirports(
  airportIata: string,
  airport: AirportSummary | null,
  limit: number = ENHANCED_LINK_LIMITS.airport.nearbyAirports
): Promise<Array<{ iata: string; city?: string; name?: string; distance?: number; shouldIndex: boolean }>> {
  if (!airport || !airport.lat || !airport.lng) return [];
  
  // Placeholder: Would require geospatial MongoDB query
  // Query airports collection with $near operator
  // Filter by major airports (destinations_count > threshold)
  // Calculate distance
  // Return top N
  
  return [];
}
