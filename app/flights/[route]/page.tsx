import { Metadata } from 'next';
import { Container, Typography, Box, Grid, Paper, Card, CardContent } from '@mui/material';
import { getRoute, getDeepRoute, getFlightsByRoute, getRouteWithMetadata, getPoisByAirport, getAirportSummary, getAllAirlines, getFlightsFromAirport, getFlightsToAirport, getRoutesFromAirport, getRoutesToAirport, getDestinationData, getWeatherByAirport, getBookingInsightsByAirport, getPriceTrendsByAirport, getApoisByAirport } from '@/lib/queries';
import { generateMetadata as genMeta, generateBreadcrumbList, generateFlightRouteSchema, generateFlightListingSchema, generatePriceCalendarSchema, generateFlightScheduleSchema, generateFAQPageSchema, generateAirportDeparturesListingSchema, generateAirportDeparturesScheduleSchema, generateAirportArrivalsListingSchema, generateAirportArrivalsScheduleSchema, generateAirportFlightsListSchema, generateAirlineScheduleSchema, parseRouteSlug } from '@/lib/seo';
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
import RelatedPages from '@/components/ui/RelatedPages';
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
  
  // Check if this is a single IATA code (3 letters, no hyphen) - handle as airport page
  if (/^[A-Z]{3}$/i.test(routeSlug) && !routeSlug.includes('-')) {
    const iata = routeSlug.toUpperCase();
    const airport = await getAirportSummary(iata);
    
    // Get city from routes (find a route where this airport is destination)
    const routesToAirport = await getRoutesToAirport(iata);
    const cityFromRoute = routesToAirport.length > 0 ? routesToAirport[0].destination_city : null;
    
    // Format airport name with city
    const airportDisplay = await formatAirportName(iata, airport, cityFromRoute);
    
    const title = airport
      ? `Flights from ${airportDisplay} - ${airport.destinations_count} destinations`
      : `Flights from ${iata}`;
    
    const description = airport
      ? `Complete flight information for ${airportDisplay}: ${airport.destinations_count} destinations, ${airport.departure_count} daily departures, ${airport.arrival_count} daily arrivals. View all flights from and to ${airportDisplay}.`
      : `View all flights from and to ${iata} Airport.`;

    return genMeta({
      title,
      description,
      canonical: `/flights/${iata.toLowerCase()}`,
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
  
  const title = route
    ? `Flights from ${originDisplay} to ${destinationDisplay} - ${route.flights_per_day}`
    : `Flights from ${originDisplay} to ${destinationDisplay}`;
  
  const description = route
    ? `Flight information from ${originDisplay} to ${destinationDisplay}. ${route.flights_per_day} daily. View schedules, airlines, and prices.`
    : `View flight information, schedules, and airlines for the route from ${originDisplay} to ${destinationDisplay}.`;

  // Canonical should point to the canonical route page
  const canonicalRoute = `${origin.toLowerCase()}-${destination.toLowerCase()}`;

  return genMeta({
    title,
    description,
    canonical: `/flights/${canonicalRoute}`,
    noindex: !finalShouldIndex,
  });
}

export default async function FlightRoutePage({ params }: PageProps) {
  const routeSlug = params.route;
  
  // Check if this is a single IATA code (3 letters, no hyphen) - handle as airport page
  if (/^[A-Z]{3}$/i.test(routeSlug) && !routeSlug.includes('-')) {
    const iata = routeSlug.toUpperCase();
    const airport = await getAirportSummary(iata);
    const departures = await getFlightsFromAirport(iata);
    const arrivals = await getFlightsToAirport(iata);
    const routesFrom = await getRoutesFromAirport(iata);
    const routesTo = await getRoutesToAirport(iata);
    
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
    const destinationIatas = Array.from(new Set(routesFrom.map(r => r.destination_iata)));
    
    // Fetch all destination airports in parallel to get city names and check for multiple airports
    const destinationAirports = await Promise.all(
      destinationIatas.map(dest => getAirportSummary(dest))
    );
    
    // Get origin airport country for domestic/international check
    const originCountry = airport.country;
    
    routesFrom.forEach(route => {
      const destAirport = destinationAirports.find(a => a?.iata_from === route.destination_iata);
      const destCountry = destAirport?.country;
      // Determine if route is domestic or international based on country codes
      const isDomestic: boolean = originCountry && destCountry && originCountry === destCountry ? true : false;
      destinationsMap.set(route.destination_iata, {
        iata: route.destination_iata,
        city: route.destination_city || destAirport?.city,
        airport: destAirport, // Store full airport object for formatting
        flights_per_day: route.flights_per_day,
        is_domestic: isDomestic,
        country: destCountry,
      });
    });
    const destinations = Array.from(destinationsMap.values());

    // Create origins list from routes (flights TO this airport)
    const originsMap = new Map<string, { iata: string; city: string; flights_per_day: string; airport?: any; is_domestic?: boolean; country?: string }>();
    const uniqueOrigins = Array.from(new Set(routesTo.map(r => r.origin_iata)));
    
    // Fetch all origin airports in parallel
    const originAirports = await Promise.all(
      uniqueOrigins.map(origin => getAirportSummary(origin))
    );
    
    // Build origins map with city names
    routesTo.forEach(route => {
      if (!originsMap.has(route.origin_iata)) {
        const originAirport = originAirports.find(a => a?.iata_from === route.origin_iata);
        const originCountry = originAirport?.country;
        // Determine if route is domestic or international based on country codes
        const isDomestic: boolean = originCountry && originCountry === airport.country ? true : false;
        originsMap.set(route.origin_iata, {
          iata: route.origin_iata,
          city: originAirport?.city || route.origin_iata,
          airport: originAirport, // Store full airport object for formatting
          flights_per_day: route.flights_per_day,
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
    const destinationsWithDisplay = await Promise.all(
      destinations.map(async (dest) => {
        const route = routesFrom.find(r => r.destination_iata === dest.iata);
        const destCity = route?.destination_city || dest.city;
        const destDisplay = await formatAirportName(dest.iata, dest.airport, destCity);
        return { ...dest, display: destDisplay };
      })
    );
    
    // Format origin displays for tabs
    // For origins, we need to find routes where the origin airport is the destination
    const originsWithDisplay = await Promise.all(
      origins.map(async (orig) => {
        // Find a route where this origin airport is the destination to get its city
        const routesToOrigin = await getRoutesToAirport(orig.iata);
        const origCity = routesToOrigin.length > 0 ? routesToOrigin[0].destination_city : orig.city;
        const origDisplay = await formatAirportName(orig.iata, orig.airport, origCity);
        return { ...orig, display: origDisplay };
      })
    );

    // Import components needed
    const AirportFlightsTabs = (await import('@/components/flights/AirportFlightsTabs')).default;

    // Generate FAQs for airport page
    const airportFAQs = await generateAirportFAQs(
      airport,
      departures,
      arrivals,
      destinations.length
    );

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
        {allFlightsListSchema && <JsonLd data={allFlightsListSchema} />}
        {departuresListingSchema && <JsonLd data={departuresListingSchema} />}
        {departuresScheduleSchema && <JsonLd data={departuresScheduleSchema} />}
        {arrivalsListingSchema && <JsonLd data={arrivalsListingSchema} />}
        {arrivalsScheduleSchema && <JsonLd data={arrivalsScheduleSchema} />}
        {airlineDeparturesScheduleSchema && <JsonLd data={airlineDeparturesScheduleSchema} />}
        {airlineArrivalsScheduleSchema && <JsonLd data={airlineArrivalsScheduleSchema} />}
        {faqSchema && <JsonLd data={faqSchema} />}

        <Typography 
          variant="h1" 
          gutterBottom 
          sx={{ 
            textAlign: 'left',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            lineHeight: { xs: 1.3, sm: 1.4 },
            wordBreak: 'break-word',
          }}
        >
          All Flights from {airportDisplay}
        </Typography>

        <Typography 
          variant="body1" 
          sx={{ 
            mb: { xs: 2, sm: 3 }, 
            fontSize: { xs: '0.875rem', sm: '1.1rem' }, 
            lineHeight: 1.8,
            wordBreak: 'break-word',
          }}
        >
          {introText}
        </Typography>

        {/* Summary Stat Cards */}
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Destinations"
              value={airport.destinations_count}
              subtitle="Cities served"
              icon={<LocationOnIcon sx={{ color: 'primary.main' }} />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Daily Departures"
              value={airport.departure_count}
              subtitle="Outbound flights"
              icon={<FlightIcon sx={{ color: 'primary.main' }} />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Daily Arrivals"
              value={airport.arrival_count}
              subtitle="Inbound flights"
              icon={<ScheduleIcon sx={{ color: 'primary.main' }} />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Origins"
              value={origins.length}
              subtitle="Cities with flights to"
              icon={<LocationOnIcon sx={{ color: 'primary.main' }} />}
            />
          </Grid>
        </Grid>

        {/* Popular Routes Cards */}
        {destinationsWithDisplay.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: { xs: 2, sm: 3 }, textAlign: 'left' }}>
              Popular Routes from {airportDisplay}
            </Typography>
            {(() => {
              const PopularRoutesCards = require('@/components/flights/PopularRoutesCards').default;
              const routeFlightsMap: Record<string, number> = {};
              destinationsWithDisplay.forEach(dest => {
                routeFlightsMap[dest.iata] = departures.filter(f => f.destination_iata === dest.iata).length;
              });
              return (
                <PopularRoutesCards
                  originIata={iata}
                  originDisplay={airportDisplay}
                  destinations={destinationsWithDisplay}
                  routeFlightsMap={routeFlightsMap}
                />
              );
            })()}
          </Box>
        )}

        {/* Flight Schedule - Calendar View */}
        {departures.length > 0 && (
          <Box sx={{ mb: 4 }}>
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

        {/* Map */}
        {airport.lat && airport.lng && (
          <AirportMap
            airport={{
              lat: airport.lat,
              lng: airport.lng,
              iata,
              name: airport.name,
              city: airport.city,
            }}
            topDestinations={topDestinations}
            maxDestinations={5}
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
                  <Typography variant="body2" color="text.secondary">
                    {faq.answer}
                  </Typography>
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

  // Generate FAQs for route page
  const routeFAQs = await generateRouteFAQs(
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

  // Generate FAQ schema for route page (from generated FAQs)
  const routeFAQSchema = generateFAQPageSchema(
    routeFAQs,
    `Frequently Asked Questions about flights from ${originDisplay} to ${destinationDisplay}`
  );

  // Check if page exists in pages_editorial collection
  const slug = `flights/${params.route}`;
  const editorialPage = await getEditorialPage(slug);
  const useOldModel = await shouldUseOldModel(slug);

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
      
      {/* Flight Schedule */}
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
      {editorialPage?.manualContent && (
        <Box sx={{ mt: 6, mb: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Box
              dangerouslySetInnerHTML={{ __html: editorialPage.manualContent }}
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
                  <Typography variant="body2" color="text.secondary">
                    {faq.answer}
                  </Typography>
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
