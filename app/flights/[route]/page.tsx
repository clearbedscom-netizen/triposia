import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Container, Typography, Box, Grid, Paper, Card, CardContent } from '@mui/material';
import { getRoute, getDeepRoute, getFlightsByRoute, getRouteWithMetadata, getPoisByAirport, getAirportSummary, getAllAirlines, getAirline, getFlightsFromAirport, getFlightsToAirport, getRoutesFromAirport, getRoutesToAirport, getDestinationData, getWeatherByAirport, getBookingInsightsByAirport, getPriceTrendsByAirport, getApoisByAirport } from '@/lib/queries';
import { generateMetadata as genMeta, generateBreadcrumbList, generateFlightRouteSchema, generateFlightListingSchema, generatePriceCalendarSchema, generateFlightScheduleSchema, generateFAQPageSchema, generateAirportDeparturesListingSchema, generateAirportDeparturesScheduleSchema, generateAirportArrivalsListingSchema, generateAirportArrivalsScheduleSchema, generateAirportFlightsListSchema, generateAirlineScheduleSchema, parseRouteSlug, generateRouteListSchema, generateAirportSchema } from '@/lib/seo';
import { 
  calculateReliability, 
  extractAircraftTypes, 
  categorizeAircraft, 
  getBestTimeToFly, 
  getBusiestHours, 
  getAverageDuration, 
  extractRouteMetadata 
} from '@/lib/insights';
import { shouldIndexRoute } from '@/lib/indexing';
import { 
  evaluateRoutePageQuality
} from '@/lib/pageQuality';
import { 
  getFlightTimeRange, 
  getEarliestFlight, 
  getLastFlight, 
  calculateFlightsPerWeek, 
  formatDistance,
  getTerminalsForRoute
} from '@/lib/routeUtils';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import FlightTable from '@/components/ui/FlightTableLazy';
import StatCard from '@/components/ui/StatCard';
import RouteHeader from '@/components/flights/RouteHeader';
import RouteInfoCards from '@/components/flights/RouteInfoCards';
import RouteTruthBlock from '@/components/flights/RouteTruthBlock';
import FlightCalendarWrapper from '@/components/flights/FlightCalendarWrapperLazy';
import PriceStatistics from '@/components/flights/PriceStatisticsLazy';
import WeatherCharts from '@/components/flights/WeatherChartsLazy';
import TravelPlanning from '@/components/flights/TravelPlanning';
import PoiSection from '@/components/poi/PoiSection';
import WeatherSection from '@/components/travel/WeatherSection';
import BookingInsightsSection from '@/components/travel/BookingInsightsSection';
import PriceTrendsSection from '@/components/travel/PriceTrendsSection';
import AirportMap from '@/components/maps/AirportMap';
import RouteMap from '@/components/maps/RouteMap';
import { getAirlinesForRoute, formatAirportAnchor, formatAirlineAnchor, getRelatedRoutes } from '@/lib/linking';
import { getEnhancedRelatedAirports, getAirlinePagesForAirport, getTopRoutePages, getCountryHubLink } from '@/lib/enhancedLinking';
import RelatedPages from '@/components/ui/RelatedPages';
import RelatedLinksSection from '@/components/ui/RelatedLinksSection';

// Lazy load client components
const RouteDataVisualizationLazy = dynamic(() => import('@/components/flights/RouteDataVisualizationLazy'), {
  ssr: false,
  loading: () => <Box sx={{ p: 3, textAlign: 'center' }}>Loading visualizations...</Box>,
});

const FilterableFlightsSectionLazy = dynamic(() => import('@/components/flights/FilterableFlightsSectionLazy'), {
  ssr: false,
  loading: () => <Box sx={{ p: 3, textAlign: 'center', minHeight: 200 }}>Loading flights...</Box>,
});
import EnhancedAirportMap from '@/components/maps/EnhancedAirportMap';
import AirportSummarySection from '@/components/flights/AirportSummarySection';
import RoutesByAirlineGroup from '@/components/flights/RoutesByAirlineGroup';
import RoutesByRegionGroup from '@/components/flights/RoutesByRegionGroup';
import { categorizeByRegion } from '@/lib/regionUtils';
import SortableRouteTable from '@/components/flights/SortableRouteTable';
import VisualAnalyticsBlock from '@/components/flights/VisualAnalyticsBlock';
import AirportHeroSection from '@/components/flights/AirportHeroSection';
import ConnectivityScore from '@/components/flights/ConnectivityScore';
import AISummaryBlock from '@/components/flights/AISummaryBlock';
import { formatAirportDisplay, formatAirportName } from '@/lib/formatting';
import { generateRouteFAQs, generateAirportFAQs } from '@/lib/faqGenerators';
import { stripHtml } from '@/lib/utils/html';
import { getSiteUrl } from '@/lib/company';
import { generateRouteInsights, shouldRenderInsights } from '@/lib/contentInsights';
import { validateIntroText } from '@/lib/introValidation';
import { getEditorialPage, shouldUseOldModel } from '@/lib/editorialPages';
import Link from 'next/link';
import FlightIcon from '@mui/icons-material/Flight';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import LocalAirportIcon from '@mui/icons-material/LocalAirport';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PageViewTracker from '@/components/analytics/PageViewTracker';
import QASection from '@/components/faq/QASectionLazy';
import FAQServerSection from '@/components/faq/FAQServerSection';
import { findFAQsByPage } from '@/lib/faqs';

interface PageProps {
  params: {
    route: string;
  };
}

export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const routeSlug = params.route;
  
  // Check for editorial page meta data
  const slug = `flights/${routeSlug}`;
  const editorialPage = await getEditorialPage(slug);
  const metaTitle = editorialPage?.meta?.title || editorialPage?.metadata?.title;
  const metaDescription = editorialPage?.meta?.description || editorialPage?.metadata?.description;
  const focusKeywords = editorialPage?.meta?.focusKeywords;
  
  // Check if this is a single IATA code (3 letters, no hyphen) - handle as airport page
  if (/^[A-Z]{3}$/i.test(routeSlug) && !routeSlug.includes('-')) {
    const iata = routeSlug.toUpperCase();
    const airport = await getAirportSummary(iata);
    
    // Get city from routes (find a route where this airport is destination)
    const routesToAirport = await getRoutesToAirport(iata);
    const cityFromRoute = routesToAirport.length > 0 ? routesToAirport[0].destination_city : null;
    
    // Format airport name with city
    const airportDisplay = await formatAirportName(iata, airport, cityFromRoute);
    
    // Generate optimized title: "Direct Flights from [Airport Name] ([Code]) - [Count] Destinations 2026"
    // Keep under 55 characters (before " | Triposia" brand name is added by root layout)
    const generateOptimizedTitle = (): string => {
      if (metaTitle) return metaTitle;
      
      if (!airport) return `Direct Flights from ${iata} 2026`;
      
      const destinationsCount = airport.destinations_count || 0;
      
      // Prefer city name (usually shorter and more natural), fallback to airport name
      const preferredName = airport.city || airport.name || iata;
      const fallbackName = airport.name || airport.city || iata;
      
      // Try full format first: "Direct Flights from [Name] ([Code]) - [Count] Destinations 2026"
      const fullFormat = `Direct Flights from ${preferredName} (${iata}) - ${destinationsCount} Destinations 2026`;
      
      if (fullFormat.length <= 55) {
        return fullFormat;
      }
      
      // Try with fallback name if different
      if (fallbackName !== preferredName) {
        const fallbackFormat = `Direct Flights from ${fallbackName} (${iata}) - ${destinationsCount} Destinations 2026`;
        if (fallbackFormat.length <= 55) {
          return fallbackFormat;
        }
      }
      
      // Use compact format: "Direct Flights from [Name] ([Code]) - [Count] 2026"
      const compactFormat = `Direct Flights from ${preferredName} (${iata}) - ${destinationsCount} 2026`;
      
      if (compactFormat.length <= 55) {
        return compactFormat;
      }
      
      // Try compact with fallback name
      if (fallbackName !== preferredName) {
        const compactFallback = `Direct Flights from ${fallbackName} (${iata}) - ${destinationsCount} 2026`;
        if (compactFallback.length <= 55) {
          return compactFallback;
        }
      }
      
      // Last resort: truncate name to fit
      const compactFixed = `Direct Flights from  (${iata}) - ${destinationsCount} 2026`.length;
      const maxNameLength = Math.max(1, 55 - compactFixed);
      const truncatedName = preferredName.length > maxNameLength 
        ? preferredName.substring(0, maxNameLength - 3) + '...'
        : preferredName;
      
      return `Direct Flights from ${truncatedName} (${iata}) - ${destinationsCount} 2026`;
    };
    
    const title = generateOptimizedTitle();
    
    const description = metaDescription || (airport
      ? `Complete flight information for ${airportDisplay}: ${airport.destinations_count} destinations, ${airport.departure_count} daily departures, ${airport.arrival_count} daily arrivals. View all flights from and to ${airportDisplay}.`
      : `View all flights from and to ${iata} Airport.`);

    return genMeta({
      title,
      description,
      canonical: `/flights/${iata.toLowerCase()}`,
      keywords: focusKeywords ? focusKeywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
    });
  }
  
  const routeParts = parseRouteSlug(routeSlug);
  if (!routeParts) {
    return genMeta({
      title: 'Flight Route',
      description: 'Flight route information',
      noindex: true,
    });
  }

  const { origin, destination } = routeParts;
  const route = await getRoute(origin, destination);
  const flights = await getFlightsByRoute(origin, destination);
  const routeWithMetadata = await getRouteWithMetadata(origin, destination);
  const originAirport = await getAirportSummary(origin);
  const destinationAirport = await getAirportSummary(destination);

  // Get origin city from routes (find a route where origin is destination)
  const routesToOrigin = await getRoutesToAirport(origin);
  const originCityFromRoute = routesToOrigin.length > 0 ? routesToOrigin[0].destination_city : null;

  // Format airport names with city names (needed for metadata)
  // Use route.destination_city for destination, and originCityFromRoute for origin
  const originDisplay = await formatAirportName(origin, originAirport, originCityFromRoute);
  const destinationDisplay = await formatAirportName(destination, destinationAirport, route?.destination_city);
  
  const routeMetadata = routeWithMetadata ? extractRouteMetadata(routeWithMetadata) : {};
  const distance = routeMetadata.distance;
  const airlines = Array.from(new Set(flights.map(f => f.airline_name)));
  const averageDuration = route?.average_duration || route?.typical_duration || routeMetadata.averageDuration;
  
  const indexingCheck = shouldIndexRoute(flights, route);
  const qualityCheck = evaluateRoutePageQuality({
    flights,
    route,
    routeMetadata,
    pois: [],
    airlines: [],
    distance,
    averageDuration: averageDuration && averageDuration !== 'Data not available' ? averageDuration : undefined,
  });
  
  const finalShouldIndex = indexingCheck.shouldIndex && qualityCheck.indexable;
  
  const title = metaTitle || (route
    ? `Flights from ${originDisplay} to ${destinationDisplay} - ${route.flights_per_day}`
    : `Flights from ${originDisplay} to ${destinationDisplay}`);
  
  const description = metaDescription || (route
    ? `Flight information from ${originDisplay} to ${destinationDisplay}. ${route.flights_per_day} daily. View schedules, airlines, and prices.`
    : `View flight information, schedules, and airlines for the route from ${originDisplay} to ${destinationDisplay}.`);

  // Canonical should point to the canonical route page
  const canonicalRoute = `${origin.toLowerCase()}-${destination.toLowerCase()}`;

  return genMeta({
    title,
    description,
    canonical: `/flights/${canonicalRoute}`,
    noindex: !finalShouldIndex,
    keywords: focusKeywords ? focusKeywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
  });
}

export default async function FlightRoutePage({ params }: PageProps) {
  const routeSlug = params.route;
  
  // Check if this is a single IATA code (3 letters, no hyphen) - handle as airport page
  if (/^[A-Z]{3}$/i.test(routeSlug) && !routeSlug.includes('-')) {
    const iata = routeSlug.toUpperCase();
    const airport = await getAirportSummary(iata);
    const departures = (await getFlightsFromAirport(iata)) || [];
    const arrivals = (await getFlightsToAirport(iata)) || [];
    const routesFrom = (await getRoutesFromAirport(iata)) || [];
    const routesTo = (await getRoutesToAirport(iata)) || [];
    
    // Fetch travel decision data for origin airport
    const weather = await getWeatherByAirport(iata);
    const bookingInsights = await getBookingInsightsByAirport(iata);

    if (!airport) {
      return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Airport {iata} Not Found
          </Typography>
        </Container>
      );
    }

    // Get city from routes (routesTo are routes TO this airport, so destination_city is this airport's city)
    const cityFromRoute = routesTo.length > 0 ? routesTo[0].destination_city : null;
    const airportDisplay = await formatAirportName(iata, airport, cityFromRoute);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://triposia.com';
    const breadcrumbData = generateBreadcrumbList([
      { name: 'Home', url: siteUrl },
      { name: 'Flights', url: `${siteUrl}/flights` },
      { name: `Flights from ${airportDisplay}`, url: `${siteUrl}/flights/${iata.toLowerCase()}` },
    ]);

    // Create destinations list from routes (flights FROM this airport)
    const destinationsMap = new Map();
    const destinationIatas = Array.from(new Set(routesFrom.map(r => r.destination_iata).filter(Boolean)));
    
    // Fetch all destination airports in parallel to get city names and check for multiple airports
    const destinationAirports = await Promise.all(
      destinationIatas.map(dest => getAirportSummary(dest))
    );
    
    // Get origin airport country for domestic/international check
    const originCountry = airport.country;
    
    routesFrom.forEach(route => {
      if (!route.destination_iata) return; // Skip routes with missing destination
      const destAirport = destinationAirports.find(a => a?.iata_from?.toUpperCase() === route.destination_iata?.toUpperCase());
      const destCountry = destAirport?.country;
      // Determine if route is domestic or international based on country codes
      const isDomestic: boolean = originCountry && destCountry && originCountry === destCountry ? true : false;
      destinationsMap.set(route.destination_iata, {
        iata: route.destination_iata,
        city: route.destination_city || destAirport?.city,
        airport: destAirport, // Store full airport object for formatting
        flights_per_day: (route.flights_per_day && typeof route.flights_per_day === 'string') 
          ? route.flights_per_day 
          : '0 flights',
        is_domestic: isDomestic,
        country: destCountry,
      });
    });
    const destinations = Array.from(destinationsMap.values());

    // Create origins list from routes (flights TO this airport)
    const originsMap = new Map<string, { iata: string; city: string; flights_per_day: string; airport?: any; is_domestic?: boolean; country?: string }>();
    const uniqueOrigins = Array.from(new Set(routesTo.map(r => r.origin_iata).filter(Boolean)));
    
    // Fetch all origin airports in parallel
    const originAirports = await Promise.all(
      uniqueOrigins.map(origin => getAirportSummary(origin))
    );
    
    // Build origins map with city names
    routesTo.forEach(route => {
      if (!route.origin_iata) return; // Skip routes with missing origin
      if (!originsMap.has(route.origin_iata)) {
        const originAirport = originAirports.find(a => a?.iata_from?.toUpperCase() === route.origin_iata?.toUpperCase());
        const originCountry = originAirport?.country;
        // Determine if route is domestic or international based on country codes
        const isDomestic: boolean = originCountry && originCountry === airport.country ? true : false;
        originsMap.set(route.origin_iata, {
          iata: route.origin_iata,
          city: originAirport?.city || route.origin_iata,
          airport: originAirport, // Store full airport object for formatting
          flights_per_day: (route.flights_per_day && typeof route.flights_per_day === 'string')
            ? route.flights_per_day
            : '0 flights',
          is_domestic: isDomestic,
          country: originCountry,
        });
      }
    });
    const origins = Array.from(originsMap.values());

    // Get top destinations with coordinates for the map (airport page)
    const topDestinationRoutes = routesFrom
      .sort((a, b) => {
        const aFlights = departures.filter(f => f.destination_iata === a.destination_iata).length;
        const bFlights = departures.filter(f => f.destination_iata === b.destination_iata).length;
        return bFlights - aFlights;
      })
      .slice(0, 5);
    
    const topDestinationsData = await Promise.all(
      topDestinationRoutes.map(async (route) => {
        const destAirport = await getAirportSummary(route.destination_iata);
        if (destAirport?.lat && destAirport?.lng) {
          return {
            lat: destAirport.lat,
            lng: destAirport.lng,
            iata: route.destination_iata,
            name: destAirport.name,
            city: destAirport.city,
          };
        }
        return null;
      })
    );
    
    const topDestinations = topDestinationsData.filter((d): d is NonNullable<typeof d> => d !== null);

    // Calculate domestic and international counts
    const domesticDestinations = destinations.filter(d => d.is_domestic === true).length;
    const internationalDestinations = destinations.filter(d => d.is_domestic === false).length;
    const domesticOrigins = origins.filter(o => o.is_domestic === true).length;
    const internationalOrigins = origins.filter(o => o.is_domestic === false).length;

    const introText = `${airportDisplay} serves ${airport.destinations_count} destinations (${domesticDestinations} domestic, ${internationalDestinations} international) with ${airport.departure_count} daily departures and receives ${airport.arrival_count} daily arrivals from ${origins.length} origin${origins.length !== 1 ? 's' : ''} (${domesticOrigins} domestic, ${internationalOrigins} international).`;

    // Format destination displays for popular routes and tabs
    // Use route.destination_city for destinations
    const destinationsWithDisplayRaw = await Promise.all(
      destinations
        .filter(dest => dest && dest.iata) // Filter out null/undefined destinations
        .map(async (dest) => {
          if (!dest || !dest.iata) return null; // Skip null destinations
          
          const route = routesFrom.find(r => r && r.destination_iata === dest.iata);
        const destCity = route?.destination_city || dest.city;
        const destDisplay = await formatAirportName(dest.iata, dest.airport, destCity);
          
          // Ensure flights_per_day is always a string, never null
          const safeFlightsPerDay = (dest.flights_per_day && typeof dest.flights_per_day === 'string')
            ? dest.flights_per_day
            : '0 flights';
          
          return { 
            ...dest, 
            display: destDisplay,
            flights_per_day: safeFlightsPerDay
          };
        })
    );
    
    // Filter out any null results and ensure flights_per_day is a valid string
    const destinationsWithDisplay = destinationsWithDisplayRaw.filter(
      (dest): dest is NonNullable<typeof dest> => 
        dest !== null && 
        dest !== undefined && 
        dest.flights_per_day !== null &&
        dest.flights_per_day !== undefined &&
        typeof dest.flights_per_day === 'string'
    );
    
    // Format origin displays for tabs
    // For origins, we need to find routes where the origin airport is the destination
    const originsWithDisplay = await Promise.all(
      origins.map(async (orig) => {
        try {
        // Find a route where this origin airport is the destination to get its city
          const routesToOrigin = (await getRoutesToAirport(orig.iata)) || [];
        const origCity = routesToOrigin.length > 0 ? routesToOrigin[0].destination_city : orig.city;
        const origDisplay = await formatAirportName(orig.iata, orig.airport, origCity);
        return { ...orig, display: origDisplay };
        } catch (error) {
          // Fallback if getRoutesToAirport fails
          const origDisplay = await formatAirportName(orig.iata, orig.airport, orig.city);
          return { ...orig, display: origDisplay };
        }
      })
    );

    // Import components needed
    const AirportFlightsTabs = (await import('@/components/flights/AirportFlightsTabs')).default;

    // Get airlines for tool panel
    const airlineCodes = Array.from(new Set(departures.map(f => f.airline_iata).filter(Boolean)));
    const airlineDetails = await Promise.all(
      airlineCodes.slice(0, 30).map(code => getAirline(code))
    );
    const airlineList = airlineDetails
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .map(a => ({
        code: (a.iata || a.code || '').toLowerCase(),
        name: a.name,
        iata: a.iata,
      }));

    // Calculate flights_per_week, airline_count, distance, and other route data
    const { calculateDistance } = await import('@/lib/distance');
    
    // Helper function to safely extract daily flights from flights_per_day string
    // This function MUST never call .match() on null/undefined
    const parseFlightsPerDay = (flightsPerDay: any): number => {
      // Multiple layers of null/undefined checks
      if (flightsPerDay == null) return 0; // Checks both null and undefined
      if (typeof flightsPerDay !== 'string') return 0;
      
      try {
        // Convert to string one more time as final safeguard
        const str = String(flightsPerDay);
        if (!str || str.length === 0) return 0;
        
        // Only call .match() if we're absolutely sure str is a non-empty string
        const match = str.match(/(\d+(?:\.\d+)?)/);
        if (!match || !match[1]) return 0;
        
        const parsed = parseFloat(match[1]);
        return isNaN(parsed) ? 0 : parsed;
      } catch (error) {
        // If anything goes wrong, return 0
        console.error('Error parsing flights_per_day:', error, flightsPerDay);
        return 0;
      }
    };

    const routesWithWeekly = (await Promise.all(destinationsWithDisplay
      .filter(dest => dest && dest.iata && dest.flights_per_day) // Filter out null/undefined destinations and routes without flights_per_day
      .map(async (dest) => {
        // Early return if dest is null (defensive check)
        if (!dest || !dest.iata) {
          return null;
        }
        
        // Safely parse flights_per_day using helper function
        const daily = parseFlightsPerDay(dest.flights_per_day);
      const routeFlights = (departures || []).filter(f => f && f.destination_iata === dest.iata);
      const uniqueAirlines = new Set(routeFlights.map(f => f?.airline_iata).filter(Boolean));
      
      // Calculate popularity score (0-10) based on frequency and airline count
      const popularityScore = Math.min(10, (daily / 10) + (uniqueAirlines.size * 0.5));
      
      // Get route data for distance and duration
      const routeData = routesFrom.find(r => r.destination_iata === dest.iata);
      const destAirport = await getAirportSummary(dest.iata);
      
      // Calculate distance if coordinates available
      let distance_km: number | undefined;
      if (airport.lat && airport.lng && destAirport?.lat && destAirport?.lng) {
        distance_km = calculateDistance(airport.lat, airport.lng, destAirport.lat, destAirport.lng);
      }
      
      // Detect seasonal routes (simplified: if frequency is very low, might be seasonal)
      // In production, this would use historical data
      const isSeasonal = daily < 0.5 || routeData?.reliability === 'Seasonal';
      
      // Determine route growth (placeholder - would use historical data)
      // For now, use frequency as proxy: high frequency = growing, low = stable/declining
      let route_growth: 'growing' | 'stable' | 'declining' | undefined;
      if (daily >= 5) {
        route_growth = 'growing';
      } else if (daily >= 2) {
        route_growth = 'stable';
      } else if (daily > 0) {
        route_growth = 'declining';
      }
      
      // Ensure flights_per_day is always a string, never null (override any null from spread)
      const safeFlightsPerDay = (dest?.flights_per_day && typeof dest.flights_per_day === 'string')
        ? dest.flights_per_day
        : '0 flights';
      
      // Create a new object without spreading dest first, to avoid null values
      return {
        iata: dest.iata,
        city: dest.city,
        airport: dest.airport,
        display: dest.display,
        is_domestic: dest.is_domestic,
        country: dest.country,
        flights_per_day: safeFlightsPerDay, // Explicitly set to ensure it's never null
        flights_per_week: Math.round(daily * 7),
        airline_count: uniqueAirlines.size,
        popularity_score: popularityScore,
        seasonal: isSeasonal,
        distance_km,
        average_duration: routeData?.average_duration || routeData?.typical_duration,
        aircraft_types: routeData?.aircraft_types,
        reliability: routeData?.reliability,
        lat: destAirport?.lat,
        lng: destAirport?.lng,
        route_growth,
      };
    })))
    .filter((route): route is NonNullable<typeof route> => 
      route !== null && 
      route !== undefined && 
      route.iata && 
      route.flights_per_day &&
      typeof route.flights_per_day === 'string'
    ); // Filter out any null/undefined routes or routes without valid flights_per_day

    // Prepare data for new components
    // Calculate total weekly flights
    const totalWeeklyFlights = routesWithWeekly.reduce((sum, route) => {
      return sum + (route.flights_per_week || 0);
    }, 0);

    // Get top 3 busiest routes
    const top3Routes = [...routesWithWeekly]
      .filter(route => route && route.iata && route.display)
      .sort((a, b) => (b.flights_per_week || 0) - (a.flights_per_week || 0))
      .slice(0, 3)
      .map(route => ({
        iata: route.iata || '',
        display: route.display || route.iata || '',
        flights_per_day: route.flights_per_day || '0 flights',
        flights_per_week: route.flights_per_week || 0,
      }));

    // Group routes by airline and calculate airline stats
    const airlineGroupsMap = new Map<string, {
      code: string;
      name: string;
      destination_count: number;
      weekly_flights: number;
      routes: typeof routesWithWeekly;
      reliability?: 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited';
    }>();

    if (routesWithWeekly.length > 0 && departures && departures.length > 0) {
      routesWithWeekly.forEach(route => {
        if (!route || !route.iata) return;
        const routeFlights = departures.filter(f => f && f.destination_iata === route.iata);
        const airlines = Array.from(new Set(routeFlights.map(f => f?.airline_iata).filter(Boolean)));
        
        airlines.forEach(airlineCode => {
          if (!airlineCode) return;
          const airline = airlineList.find(a => {
            const aIata = a.iata?.toUpperCase();
            const aCode = a.code?.toUpperCase();
            return aIata === airlineCode.toUpperCase() || aCode === airlineCode.toUpperCase();
          });
          if (!airline) return;
          
          const key = (airline.code || airline.iata || '').toLowerCase();
          if (!key) return;
          
          if (!airlineGroupsMap.has(key)) {
            airlineGroupsMap.set(key, {
              code: airline.code || airline.iata || '',
              name: airline.name || airline.code || airline.iata || '',
              destination_count: 0,
              weekly_flights: 0,
              routes: [],
            });
          }
          
          const group = airlineGroupsMap.get(key);
          if (group && !group.routes.find(r => r.iata === route.iata)) {
            group.routes.push(route);
            group.destination_count++;
            group.weekly_flights += route.flights_per_week || 0;
          }
        });
      });
    }

    const airlineGroups = Array.from(airlineGroupsMap.values())
      .sort((a, b) => b.weekly_flights - a.weekly_flights);

    // Get top 3 airlines
    const top3Airlines = airlineGroups.slice(0, 3).map(airline => ({
      code: airline.code || '',
      name: airline.name || airline.code || '',
      route_count: airline.destination_count || 0,
      weekly_flights: airline.weekly_flights || 0,
    }));

    // Categorize routes by region
    const regionGroups = routesWithWeekly.length > 0 
      ? categorizeByRegion(routesWithWeekly, airport?.country)
      : [];

    // Calculate international route count
    const internationalCount = routesWithWeekly.filter(r => {
      // Route is international if it's not domestic and country differs from origin
      return r.is_domestic === false || (r.country && r.country !== airport?.country);
    }).length;

    // Calculate connectivity scores
    const totalDestinations = airport?.destinations_count || 0;
    const calculateConnectivityScores = () => {
      // Route diversity: based on number of unique destinations relative to typical airport
      // Normalize to 0-100 scale (assuming 50+ destinations = 100%)
      const routeDiversity = totalDestinations > 0 ? Math.min(100, (totalDestinations / 50) * 100) : 0;
      
      // Airline diversity: based on number of airlines relative to typical airport
      // Normalize to 0-100 scale (assuming 10+ airlines = 100%)
      const airlineDiversity = airlineList.length > 0 ? Math.min(100, (airlineList.length / 10) * 100) : 0;
      
      // Growth trend: analyze route growth patterns
      const growingRoutes = routesWithWeekly.filter(r => r.route_growth === 'growing').length;
      const totalActiveRoutes = routesWithWeekly.filter(r => (r.flights_per_week || 0) > 0).length;
      const growthTrend: 'growing' | 'stable' | 'declining' = 
        totalActiveRoutes > 0 && (growingRoutes / totalActiveRoutes) > 0.3 ? 'growing' :
        totalActiveRoutes > 0 && (growingRoutes / totalActiveRoutes) > 0.1 ? 'stable' : 'declining';
      
      // Reliability score: based on route reliability distribution
      const reliableRoutes = routesWithWeekly.filter(r => 
        r.reliability === 'Very Stable' || r.reliability === 'Moderate'
      ).length;
      const reliabilityScore = totalDestinations > 0 
        ? Math.min(100, (reliableRoutes / totalDestinations) * 100)
        : 50;
      
      // Overall score: weighted average
      const overallScore = Math.round(
        (routeDiversity * 0.3) +
        (airlineDiversity * 0.25) +
        (reliabilityScore * 0.25) +
        (growthTrend === 'growing' ? 80 : growthTrend === 'stable' ? 50 : 30) * 0.2
      );
      
      return {
        overallScore,
        routeDiversity: Math.round(routeDiversity),
        airlineDiversity: Math.round(airlineDiversity),
        growthTrend,
        reliabilityScore: Math.round(reliabilityScore),
      };
    };

    const connectivityScores = calculateConnectivityScores();

    // Check if page exists in pages_editorial collection
    const editorialSlug = `flights/${iata.toLowerCase()}`;
    const editorialPage = await getEditorialPage(editorialSlug);

    // Get manualContent and FAQs from content object (new structure) or legacy fields
    const manualContent = editorialPage?.content?.manualContent || editorialPage?.manualContent;
    const editorialFAQs = editorialPage?.content?.faqs || editorialPage?.faqs;

    // Check if editorial page has content (headings, paragraphs, FAQs, or manualContent)
    const hasEditorialContent = editorialPage && (
      (editorialPage.content?.headings && (
        (editorialPage.content.headings.h1 && editorialPage.content.headings.h1.length > 0) ||
        (editorialPage.content.headings.h2 && editorialPage.content.headings.h2.length > 0) ||
        (editorialPage.content.headings.h3 && editorialPage.content.headings.h3.length > 0)
      )) ||
      (editorialPage.headings && editorialPage.headings.length > 0) ||
      (editorialPage.content?.paragraphs && editorialPage.content.paragraphs.length > 0) ||
      (editorialPage.paragraphs && editorialPage.paragraphs.length > 0) ||
      (editorialFAQs && editorialFAQs.length > 0) ||
      !!manualContent
    );

    // Generate FAQs for airport page
    const generatedAirportFAQs = await generateAirportFAQs(
      airport,
      departures,
      arrivals,
      destinations.length
    );

    // Use editorial FAQs if available, otherwise use generated FAQs
    const airportFAQs = hasEditorialContent && editorialFAQs && editorialFAQs.length > 0 
      ? editorialFAQs 
      : generatedAirportFAQs;

    // Generate FAQ schema
    const faqSchema = generateFAQPageSchema(
      airportFAQs,
      `Frequently Asked Questions about flights from ${airportDisplay}`
    );

    // Generate flight schemas for airport page
    const departuresListingSchema = generateAirportDeparturesListingSchema(
      departures,
      iata,
      airportDisplay
    );
    const departuresScheduleSchema = generateAirportDeparturesScheduleSchema(
      departures,
      iata,
      airportDisplay
    );
    const arrivalsListingSchema = generateAirportArrivalsListingSchema(
      arrivals,
      iata,
      airportDisplay
    );
    const arrivalsScheduleSchema = generateAirportArrivalsScheduleSchema(
      arrivals,
      iata,
      airportDisplay
    );
    // Generate combined flights list schema (all flights)
    const allFlightsListSchema = generateAirportFlightsListSchema(
      departures,
      arrivals,
      iata,
      airportDisplay
    );
    // Generate airline schedule schemas (grouped by airline)
    const airlineDeparturesScheduleSchema = generateAirlineScheduleSchema(
      departures,
      iata,
      airportDisplay,
      true // isDeparture
    );
    const airlineArrivalsScheduleSchema = generateAirlineScheduleSchema(
      arrivals,
      iata,
      airportDisplay,
      false // isDeparture
    );

    // Generate route ItemList schema
    const routeListSchema = generateRouteListSchema(
      routesFrom,
      iata,
      airportDisplay
    );

    // Get enhanced internal linking data
    const relatedAirports = await getEnhancedRelatedAirports(iata, airport, 20);
    const airlinePages = await getAirlinePagesForAirport(iata, 10);
    const topRoutes = await getTopRoutePages(iata, 10);
    const countryHub = await getCountryHubLink(airport);

    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Flights', href: '/flights' },
            { label: `Flights from ${airportDisplay}`, href: `/flights/${iata.toLowerCase()}` },
          ]}
        />
        
        <JsonLd data={breadcrumbData} />
        {/* Airport Schema */}
        {airport && <JsonLd data={generateAirportSchema(iata, airport.name || airportDisplay, airport.city, airport.country)} />}
        {allFlightsListSchema && <JsonLd data={allFlightsListSchema} />}
        {departuresListingSchema && <JsonLd data={departuresListingSchema} />}
        {departuresScheduleSchema && <JsonLd data={departuresScheduleSchema} />}
        {arrivalsListingSchema && <JsonLd data={arrivalsListingSchema} />}
        {arrivalsScheduleSchema && <JsonLd data={arrivalsScheduleSchema} />}
        {airlineDeparturesScheduleSchema && <JsonLd data={airlineDeparturesScheduleSchema} />}
        {airlineArrivalsScheduleSchema && <JsonLd data={airlineArrivalsScheduleSchema} />}
        {routeListSchema && <JsonLd data={routeListSchema} />}
        {faqSchema && <JsonLd data={faqSchema} />}

        {/* 1. HERO SECTION - Above the fold */}
        <AirportHeroSection
          airportName={airport?.name || airport?.city || airportDisplay}
          airportCode={iata}
          totalDestinations={airport?.destinations_count || 0}
          totalAirlines={airlineList?.length || 0}
          totalWeeklyFlights={totalWeeklyFlights || 0}
          internationalCount={internationalCount}
        />

        {/* 2. AIRPORT CONNECTIVITY SCORE */}
        <Box id="connectivity-score-section" sx={{ mb: 4, scrollMarginTop: '100px' }}>
          <ConnectivityScore
            overallScore={connectivityScores.overallScore}
            routeDiversity={connectivityScores.routeDiversity}
            airlineDiversity={connectivityScores.airlineDiversity}
            growthTrend={connectivityScores.growthTrend}
            reliabilityScore={connectivityScores.reliabilityScore}
          />
        </Box>

        {/* 3. AI-READY SUMMARY BLOCK */}
        <AISummaryBlock
          airportName={airport?.name || airport?.city || airportDisplay}
          airportCode={iata}
          totalDestinations={airport?.destinations_count || 0}
          totalAirlines={airlineList?.length || 0}
          topRoutes={top3Routes.map(r => ({ display: r.display, iata: r.iata }))}
        />

        {/* 2. Visual Analytics Block - Charts and Data Visualization */}
        {routesWithWeekly.length > 0 && (
          <Box id="analytics-section" sx={{ mb: 4, scrollMarginTop: '100px' }}>
            <VisualAnalyticsBlock
              routes={routesWithWeekly}
              airlines={airlineGroups.map(g => ({
                code: g.code,
                name: g.name,
                route_count: g.destination_count,
                weekly_flights: g.weekly_flights,
              }))}
              originDisplay={airportDisplay}
            />
          </Box>
        )}

        {/* 7. TOP ROUTES DASHBOARD - Visual Analytics */}
        {routesWithWeekly.length > 0 && (
          <Box id="analytics-section" sx={{ mb: 4, scrollMarginTop: '100px' }}>
            <VisualAnalyticsBlock
              routes={routesWithWeekly}
              airlines={airlineGroups.map(g => ({
                code: g.code,
                name: g.name,
                route_count: g.destination_count,
                weekly_flights: g.weekly_flights,
              }))}
              originDisplay={airportDisplay}
            />
          </Box>
        )}

        {/* FILTERABLE ROUTES SECTION - Routes by Airline, Region, and Sortable Table with Filters */}
        {routesWithWeekly.length > 0 && (async () => {
          // Create airline-route mapping for filtering
          const routeAirlinesMap = new Map<string, string[]>();
          routesWithWeekly.forEach(route => {
            const routeFlights = departures.filter(f => f.destination_iata === route.iata);
            const airlines = Array.from(new Set(routeFlights.map(f => f.airline_iata).filter(Boolean)));
            routeAirlinesMap.set(route.iata, airlines);
          });
          
          // Lazy load FilterableRoutesSection (client component)
          const FilterableRoutesSectionLazy = (await import('@/components/flights/FilterableRoutesSectionLazy')).default;
          
          return (
            <FilterableRoutesSectionLazy
              routes={routesWithWeekly}
              airlineGroups={airlineGroups}
              regionGroups={regionGroups}
              airlines={airlineList}
              originIata={iata}
              originCountry={airport?.country}
              routeAirlinesMap={routeAirlinesMap}
            />
          );
        })()}

        {/* 6. GROUP ROUTES BY AIRLINE */}

        {/* 6. Flight Schedule - Calendar View */}
        {departures.length > 0 && (
          <Box id="schedule-section" sx={{ mb: 4, scrollMarginTop: '100px' }}>
            <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: { xs: 1.5, sm: 2 }, textAlign: 'left' }}>
              Flight Schedule - Departures
            </Typography>
            <FlightCalendarWrapper flights={departures} />
          </Box>
        )}

        {/* Tabs Component - Shows destinations, departures, and arrivals */}
        <AirportFlightsTabs
          iata={iata}
          city={airport.city}
          airportName={airportDisplay}
          departures={departures}
          arrivals={arrivals}
          destinations={destinationsWithDisplay}
          origins={originsWithDisplay}
        />

        {/* Enhanced Map with Route Lines */}
        {airport.lat && airport.lng && routesWithWeekly.length > 0 && (
          <EnhancedAirportMap
            airport={{
              lat: airport.lat,
              lng: airport.lng,
              iata,
              name: airport.name,
              city: airport.city,
            }}
            routes={routesWithWeekly.filter(r => r.lat && r.lng)}
            maxRoutes={20}
          />
        )}

        {/* Weather Section */}
        {weather && (
          <WeatherSection weather={weather} airportName={airportDisplay} />
        )}

        {/* Booking Insights */}
        {bookingInsights && (
          <BookingInsightsSection insights={bookingInsights} airportName={airportDisplay} />
        )}

        {/* Enhanced Internal Linking Section */}
        <Box id="related-links-section" sx={{ scrollMarginTop: '100px' }}>
        <RelatedLinksSection
          relatedAirports={relatedAirports.map(a => ({
            iata: a.iata,
            city: a.city,
            display: a.city ? `${a.city} (${a.iata})` : a.iata,
            name: a.name,
            shouldIndex: a.shouldIndex,
          }))}
          airlinePages={airlinePages}
          topRoutes={topRoutes.map(r => ({
            origin_iata: iata,
            destination_iata: r.destination_iata,
            destination_city: r.destination_city,
            routePage: r.routePage,
            flights_per_day: r.flights_per_day,
          }))}
          countryHub={countryHub}
        />
        </Box>

        {/* Manual Content from pages_editorial - Display above FAQs */}
        {manualContent && (
          <Box sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Box
                dangerouslySetInnerHTML={{ __html: manualContent }}
                sx={{
                  '& h1': {
                    // Hide H1 in manualContent since we already have one in the page
                    display: 'none',
                  },
                  '& h2, & h3, & h4, & h5, & h6': {
                    mt: 2,
                    mb: 1,
                    '&:first-of-type': { mt: 0 },
                  },
                  '& p': {
                    mb: 2,
                    lineHeight: 1.8,
                  },
                  '& ul, & ol': {
                    mb: 2,
                    pl: 3,
                  },
                  '& li': {
                    mb: 1,
                  },
                  '& a': {
                    color: 'primary.main',
                    textDecoration: 'underline',
                  },
                  '& table': {
                    width: '100%',
                    borderCollapse: 'collapse',
                    mb: 2,
                  },
                  '& td, & th': {
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 1,
                    textAlign: 'left',
                  },
                  '& th': {
                    backgroundColor: 'action.hover',
                    fontWeight: 'bold',
                  },
                }}
              />
            </Paper>
          </Box>
        )}

        {/* FAQ Section */}
        {airportFAQs.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: { xs: 1.5, sm: 2 }, textAlign: 'left' }}>
              Frequently Asked Questions
            </Typography>
            <Paper sx={{ p: 3 }}>
              {airportFAQs.map((faq, index) => (
                <Box key={index} sx={{ mb: index === airportFAQs.length - 1 ? 0 : 3 }}>
                  <Typography variant="h3" sx={{ fontSize: '1.25rem', mb: 1, textAlign: 'left' }}>
                    {faq.question}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </Box>
              ))}
            </Paper>
          </Box>
        )}
      </Container>
    );
  }
  
  // Route slugs must have a hyphen (origin-destination format)
  if (!routeSlug.includes('-')) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Invalid Route Format
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Route format should be origin-destination (e.g., del-bom). 
          For airport flights, use: <Link href={`/flights/${routeSlug.toLowerCase()}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
            /flights/{routeSlug.toLowerCase()}
          </Link>
        </Typography>
      </Container>
    );
  }
  
  const routeParts = parseRouteSlug(routeSlug);
  if (!routeParts) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Invalid Route Format
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Route format should be origin-destination (e.g., del-bom).
        </Typography>
      </Container>
    );
  }

  const { origin, destination } = routeParts;
  const route = await getRoute(origin, destination);
  const deepRoute = await getDeepRoute(origin, destination);
  const routeWithMetadata = await getRouteWithMetadata(origin, destination);
  const destinationData = await getDestinationData(origin, destination);
  const flights = await getFlightsByRoute(origin, destination);
  const originAirport = await getAirportSummary(origin);
  const destinationAirport = await getAirportSummary(destination);
  const pois = await getPoisByAirport(destination, 6);
  const apois = await getApoisByAirport(destination, 6);
  
  // Fetch travel decision data for destination airport
  const destinationWeather = await getWeatherByAirport(destination);
  const destinationBookingInsights = await getBookingInsightsByAirport(destination);
  const destinationPriceTrends = await getPriceTrendsByAirport(destination);
  
  // Get origin city from routes (find a route where origin is destination)
  const routesToOrigin = await getRoutesToAirport(origin);
  const originCityFromRoute = routesToOrigin.length > 0 ? routesToOrigin[0].destination_city : null;
  
  // Format airport names with city names (needed for breadcrumbs and display)
  // Use route.destination_city for destination, and originCityFromRoute for origin
  const originDisplay = await formatAirportName(origin, originAirport, originCityFromRoute);
  const destinationDisplay = await formatAirportName(destination, destinationAirport, route?.destination_city);
  
  const routeMetadata = routeWithMetadata ? extractRouteMetadata(routeWithMetadata) : {};
  const distance = routeMetadata.distance;
  const airlines = Array.from(new Set(flights.map(f => f.airline_name)));
  const averageDuration = route?.average_duration || route?.typical_duration || routeMetadata.averageDuration;
  const operatingAirlines = await getAirlinesForRoute(origin, destination, flights);
  
  // Get related routes from origin and destination airports
  const routesFromOrigin = await getRelatedRoutes(origin, 4);
  const routesFromDest = await getRelatedRoutes(destination, 4);
  const relatedRoutes = [
    ...routesFromOrigin.filter(r => r.destination_iata !== destination),
    ...routesFromDest.filter(r => r.origin_iata !== origin && r.destination_iata !== origin)
  ].slice(0, 6);
  
  // Get related airports (origin and destination)
  const relatedAirports = [
    { iata: origin, city: originAirport?.city, name: originAirport?.name, shouldIndex: true },
    { iata: destination, city: destinationAirport?.city, name: destinationAirport?.name, shouldIndex: true }
  ];
  
  const indexingCheck = shouldIndexRoute(flights, route);
  const qualityCheck = evaluateRoutePageQuality({
    flights,
    route,
    routeMetadata,
    pois: [],
    airlines: [],
    distance,
    averageDuration: averageDuration !== 'Data not available' ? averageDuration : undefined,
  });
  
  if (!indexingCheck.shouldIndex || !qualityCheck.indexable) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Route Information Unavailable
        </Typography>
      </Container>
    );
  }

  if (!route) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Route Not Found
        </Typography>
      </Container>
    );
  }

  const siteUrl = getSiteUrl();
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Home', url: siteUrl },
    { name: 'Flights', url: `${siteUrl}/flights` },
    { name: `${originDisplay} to ${destinationDisplay}`, url: `${siteUrl}/flights/${params.route}` },
  ]);

  // Extract route information for cards
  const flightTimeRange = getFlightTimeRange(flights);
  const earliestFlight = getEarliestFlight(flights) || routeMetadata.earliestFlight;
  const lastFlight = getLastFlight(flights) || routeMetadata.lastFlight;
  const formattedDistance = formatDistance(distance);
  const cheapestMonth = routeMetadata.cheapestMonth || route?.cheapest_months;
  const flightsPerWeek = routeMetadata.flightsPerWeek || calculateFlightsPerWeek(route?.flights_per_day);
  const busiestHours = getBusiestHours(flights);
  const airlineCodes = Array.from(new Set(flights.map(f => f.airline_iata).filter(Boolean)));
  const terminals = getTerminalsForRoute(
    originAirport?.terminals,
    destinationAirport?.terminals,
    airlineCodes
  );

  // Extract price data
  const priceMonthData = deepRoute?.flight_data?.price_month_data;
  const monthlyPrices = priceMonthData 
    ? Object.entries(priceMonthData).map(([month, price]: [string, any]) => {
        // Replace any year (2020-2024) with 2025 in month names
        let updatedMonth = month.replace(/202[0-4]/g, '2025');
        // Also handle any other year format that might exist
        updatedMonth = updatedMonth.replace(/\b2023\b/g, '2025');
        updatedMonth = updatedMonth.replace(/\b2024\b/g, '2025');
        return {
          month: updatedMonth,
          monthShort: updatedMonth.substring(0, 3),
          price: typeof price === 'number' ? price : parseInt(String(price).replace(/[^0-9]/g, ''), 10) || 0,
        };
      })
    : [];
  const averagePrice = monthlyPrices.length > 0
    ? Math.round(monthlyPrices.reduce((sum, p) => sum + p.price, 0) / monthlyPrices.length)
    : undefined;

  // Check if page exists in pages_editorial collection
  const slug = `flights/${params.route}`;
  const editorialPage = await getEditorialPage(slug);
  const useOldModel = await shouldUseOldModel(slug);

  // Get manualContent and FAQs from content object (new structure) or legacy fields
  const manualContent = editorialPage?.content?.manualContent || editorialPage?.manualContent;
  const editorialFAQs = editorialPage?.content?.faqs || editorialPage?.faqs;

  // Check if editorial page has content (headings, paragraphs, FAQs, or manualContent)
  const hasEditorialContent = editorialPage && (
    (editorialPage.content?.headings && (
      (editorialPage.content.headings.h1 && editorialPage.content.headings.h1.length > 0) ||
      (editorialPage.content.headings.h2 && editorialPage.content.headings.h2.length > 0) ||
      (editorialPage.content.headings.h3 && editorialPage.content.headings.h3.length > 0)
    )) ||
    (editorialPage.headings && editorialPage.headings.length > 0) ||
    (editorialPage.content?.paragraphs && editorialPage.content.paragraphs.length > 0) ||
    (editorialPage.paragraphs && editorialPage.paragraphs.length > 0) ||
    (editorialFAQs && editorialFAQs.length > 0) ||
    !!manualContent
  );

  // Generate FAQs for route page (use editorial FAQs if available, otherwise generate)
  const generatedRouteFAQs = await generateRouteFAQs(
    flights,
    route,
    origin,
    destination,
    originAirport,
    destinationAirport,
    operatingAirlines,
    formattedDistance,
    averageDuration !== 'Data not available' ? averageDuration : undefined,
    cheapestMonth,
    flightsPerWeek,
    averagePrice,
    destinationData
  );
  // Use editorial FAQs if available, otherwise use generated FAQs
  const routeFAQs = hasEditorialContent && editorialFAQs && editorialFAQs.length > 0 
    ? editorialFAQs 
    : generatedRouteFAQs;

  // Fetch user-submitted FAQs for SEO
  const userFAQs = await findFAQsByPage('flight-route', params.route, {
    limit: 20,
    sortBy: 'most-helpful',
    includeUnanswered: false, // Only answered questions for SEO
  });

  // Generate FAQ schema from user-submitted FAQs (only answered ones)
  const userFAQSchema = userFAQs.length > 0
    ? generateFAQPageSchema(
        userFAQs
          .filter((faq) => faq.isAnswered && faq.answers && faq.answers.length > 0)
          .map((faq) => {
            // Get the best answer for schema
            const bestAnswer =
              faq.answers.find((a) => a.isExpertAnswer || a.author) ||
              faq.answers
                .sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0))[0] ||
              faq.answers[0];

            if (!bestAnswer) return null;

            // Get answer content (support both old and new format)
            const answerContent = bestAnswer.answer || bestAnswer.content || '';
            const answerText = stripHtml(answerContent);

            if (!answerText) return null;

            return {
              question: faq.question,
              answer: answerText,
            };
          })
          .filter((faq): faq is { question: string; answer: string } => faq !== null && !!faq.answer), // Only include FAQs with answers
        `Frequently Asked Questions about flights from ${originDisplay} to ${destinationDisplay}`
      )
    : null;

  // Generate FAQ schema for route page (from FAQs being used)
  const routeFAQSchema = generateFAQPageSchema(
    routeFAQs,
    `Frequently Asked Questions about flights from ${originDisplay} to ${destinationDisplay}`
  );

  // Generate flight schema with proper airport names
  const flightSchema = {
    '@context': 'https://schema.org',
    '@type': 'Flight',
    departureAirport: {
      '@type': 'Airport',
      iataCode: origin,
      name: originDisplay,
    },
    arrivalAirport: {
      '@type': 'Airport',
      iataCode: destination,
      name: destinationDisplay,
    },
    ...(route.flights_per_day && { description: `Daily flights: ${route.flights_per_day}` }),
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 2 } }}>
      <PageViewTracker
        pageType="flight_route"
        entityPrimary={routeSlug}
        entitySecondary={destination}
        additionalParams={{
          origin: origin,
          destination: destination,
          ...(route?.is_domestic !== undefined && { is_international: !route.is_domestic }),
        }}
      />
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Flights', href: '/flights' },
          { label: `${originDisplay} to ${destinationDisplay}`, href: `/flights/${params.route}` },
        ]}
      />
      
      <JsonLd data={breadcrumbData} />
      <JsonLd data={flightSchema} />
      {flights.length > 0 && (
        <>
          <JsonLd data={generateFlightListingSchema(flights, origin, destination, originDisplay, destinationDisplay)} />
          <JsonLd data={generateFlightScheduleSchema(flights, origin, destination, originDisplay, destinationDisplay)} />
        </>
      )}
      {routeFAQSchema && <JsonLd data={routeFAQSchema} />}
      {userFAQSchema && <JsonLd data={userFAQSchema} />}

      {/* 1. Conditional rendering: Old RouteHeader if in pages_editorial, else new RouteTruthBlock */}
      {useOldModel ? (
        <RouteHeader
          origin={origin}
          destination={destination}
          originCity={originAirport?.city}
          originCountry={originAirport?.country}
          destinationCity={route.destination_city || destinationAirport?.city}
          destinationCountry={destinationAirport?.country}
          originDisplay={originDisplay}
          destinationDisplay={destinationDisplay}
          distance={formattedDistance}
          duration={averageDuration !== 'Data not available' ? averageDuration : undefined}
          airlinesCount={operatingAirlines.length}
          flightsPerDay={route.flights_per_day || flights.length.toString()}
        />
      ) : (
        <RouteTruthBlock
          fromCity={originAirport?.city || origin}
          fromIata={origin}
          toCity={route.destination_city || destinationAirport?.city || destination}
          toIata={destination}
          airlineCount={operatingAirlines.length}
          flightsPerDay={route.flights_per_day || flights.length}
          averageDuration={averageDuration !== 'Data not available' ? averageDuration : undefined}
          distance={formattedDistance}
        />
      )}

      {/* 2. Distance & Duration (numeric) */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          {formattedDistance && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Route Distance
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formattedDistance}
                </Typography>
              </Paper>
            </Grid>
          )}
          {averageDuration && averageDuration !== 'Data not available' && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Average Duration
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {averageDuration}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* 3. Airlines Operating This Route */}
      {operatingAirlines.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', mb: 2, textAlign: 'left' }}>
            Airlines Operating This Route
          </Typography>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1">
              {operatingAirlines.map((airline, idx) => (
                <span key={airline.code}>
                  {airline.name}
                  {idx < operatingAirlines.length - 1 ? ', ' : ''}
                </span>
              ))}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* 4. Flight Frequency (daily / weekly) */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', mb: 2, textAlign: 'left' }}>
          Flight Frequency
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Daily Flights
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {route.flights_per_day || flights.length}
              </Typography>
            </Grid>
            {flightsPerWeek && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Weekly Flights
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {flightsPerWeek}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>

      {/* 5. Typical Departure Time Ranges */}
      {(earliestFlight || lastFlight) && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', mb: 2, textAlign: 'left' }}>
            Typical Departure Time Ranges
          </Typography>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {earliestFlight && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Earliest Departure
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {earliestFlight}
                  </Typography>
                </Grid>
              )}
              {lastFlight && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Latest Departure
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {lastFlight}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Box>
      )}

      {/* 7. ALL other content below the fold */}
      
      {/* Visual Analytics Block - Route Data Visualization */}
      {flights.length > 0 && (
        <Box id="analytics-section" sx={{ mb: 4, scrollMarginTop: '100px' }}>
          <RouteDataVisualizationLazy
            routes={[{
              iata: destination,
              display: destinationDisplay,
              flights_per_day: route.flights_per_day || flights.length.toString(),
              flights_per_week: typeof flightsPerWeek === 'number' ? flightsPerWeek : 0,
            }]}
            airlines={operatingAirlines.map(a => ({
              code: a.code,
              name: a.name,
              routeCount: 1,
            }))}
            originDisplay={originDisplay}
          />
        </Box>
      )}

      {/* Filterable Flights Section with Filters */}
      {flights.length > 0 && (
        <Box id="filterable-flights-section" sx={{ mb: 4, scrollMarginTop: '100px' }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
            Flight Schedule & Filters
          </Typography>
          <FilterableFlightsSectionLazy
            flights={flights}
            airlines={operatingAirlines}
            origin={origin}
            destination={destination}
            originDisplay={originDisplay}
            destinationDisplay={destinationDisplay}
            showVisualizations={false} // Already shown above
          />
        </Box>
      )}

      {/* Flight Schedule - Calendar View */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', mb: 2, textAlign: 'left' }}>
          Flight Schedule Calendar
        </Typography>
        {flights.length > 0 ? (
          <FlightCalendarWrapper 
            flights={flights} 
            origin={origin}
            destination={destination}
            originDisplay={originDisplay}
            destinationDisplay={destinationDisplay}
          />
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Flight schedule data is being updated. Please check back soon.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Route Header (moved below) */}
      <RouteHeader
        origin={origin}
        destination={destination}
        originCity={originAirport?.city}
        originCountry={originAirport?.country}
        destinationCity={route.destination_city || destinationAirport?.city}
        destinationCountry={destinationAirport?.country}
        originDisplay={originDisplay}
        destinationDisplay={destinationDisplay}
        distance={distance}
        duration={averageDuration !== 'Data not available' ? averageDuration : undefined}
        airlinesCount={airlines.length}
        flightsPerDay={route.flights_per_day}
      />

      {/* 2. Route Info Cards */}
      <Box sx={{ mb: 4 }}>
        <RouteInfoCards
          flightTimeRange={flightTimeRange}
          earliestFlight={earliestFlight}
          lastFlight={lastFlight}
          distance={formattedDistance}
          cheapestMonth={cheapestMonth}
          airlinesCount={airlines.length}
          flightsPerWeek={flightsPerWeek}
          departingTerminal={terminals.departing ? `${terminals.departing} (${originDisplay})` : undefined}
          arrivingTerminal={terminals.arriving ? `${terminals.arriving} (${destinationDisplay})` : undefined}
        />
      </Box>

      {/* 3. Flight Calendar & Schedule */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', mb: 2, textAlign: 'left' }}>
          Flight Schedule
        </Typography>
        {flights.length > 0 ? (
          <FlightCalendarWrapper 
            flights={flights} 
            origin={origin}
            destination={destination}
            originDisplay={originDisplay}
            destinationDisplay={destinationDisplay}
          />
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Flight schedule data is being updated. Please check back soon.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* 5. Airlines Section */}
      {operatingAirlines.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', mb: 2, textAlign: 'left' }}>
            Airlines with direct flights from {originDisplay} to {destinationDisplay}
          </Typography>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1">
              {operatingAirlines.map((airline, idx) => (
                <span key={airline.code}>
                  <Link 
                    href={`/airlines/${airline.code.toLowerCase()}`} 
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    {formatAirlineAnchor(airline)}
                  </Link>
                  {idx < operatingAirlines.length - 1 ? ', ' : ''}
                </span>
              ))}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Weather Section (moved below FAQs) */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: { xs: 1.5, sm: 2 }, textAlign: 'left' }}>
          Weather at {destinationDisplay}
        </Typography>
        {destinationWeather ? (
          <WeatherSection weather={destinationWeather} airportName={destinationDisplay} />
        ) : destinationData && (destinationData.rainfall || destinationData.temperature) ? (
          <WeatherCharts
            rainfall={destinationData.rainfall}
            temperature={destinationData.temperature}
            destinationName={destinationDisplay}
          />
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Weather data for {destinationDisplay} is being updated. Please check back soon.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Booking Insights (moved below FAQs) */}
      {destinationBookingInsights && (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: { xs: 1.5, sm: 2 }, textAlign: 'left' }}>
          Booking Insights
        </Typography>
          <BookingInsightsSection insights={destinationBookingInsights} airportName={destinationDisplay} />
      </Box>
      )}

      {/* Price Trends (moved below FAQs) */}
      {destinationPriceTrends && (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: { xs: 1.5, sm: 2 }, textAlign: 'left' }}>
          Price Trends
        </Typography>
          <PriceTrendsSection trends={destinationPriceTrends} airportName={destinationDisplay} />
      </Box>
      )}

      {/* POI Section (moved below FAQs) */}
      {apois.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 3, textAlign: 'left' }}>
            Things to Do Near {destination} Airport
          </Typography>
          <Grid container spacing={3}>
            {apois.map((poi: any) => (
              <Grid item xs={12} sm={6} md={4} key={poi._id?.toString() || poi.name}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    {poi.name}
                  </Typography>
                  {poi.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {poi.description}
                    </Typography>
                  )}
                  {poi.distance_km && (
                    <Typography variant="caption" color="primary">
                      {poi.distance_km.toFixed(1)} km from airport
                    </Typography>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Legacy POIs (fallback if apois is empty) */}
      {apois.length === 0 && pois.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', mb: 2, textAlign: 'left' }}>
            Places Near {destination} Airport
          </Typography>
          <PoiSection pois={pois} title="" />
        </Box>
      )}

      {/* 8. Map (Supporting element, below main content and POIs) */}
      {originAirport?.lat && originAirport?.lng && destinationAirport?.lat && destinationAirport?.lng && (
        <RouteMap
          origin={{
            lat: originAirport.lat,
            lng: originAirport.lng,
            iata: origin,
            name: originAirport.name,
            city: originAirport.city,
          }}
          destination={{
            lat: destinationAirport.lat,
            lng: destinationAirport.lng,
            iata: destination,
            name: destinationAirport.name,
            city: destinationAirport.city || route?.destination_city,
          }}
        />
      )}

      {/* Server-side FAQ Section for SEO */}
      <FAQServerSection
        pageType="flight-route"
        pageSlug={params.route}
      />

      {/* Interactive Q&A Section */}
      <Box sx={{ my: 6 }}>
        <QASection
          pageType="flight-route"
          pageSlug={params.route}
          pageUrl={`/flights/${params.route}`}
        />
      </Box>

      {/* Manual Content from pages_editorial - Display above FAQs */}
      {manualContent && (
        <Box sx={{ mt: 6, mb: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Box
              dangerouslySetInnerHTML={{ __html: manualContent }}
              sx={{
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                  mt: 2,
                  mb: 1,
                  '&:first-of-type': { mt: 0 },
                },
                '& p': {
                  mb: 2,
                  lineHeight: 1.8,
                },
                '& ul, & ol': {
                  mb: 2,
                  pl: 3,
                },
                '& li': {
                  mb: 1,
                },
                '& a': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
                '& table': {
                  width: '100%',
                  borderCollapse: 'collapse',
                  mb: 2,
                },
                '& td, & th': {
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 1,
                  textAlign: 'left',
                },
                '& th': {
                  backgroundColor: 'action.hover',
                  fontWeight: 'bold',
                },
              }}
            />
          </Paper>
        </Box>
      )}

      {/* Route FAQs (max 5–7) - Moved to bottom */}
      {routeFAQs.length > 0 && (
        <Box sx={{ mt: 6, mb: 4 }}>
            <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: { xs: 1.5, sm: 2 }, textAlign: 'left' }}>
              Frequently Asked Questions
            </Typography>
            <Paper sx={{ p: 3 }}>
            {routeFAQs.map((faq, idx) => (
              <Box key={idx} sx={{ mb: idx < routeFAQs.length - 1 ? 3 : 0 }}>
                  <Typography variant="h3" sx={{ fontSize: '1.25rem', mb: 1, textAlign: 'left' }}>
                    {faq.question}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </Box>
              ))}
            </Paper>
          </Box>
      )}

      {/* Footer Note */}
      <Box sx={{ mt: 6, pt: 4, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Route data verified regularly by Triposia Travel Research Team.
        </Typography>
      </Box>
    </Container>
  );
}
