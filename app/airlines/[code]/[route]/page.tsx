import { Metadata } from 'next';
import { Container, Typography, Box, Grid, Paper, Divider, Link as MuiLink } from '@mui/material';
import { getAirline, getRoute, getDeepRoute, getFlightsByRoute, getRouteWithMetadata, getPoisByAirport, getAirportSummary, getAllAirlines, getFlightsFromAirport, getFlightsToAirport, getRoutesFromAirport, getRoutesToAirport, getTerminalPhones, getTerminalInfoForRoute, getAirlineFlightsFromAirport, getAirlineFlightsToAirport, getWeatherByAirport, getBookingInsightsByAirport, getPriceTrendsByAirport, getAirlineSeasonalInsightsByAirport, getApoisByAirport } from '@/lib/queries';
import { generateMetadata as genMeta, generateBreadcrumbList, generateFlightRouteSchema, generateAirlineFlightListingSchema, generateAirlineRouteScheduleSchema, generateFAQPageSchema, generateAirlineLocalBusinessSchema, parseRouteSlug } from '@/lib/seo';
import { 
  extractRouteMetadata, 
  getBusiestHours, 
  getAverageDuration 
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
import FlightCalendarWrapper from '@/components/flights/FlightCalendarWrapperLazy';
import PriceStatistics from '@/components/flights/PriceStatisticsLazy';
import PoiSection from '@/components/poi/PoiSection';
import WeatherSection from '@/components/travel/WeatherSection';
import BookingInsightsSection from '@/components/travel/BookingInsightsSection';
import PriceTrendsSection from '@/components/travel/PriceTrendsSection';
import SeasonalInsightsSection from '@/components/travel/SeasonalInsightsSection';
import AirportMap from '@/components/maps/AirportMap';
import RouteMap from '@/components/maps/RouteMap';
import { getAirlinesForRoute, formatAirportAnchor, formatAirlineAnchor, getRelatedRoutes, getRelatedAirlinesByCountry } from '@/lib/linking';
import RelatedPages from '@/components/ui/RelatedPages';
import { formatAirportDisplay, formatAirportName } from '@/lib/formatting';
import { generateRouteFAQs, generateAirlineRouteFAQs, generateAirlineAirportFAQs } from '@/lib/faqGenerators';
import { stripHtml } from '@/lib/utils/html';
import { getSiteUrl } from '@/lib/company';
import { generateRouteInsights, shouldRenderInsights } from '@/lib/contentInsights';
import { validateIntroText } from '@/lib/introValidation';
import Link from 'next/link';
import FlightIcon from '@mui/icons-material/Flight';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PageViewTracker from '@/components/analytics/PageViewTracker';
import QASection from '@/components/faq/QASectionLazy';
import FAQServerSection from '@/components/faq/FAQServerSection';
import { findFAQsByPage } from '@/lib/faqs';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import StarIcon from '@mui/icons-material/Star';

interface PageProps {
  params: {
    code: string;
    route: string;
  };
}

export const revalidate = 86400; // ISR: 24 hours

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const code = params?.code?.toUpperCase() || '';
  const routeSlug = params?.route || '';
  
  // Skip if this looks like a "from-" route
  if (routeSlug.startsWith('from-')) {
    return genMeta({
      title: 'Airline Route',
      description: 'Airline route information',
      noindex: true,
    });
  }
  
  const routeParts = parseRouteSlug(routeSlug);
  if (!routeParts) {
    // Check if it's a single IATA code (airport page)
    if (/^[A-Z]{3}$/i.test(routeSlug) && !routeSlug.includes('-')) {
      const iata = routeSlug.toUpperCase();
      const airline = await getAirline(code);
      const airport = await getAirportSummary(iata);
      
      if (airline && airport) {
        const airportDisplay = await formatAirportName(iata, airport);
        const flightsFrom = await getAirlineFlightsFromAirport(code, iata);
        const flightsTo = await getAirlineFlightsToAirport(code, iata);
        
        // Get routes for destination/origin counts
        const routesFrom = await getRoutesFromAirport(iata);
        const routesTo = await getRoutesToAirport(iata);
        const destinationsCount = new Set(routesFrom.map(r => r.destination_iata)).size;
        const originsCount = new Set(routesTo.map(r => r.origin_iata)).size;
        
        // Get aircraft types
        const aircraftTypes = Array.from(new Set([
          ...flightsFrom.map(f => f.aircraft).filter(Boolean),
          ...flightsTo.map(f => f.aircraft).filter(Boolean),
        ])).slice(0, 3);
        
        const title = `${airline.name} Flights from ${airportDisplay}`;
        let description = `View ${airline.name} flights to and from ${airportDisplay}. Check ${airline.name} flight schedules, departure times, arrival times, terminal information, and aircraft details.`;
        
        if (flightsFrom.length > 0 || flightsTo.length > 0) {
          description += ` ${flightsFrom.length} daily departure${flightsFrom.length !== 1 ? 's' : ''} and ${flightsTo.length} daily arrival${flightsTo.length !== 1 ? 's' : ''}.`;
        }
        if (destinationsCount > 0) {
          description += ` Serves ${destinationsCount} destination${destinationsCount !== 1 ? 's' : ''} and receives flights from ${originsCount} origin${originsCount !== 1 ? 's' : ''}.`;
        }
        if (aircraftTypes.length > 0) {
          description += ` Aircraft: ${aircraftTypes.join(', ')}.`;
        }
        
        return genMeta({
          title,
          description,
          canonical: `/airlines/${code.toLowerCase()}/${iata.toLowerCase()}`,
        });
      }
    }
    
    return genMeta({
      title: `${code} Flight Route`,
      description: `${code} airline flight route information`,
      noindex: true,
    });
  }
  
  const { origin, destination } = routeParts;
  const airline = await getAirline(code);
  const route = await getRoute(origin, destination);
  const originAirport = await getAirportSummary(origin);
  const destinationAirport = await getAirportSummary(destination);
  
  // Get all flights for the route and filter by airline (same as main page)
  const allFlights = await getFlightsByRoute(origin, destination);
  const flights = allFlights.filter(f => 
    f.airline_iata?.toUpperCase() === code.toUpperCase()
  );
  
  // Check indexing eligibility (use shouldIndexRoute for airline routes)
  const indexingCheck = shouldIndexRoute(flights, route);
  
  // Format airport names with city names
  const originDisplay = await formatAirportName(origin, originAirport);
  const destinationDisplay = await formatAirportName(destination, destinationAirport);
  
  // Get flight count and other data for better SEO
  const flightCount = flights.length;
  const averageDuration = route?.average_duration || route?.typical_duration;
  const flightsPerDay = route?.flights_per_day;
  const aircraftTypes = Array.from(new Set(flights.map(f => f.aircraft).filter(Boolean))).slice(0, 3);
  
  const title = airline && route
    ? `${airline.name} Flights ${originDisplay} to ${destinationDisplay}`
    : `${code} Flights ${originDisplay} to ${destinationDisplay}`;
  
  let description = airline && route
    ? `Book ${airline.name} flights from ${originDisplay} to ${destinationDisplay}. View ${airline.name} flight schedule with ${flightCount} daily flight${flightCount !== 1 ? 's' : ''}, departure times, arrival times, terminal information, and aircraft details.`
    : `View ${code} airline flights from ${originDisplay} to ${destinationDisplay}. Check ${code} flight schedules and booking information.`;
  
  // Add more details to description (keep concise for Bing/Yandex)
  if (airline && route) {
    if (averageDuration && averageDuration !== 'Data not available') {
      description += ` Flight duration: ${averageDuration}.`;
    }
    if (flightsPerDay) {
      description += ` ${flightsPerDay} flights per day.`;
    }
    if (aircraftTypes.length > 0) {
      description += ` Aircraft: ${aircraftTypes.join(', ')}.`;
    }
  }

  return genMeta({
    title,
    description,
    canonical: `/airlines/${code.toLowerCase()}/${routeSlug}`,
  });
}

export default async function AirlineRoutePage({ params }: PageProps) {
  const code = params?.code?.toUpperCase() || '';
  const routeSlug = params?.route || '';
  
  // Skip if this looks like a "from-" route - let from-[route] handle it
  if (routeSlug.startsWith('from-')) {
    const { notFound } = await import('next/navigation');
    notFound(); // Let from-[route] route handle it
  }
  
  // If it's a single IATA code (3 letters, no hyphen), handle as airport page
  // This handles /airlines/6e/del - uses same data as /flights/del
  if (!routeSlug.includes('-') && /^[A-Z]{3}$/i.test(routeSlug)) {
    const iata = routeSlug.toUpperCase();
    const airline = await getAirline(code);
    const airport = await getAirportSummary(iata);
    
    if (!airline) {
      return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Airline {code} Not Found
          </Typography>
        </Container>
      );
    }

    if (!airport) {
      return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Airport {iata} Not Found
          </Typography>
        </Container>
      );
    }

    // Use the airline's IATA code from the database
    const airlineIataCode = airline.iata || airline.code || code.toUpperCase();
    
    // Get all flights (SAME DATA SOURCE as /flights/del) - departures and arrivals
    const allFlightsFrom = await getFlightsFromAirport(iata);
    const allFlightsTo = await getFlightsToAirport(iata);
    
    // Get routes (SAME DATA SOURCE as /flights/del)
    const routesFrom = await getRoutesFromAirport(iata);
    const routesTo = await getRoutesToAirport(iata);
    
    // Fetch travel decision data for airport
    const weather = await getWeatherByAirport(iata);
    const bookingInsights = await getBookingInsightsByAirport(iata);
    const seasonalInsights = await getAirlineSeasonalInsightsByAirport(iata);
    
    // Filter flights by airline code (simple filter - same as flights/del but only this airline)
    const flightsFrom = allFlightsFrom.filter(f => 
      f.airline_iata?.toUpperCase() === airlineIataCode.toUpperCase()
    );
    const flightsTo = allFlightsTo.filter(f => 
      f.airline_iata?.toUpperCase() === airlineIataCode.toUpperCase()
    );

    // Get origin airport country for domestic/international check
    const originCountry = airport.country;
    
    // Build destinations list from routes (SAME LOGIC as /flights/del) - but filter by airline flights
    const destinationsMap = new Map<string, { iata: string; city: string; flights_per_day: string; is_domestic?: boolean; country?: string }>();
    
    // Fetch all destination airports to get country codes
    const destinationIatas = Array.from(new Set(routesFrom.map(r => r.destination_iata)));
    const destinationAirports = await Promise.all(
      destinationIatas.map(dest => getAirportSummary(dest))
    );
    
    // Only include routes where this airline has flights
    routesFrom.forEach(route => {
      const airlineFlightsToDest = flightsFrom.filter(f => f.destination_iata === route.destination_iata);
      if (airlineFlightsToDest.length > 0) {
        const destAirport = destinationAirports.find(a => a?.iata_from === route.destination_iata);
        const destCountry = destAirport?.country;
        // Determine if route is domestic or international based on country codes
        const isDomestic: boolean = originCountry && destCountry && originCountry === destCountry ? true : false;
        destinationsMap.set(route.destination_iata, {
          iata: route.destination_iata,
          city: route.destination_city,
          flights_per_day: `${airlineFlightsToDest.length} flight${airlineFlightsToDest.length !== 1 ? 's' : ''}`,
          is_domestic: isDomestic,
          country: destCountry,
        });
      }
    });
    const destinations = Array.from(destinationsMap.values());

    // Build origins list from routes (SAME LOGIC as /flights/del) - but filter by airline flights
    const originsMap = new Map<string, { iata: string; city: string; flights_per_day: string; is_domestic?: boolean; country?: string }>();
    const uniqueOrigins = Array.from(new Set(routesTo.map(r => r.origin_iata)));
    
    // Fetch all origin airports in parallel (SAME as /flights/del)
    const originAirports = await Promise.all(
      uniqueOrigins.map(origin => getAirportSummary(origin))
    );
    
    // Build origins map with city names - only include routes where this airline has flights
    routesTo.forEach(route => {
      const airlineFlightsFromOrigin = flightsTo.filter(f => f.origin_iata === route.origin_iata);
      if (airlineFlightsFromOrigin.length > 0 && !originsMap.has(route.origin_iata)) {
        const originAirport = originAirports.find(a => a?.iata_from === route.origin_iata);
        const originCountry = originAirport?.country;
        // Determine if route is domestic or international based on country codes
        const isDomestic = originCountry && originCountry === airport.country ? true : false;
        originsMap.set(route.origin_iata, {
          iata: route.origin_iata,
          city: originAirport?.city || route.origin_iata,
          flights_per_day: `${airlineFlightsFromOrigin.length} flight${airlineFlightsFromOrigin.length !== 1 ? 's' : ''}`,
          is_domestic: isDomestic,
          country: originCountry,
        });
      }
    });
    const origins = Array.from(originsMap.values());

    // Format airport name with city (needed for both error and success cases)
    const airportDisplay = await formatAirportName(iata, airport);

    // Format destination displays with city/airport names
    // Ensure we always have a formatted display name (never just IATA code)
    const destinationsWithDisplay = await Promise.all(
      destinations.map(async (dest) => {
        const destAirport = await getAirportSummary(dest.iata);
        // Use route destination_city if available, otherwise use airport city, otherwise use dest.city
        const cityToUse = dest.city || destAirport?.city;
        const destDisplay = await formatAirportName(dest.iata, destAirport, cityToUse);
        // Ensure display is always set and not just the IATA code
        const finalDisplay = destDisplay && destDisplay !== dest.iata ? destDisplay : (cityToUse ? `${cityToUse} (${dest.iata})` : dest.iata);
        return { 
          ...dest, 
          display: finalDisplay, 
          airport: destAirport,
          is_domestic: dest.is_domestic,
          country: dest.country,
        };
      })
    );

    // Format origin displays with city/airport names
    // Ensure we always have a formatted display name (never just IATA code)
    const originsWithDisplay = await Promise.all(
      origins.map(async (orig) => {
        const origAirport = originAirports.find(a => a?.iata_from === orig.iata);
        // Get city from routes if available, otherwise use airport city, otherwise use orig.city
        const routesToOrigin = await getRoutesToAirport(orig.iata);
        const origCity = routesToOrigin.length > 0 ? routesToOrigin[0].destination_city : (orig.city || origAirport?.city);
        const origDisplay = await formatAirportName(orig.iata, origAirport, origCity);
        // Ensure display is always set and not just the IATA code
        const finalDisplay = origDisplay && origDisplay !== orig.iata ? origDisplay : (origCity ? `${origCity} (${orig.iata})` : orig.iata);
        return { 
          ...orig, 
          display: finalDisplay, 
          airport: origAirport,
          is_domestic: orig.is_domestic,
          country: orig.country,
        };
      })
    );

    // Get top destinations with coordinates for the map (airline airport page)
    const topDestinationRoutes = destinations
      .sort((a, b) => {
        const aFlights = flightsFrom.filter(f => f.destination_iata === a.iata).length;
        const bFlights = flightsFrom.filter(f => f.destination_iata === b.iata).length;
        return bFlights - aFlights;
      })
      .slice(0, 5);
    
    const topDestinationsData = await Promise.all(
      topDestinationRoutes.map(async (dest) => {
        const destAirport = await getAirportSummary(dest.iata);
        if (destAirport?.lat && destAirport?.lng) {
          return {
            lat: destAirport.lat,
            lng: destAirport.lng,
            iata: dest.iata,
            name: destAirport.name,
            city: destAirport.city,
          };
        }
        return null;
      })
    );
    
    const topDestinations = topDestinationsData.filter((d): d is NonNullable<typeof d> => d !== null);

    // Get related airline-airport pages (other airports served by the same airline)
    const relatedAirportIatas = Array.from(new Set([
      ...destinations.map(d => d.iata),
      ...origins.map(o => o.iata),
    ])).filter(airportIata => airportIata !== iata).slice(0, 6);
    
    const relatedAirports = await Promise.all(
      relatedAirportIatas.map(async (airportIata) => {
        const airportData = await getAirportSummary(airportIata);
        const display = await formatAirportName(airportIata, airportData);
        return {
          iata: airportIata,
          airport: airportData,
          display,
        };
      })
    );

    // Create airport name map for FlightTable (includes all destinations, origins, and the airport itself)
    const airportNameMap = new Map<string, string>();
    airportNameMap.set(iata, airportDisplay);
    destinationsWithDisplay.forEach(dest => {
      airportNameMap.set(dest.iata, dest.display);
    });
    originsWithDisplay.forEach(orig => {
      airportNameMap.set(orig.iata, orig.display);
    });

    // Check if we have any flights - show helpful message if none
    if (flightsFrom.length === 0 && flightsTo.length === 0) {
      return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Airlines', href: '/airlines' },
              { label: airline?.name || code, href: `/airlines/${code.toLowerCase()}` },
              { label: airportDisplay, href: `/airlines/${code.toLowerCase()}/${iata.toLowerCase()}` },
            ]}
          />
          <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
            No Flights Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            {airline ? `${airline.name} (${code}) does not operate flights from or to ${airportDisplay}.` : `No flights found for airline ${code} at ${airportDisplay}.`}
          </Typography>
          {airport && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              <Link href={`/flights/${iata.toLowerCase()}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                View all airlines at {airportDisplay} →
              </Link>
            </Typography>
          )}
        </Container>
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://triposia.com';
    const breadcrumbData = generateBreadcrumbList([
      { name: 'Home', url: siteUrl },
      { name: 'Airlines', url: `${siteUrl}/airlines` },
      { name: airline.name, url: `${siteUrl}/airlines/${code.toLowerCase()}` },
      { name: `Flights ${airportDisplay}`, url: `${siteUrl}/airlines/${code.toLowerCase()}/${iata.toLowerCase()}` },
    ]);

    const introText = `${airline.name} operates flights from ${airportDisplay}. From here, ${airline.name} serves ${destinationsWithDisplay.length} destination${destinationsWithDisplay.length !== 1 ? 's' : ''} and receives flights from ${originsWithDisplay.length} origin${originsWithDisplay.length !== 1 ? 's' : ''}.`;

    // Get terminal phone information for airport page
    const terminalPhones = await getTerminalPhones(iata, airline.iata || airline.code);

    // Generate flight schemas for airline airport page
    const airlineDeparturesListingSchema = generateAirlineFlightListingSchema(
      flightsFrom,
      airline.name,
      airline.iata || airline.code || code,
      iata,
      iata, // For airport page, we show all destinations
      airportDisplay,
      airportDisplay
    );
    const airlineArrivalsListingSchema = generateAirlineFlightListingSchema(
      flightsTo,
      airline.name,
      airline.iata || airline.code || code,
      iata,
      iata, // For airport page, we show all origins
      airportDisplay,
      airportDisplay
    );

    // Generate FAQs for airline airport page
    const airportFAQs = await generateAirlineAirportFAQs(
      airline,
      airport,
      flightsFrom,
      flightsTo,
      destinationsWithDisplay,
      originsWithDisplay,
      terminalPhones,
      airportDisplay // Pass the already-formatted airportDisplay
    );

    // Generate FAQ schema for airport page
    const airportFAQSchema = generateFAQPageSchema(
      airportFAQs,
      `Frequently Asked Questions about ${airline.name} flights at ${airportDisplay}`
    );

    // Import components needed for airport page
    const AirlineAirportTabs = (await import('@/components/airlines/AirlineAirportTabs')).default;
    const FlightCalendarWrapper = (await import('@/components/flights/FlightCalendarWrapperLazy')).default;

    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <PageViewTracker
          pageType="airline_route"
          entityPrimary={code}
          entitySecondary={iata}
        />
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Airlines', href: '/airlines' },
            { label: airline.name, href: `/airlines/${code.toLowerCase()}` },
            { label: `Flights ${airportDisplay}`, href: `/airlines/${code.toLowerCase()}/${iata.toLowerCase()}` },
          ]}
        />
        
        <JsonLd data={breadcrumbData} />
        {airlineDeparturesListingSchema && <JsonLd data={airlineDeparturesListingSchema} />}
        {airlineArrivalsListingSchema && <JsonLd data={airlineArrivalsListingSchema} />}
        {airportFAQSchema && <JsonLd data={airportFAQSchema} />}

        <Typography variant="h1" gutterBottom sx={{ textAlign: 'left', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, lineHeight: { xs: 1.3, sm: 1.4 }, wordBreak: 'break-word' }}>
          {airline.name} Flights from {airportDisplay}
        </Typography>

        <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem', lineHeight: 1.8 }}>
          {introText}
        </Typography>

        {/* Summary Stat Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Departures"
              value={flightsFrom.length}
              subtitle={`${airline.name} flights from ${airportDisplay}`}
              icon={<FlightIcon sx={{ color: 'primary.main' }} />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Arrivals"
              value={flightsTo.length}
              subtitle={`${airline.name} flights to ${airportDisplay}`}
              icon={<ScheduleIcon sx={{ color: 'primary.main' }} />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Destinations"
              value={destinations.length}
              subtitle="Served from here"
              icon={<LocationOnIcon sx={{ color: 'primary.main' }} />}
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
        {destinations.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 3, textAlign: 'left' }}>
              {airline.name} Routes from {airportDisplay}
            </Typography>
            <Grid container spacing={2}>
              {destinationsWithDisplay.slice(0, 12).map((dest) => {
                const routeFlights = flightsFrom.filter(f => f.destination_iata === dest.iata);
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={dest.iata}>
                    <Paper
                      component={Link}
                      href={`/airlines/${code.toLowerCase()}/${iata.toLowerCase()}-${dest.iata.toLowerCase()}`}
                      sx={{
                        p: 3,
                        textDecoration: 'none',
                        display: 'block',
                        height: '100%',
                        '&:hover': { bgcolor: 'action.hover', boxShadow: 3, transform: 'translateY(-2px)' },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <FlightIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {airportDisplay} → {dest.display}
                          </Typography>
                        </Box>
                        {dest.is_domestic !== undefined && (
                          <Typography
                            variant="caption"
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                              bgcolor: dest.is_domestic ? 'success.light' : 'info.light',
                              color: dest.is_domestic ? 'success.dark' : 'info.dark',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              ml: 1,
                            }}
                          >
                            {dest.is_domestic ? 'Domestic' : 'International'}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {dest.display}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                        {routeFlights.length} flight{routeFlights.length !== 1 ? 's' : ''} • {dest.flights_per_day}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* Flight Schedule - Calendar View for Departures */}
        {flightsFrom.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
              {airline.name} Flight Schedule - Departures from {airportDisplay}
            </Typography>
            <FlightCalendarWrapper flights={flightsFrom} />
          </Box>
        )}

        {/* Flight Schedule - Calendar View for Arrivals */}
        {flightsTo.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
              {airline.name} Flight Schedule - Arrivals to {airportDisplay}
            </Typography>
            <FlightCalendarWrapper flights={flightsTo} />
          </Box>
        )}

        {/* Terminal Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
            {airline.name} Terminal Information at {airportDisplay}
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(() => {
                // Find terminal from terminal_phones collection matching airline and airport
                const airlineCode = airline.iata || airline.code || code;
                const matchingTerminal = terminalPhones.find(tp => 
                  (tp.airline_code?.toUpperCase() === airlineCode.toUpperCase() ||
                   tp.airline_iata?.toUpperCase() === airlineCode.toUpperCase()) &&
                  (tp.airport_iata?.toUpperCase() === iata.toUpperCase() ||
                   tp.city_iata?.toUpperCase() === iata.toUpperCase())
                );

                // Get terminal number - prioritize from terminal_phones, then airport.terminals, then fallback
                let terminalNumber: string | null = null;
                
                if (matchingTerminal) {
                  terminalNumber = matchingTerminal.departure_terminal || 
                                  matchingTerminal.arrival_terminal || 
                                  matchingTerminal.terminal_name || 
                                  null;
                }
                
                // If not found in terminal_phones, check airport.terminals
                if (!terminalNumber && airport.terminals && airport.terminals.length > 0) {
                  const airlineTerminal = airport.terminals.find(term => 
                    term.airlines.includes(airlineCode)
                  );
                  if (airlineTerminal) {
                    terminalNumber = airlineTerminal.name;
                  }
                }
                
                // Fallback to Terminal 1 or main terminal
                if (!terminalNumber) {
                  // Check if there's a "main" terminal in airport.terminals
                  if (airport.terminals && airport.terminals.length > 0) {
                    const mainTerminal = airport.terminals.find(term => 
                      term.name.toLowerCase().includes('main') || 
                      term.name.toLowerCase() === '1'
                    );
                    terminalNumber = mainTerminal ? mainTerminal.name : 'Terminal 1';
                  } else {
                    terminalNumber = 'Terminal 1'; // Default fallback
                  }
                }
                
                // Ensure terminal number is properly formatted (add "Terminal" prefix if missing)
                if (terminalNumber && !terminalNumber.toLowerCase().startsWith('terminal') && !terminalNumber.toLowerCase().startsWith('main')) {
                  terminalNumber = `Terminal ${terminalNumber}`;
                }

                // Get phone number with fallback
                const phone = matchingTerminal?.terminal_phone || 
                             matchingTerminal?.phone_number || 
                             matchingTerminal?.airlines_phone || 
                             matchingTerminal?.airport_phone;

                      return (
                  <>
                    <Typography variant="body1" color="text.primary" sx={{ mb: 1, lineHeight: 1.6 }}>
                      All {airline.name} flights operate from {terminalNumber} at {airportDisplay} airport.
                          </Typography>
                    
                    {phone && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Terminal Phone:</strong> <Link href={`tel:${phone.replace(/\s/g, '')}`} style={{ color: 'inherit', textDecoration: 'underline' }}>{phone}</Link>
                        </Typography>
                      )}
                    
                    {matchingTerminal?.help_desk_phone && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Help Desk:</strong> <Link href={`tel:${matchingTerminal.help_desk_phone.replace(/\s/g, '')}`} style={{ color: 'inherit', textDecoration: 'underline' }}>{matchingTerminal.help_desk_phone}</Link>
                        {matchingTerminal.help_desk_hours && ` (Hours: ${matchingTerminal.help_desk_hours})`}
                    </Typography>
                    )}
                    
                    {matchingTerminal?.counter_office && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Counter Office:</strong> {matchingTerminal.counter_office}
                </Typography>
              )}
                  </>
                );
              })()}
            </Box>
          </Paper>
        </Box>

        {/* Flight List Sections */}
        {flightsFrom.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
              {airline.name} Departures from {airportDisplay}
            </Typography>
            <Paper sx={{ p: 2 }}>
              <FlightTable flights={flightsFrom.slice(0, 20)} showDestination airportNameMap={airportNameMap} />
            </Paper>
            {flightsFrom.length > 20 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Showing 20 of {flightsFrom.length} flights. Use tabs below to view all flights.
              </Typography>
            )}
          </Box>
        )}

        {flightsTo.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
              {airline.name} Arrivals to {airportDisplay}
            </Typography>
            <Paper sx={{ p: 2 }}>
              <FlightTable flights={flightsTo.slice(0, 20)} showOrigin airportNameMap={airportNameMap} />
            </Paper>
            {flightsTo.length > 20 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Showing 20 of {flightsTo.length} flights. Use tabs below to view all flights.
              </Typography>
            )}
          </Box>
        )}

        {/* Tabs for different views */}
        <AirlineAirportTabs
          airline={airline}
          code={code}
          iata={iata}
          airportDisplay={airportDisplay}
          flightsFrom={flightsFrom}
          flightsTo={flightsTo}
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

        {/* Related Airline-Airport Pages */}
        {relatedAirports.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h2" gutterBottom sx={{ fontSize: '1.75rem', mb: 2, textAlign: 'left' }}>
              More {airline.name} Airport Pages
            </Typography>
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={2}>
                {relatedAirports.map((related) => (
                  <Grid item xs={12} sm={6} md={4} key={related.iata}>
                    <Paper
                      component={Link}
                      href={`/airlines/${code.toLowerCase()}/${related.iata.toLowerCase()}`}
                      sx={{
                        p: 2,
                        textDecoration: 'none',
                        display: 'block',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          boxShadow: 2,
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <FlightIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {airline.name} from {related.display}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        View {airline.name} flights, schedules, and routes from {related.display}
                      </Typography>
                      <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                        View {airline.name} flights from {related.display} →
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>
        )}

        {/* Weather Section */}
        {weather && (
          <WeatherSection weather={weather} airportName={airportDisplay} />
        )}

        {/* Booking Insights */}
        {bookingInsights && (
          <BookingInsightsSection insights={bookingInsights} airportName={airportDisplay} />
        )}

        {/* Seasonal Insights */}
        {seasonalInsights && (
          <SeasonalInsightsSection insights={seasonalInsights} airportName={airportDisplay} airlineName={airline.name} />
        )}

        {/* FAQ Section */}
        {airportFAQs.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 2, textAlign: 'left' }}>
              Frequently Asked Questions about {airline.name} Flights at {airportDisplay}
            </Typography>
            <Paper sx={{ p: 3 }}>
              {airportFAQs.map((faq, idx) => (
                <Box key={idx} sx={{ mb: idx < airportFAQs.length - 1 ? 3 : 0 }}>
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

        {/* Server-side FAQ Section for SEO */}
        <FAQServerSection
          pageType="airline-airport"
          pageSlug={`${code.toLowerCase()}/${iata.toLowerCase()}`}
        />

        {/* Interactive Q&A Section */}
        <QASection
          pageType="airline-airport"
          pageSlug={`${code.toLowerCase()}/${iata.toLowerCase()}`}
          pageUrl={`/airlines/${code.toLowerCase()}/${iata.toLowerCase()}`}
        />

        {/* Airlines Contact Information and Customer Services */}
        {(airline.address || airline.phone || airline.website || airline.city || airline.state || 
          airline.instagram_url || airline.twitter_url || airline.youtube_url || airline.tripadvisor_url || 
          airline.wikipedia_url || (airline as any).facebook_url || (airline as any).linkedin_url) && (
          <Box sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }, mb: 3, textAlign: 'left', fontWeight: 600 }}>
              {airline.name} Contact Information and Customer Services
            </Typography>
            <Paper sx={{ p: { xs: 3, md: 4 } }}>
              <Grid container spacing={3}>
                {/* Address with Airline Name */}
                {(airline.address || airline.city || airline.state || airline.country) && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3 }}>
                      <LocationOnIcon sx={{ color: 'primary.main', mt: 0.5, flexShrink: 0, fontSize: '1.5rem' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                          {airline.name} Address
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                          {airline.address && `${airline.address}`}
                          {airline.address && (airline.city || airline.state || airline.zipcode || airline.country) && <br />}
                          {airline.city && airline.city}
                          {airline.city && airline.state && ', '}
                          {airline.state && airline.state}
                          {airline.zipcode && ` ${airline.zipcode}`}
                          {airline.country && (airline.city || airline.state || airline.zipcode) && ', '}
                          {airline.country && airline.country}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                {/* Phone Number */}
                {airline.phone && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3 }}>
                      <PhoneIcon sx={{ color: 'primary.main', mt: 0.5, flexShrink: 0, fontSize: '1.5rem' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                          Customer Service Phone
                        </Typography>
                        <MuiLink
                          href={`tel:${airline.phone.replace(/\s/g, '')}`}
                          sx={{ 
                            textDecoration: 'none',
                            color: 'primary.main',
                            fontSize: '1.1rem',
                            fontWeight: 500,
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {airline.phone}
                        </MuiLink>
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                {/* Website */}
                {airline.website && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3 }}>
                      <LanguageIcon sx={{ color: 'primary.main', mt: 0.5, flexShrink: 0, fontSize: '1.5rem' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                          Official Website
                        </Typography>
                        <MuiLink
                          href={airline.website.startsWith('http') ? airline.website : `https://${airline.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ 
                            textDecoration: 'none',
                            color: 'primary.main',
                            fontSize: '1rem',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {airline.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                        </MuiLink>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {/* Social Media Links */}
                {(airline.instagram_url || airline.twitter_url || airline.youtube_url || airline.tripadvisor_url || 
                  airline.wikipedia_url || (airline as any).facebook_url || (airline as any).linkedin_url) && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
                      Follow {airline.name} on Social Media
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {airline.instagram_url && (
                        <MuiLink
                          href={airline.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.primary',
                            textDecoration: 'none',
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              borderColor: 'primary.main',
                            },
                          }}
                        >
                          <InstagramIcon sx={{ color: '#E4405F', fontSize: '1.25rem' }} />
                          <Typography variant="body2">Instagram</Typography>
                        </MuiLink>
                      )}
                      {airline.twitter_url && (
                        <MuiLink
                          href={airline.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.primary',
                            textDecoration: 'none',
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              borderColor: 'primary.main',
                            },
                          }}
                        >
                          <TwitterIcon sx={{ color: '#1DA1F2', fontSize: '1.25rem' }} />
                          <Typography variant="body2">Twitter</Typography>
                        </MuiLink>
                      )}
                      {airline.youtube_url && (
                        <MuiLink
                          href={airline.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.primary',
                            textDecoration: 'none',
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              borderColor: 'primary.main',
                            },
                          }}
                        >
                          <YouTubeIcon sx={{ color: '#FF0000', fontSize: '1.25rem' }} />
                          <Typography variant="body2">YouTube</Typography>
                        </MuiLink>
                      )}
                      {(airline as any).facebook_url && (
                        <MuiLink
                          href={(airline as any).facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.primary',
                            textDecoration: 'none',
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              borderColor: 'primary.main',
                            },
                          }}
                        >
                          <FacebookIcon sx={{ color: '#1877F2', fontSize: '1.25rem' }} />
                          <Typography variant="body2">Facebook</Typography>
                        </MuiLink>
                      )}
                      {(airline as any).linkedin_url && (
                        <MuiLink
                          href={(airline as any).linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.primary',
                            textDecoration: 'none',
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              borderColor: 'primary.main',
                            },
                          }}
                        >
                          <LinkedInIcon sx={{ color: '#0077B5', fontSize: '1.25rem' }} />
                          <Typography variant="body2">LinkedIn</Typography>
                        </MuiLink>
                      )}
                      {airline.tripadvisor_url && (
                        <MuiLink
                          href={airline.tripadvisor_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.primary',
                            textDecoration: 'none',
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              borderColor: 'primary.main',
                            },
                          }}
                        >
                          <StarIcon sx={{ color: '#00AF87', fontSize: '1.25rem' }} />
                          <Typography variant="body2">TripAdvisor</Typography>
                        </MuiLink>
                      )}
                      {airline.wikipedia_url && (
                        <MuiLink
                          href={airline.wikipedia_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.primary',
                            textDecoration: 'none',
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              borderColor: 'primary.main',
                            },
                          }}
                        >
                          <LanguageIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                          <Typography variant="body2">Wikipedia</Typography>
                        </MuiLink>
                      )}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Box>
        )}
      </Container>
    );
  }
  
  // If it's not a valid route format, show error
  if (!routeSlug.includes('-')) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Invalid Route Format
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Route format should be origin-destination (e.g., del-bom). 
          For flights from a single airport, use: <Link href={`/airlines/${code.toLowerCase()}/${routeSlug.toLowerCase()}`}>/airlines/{code.toLowerCase()}/{routeSlug.toLowerCase()}</Link>
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
      </Container>
    );
  }

  const { origin, destination } = routeParts;
  
  // Get airline first
  const airline = await getAirline(code);
  if (!airline) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Airline {code} Not Found
        </Typography>
      </Container>
    );
  }
  
  // Get ALL data from flights route page (SAME DATA SOURCE as /flights/del-bom)
  const route = await getRoute(origin, destination);
  const deepRoute = await getDeepRoute(origin, destination);
  const routeWithMetadata = await getRouteWithMetadata(origin, destination);
  const allFlights = await getFlightsByRoute(origin, destination); // SAME as /flights/del-bom
  const originAirport = await getAirportSummary(origin);
  const destinationAirport = await getAirportSummary(destination);
  const pois = await getPoisByAirport(destination, 6);
  const apois = await getApoisByAirport(destination, 6);
  
  // Fetch travel decision data for destination airport
  const destinationWeather = await getWeatherByAirport(destination);
  const destinationBookingInsights = await getBookingInsightsByAirport(destination);
  const destinationPriceTrends = await getPriceTrendsByAirport(destination);
  const destinationSeasonalInsights = await getAirlineSeasonalInsightsByAirport(destination);
  
  // Filter flights by airline code (SIMPLE FILTER)
  const airlineIataCode = airline.iata || airline.code || code.toUpperCase();
  const flights = allFlights.filter(f => 
    f.airline_iata?.toUpperCase() === airlineIataCode.toUpperCase()
  );
  
  // Format airport names early for use in error messages
  const routesToOrigin = await getRoutesToAirport(origin);
  const originCityFromRoute = routesToOrigin.length > 0 ? routesToOrigin[0].destination_city : null;
  const originDisplayEarly = await formatAirportName(origin, originAirport, originCityFromRoute);
  const destinationDisplayEarly = await formatAirportName(destination, destinationAirport, route?.destination_city);

  // Check if we have flights
  if (flights.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Airlines', href: '/airlines' },
            { label: airline.name, href: `/airlines/${code.toLowerCase()}` },
            { label: `${originDisplayEarly} to ${destinationDisplayEarly}`, href: `/airlines/${code.toLowerCase()}/${routeSlug}` },
          ]}
        />
        <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
          No Flights Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          {airline.name} ({code}) does not operate flights from {originDisplayEarly} to {destinationDisplayEarly}.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          <Link href={`/flights/${routeSlug}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
            View all airlines on this route →
          </Link>
        </Typography>
      </Container>
    );
  }

  // Extract route metadata (SAME as /flights/del-bom)
  const routeMetadata = routeWithMetadata ? extractRouteMetadata(routeWithMetadata) : {};
  const distance = routeMetadata.distance;
  const airlines = Array.from(new Set(allFlights.map(f => f.airline_name)));
  const averageDuration = route?.average_duration || route?.typical_duration || routeMetadata.averageDuration;
  const operatingAirlines = await getAirlinesForRoute(origin, destination, allFlights);
  
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
  
  // Get other airlines operating this route (excluding current airline)
  const otherAirlines = operatingAirlines.filter(a => a.code?.toLowerCase() !== code.toLowerCase()).slice(0, 6);
  
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
  
  if (!route) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Route Not Found
        </Typography>
      </Container>
    );
  }

  // Format airport names with city names for display
  // Use route destination_city for destination if available, otherwise use airport city
  // For origin, use the city we already fetched from routes
  const originDisplay = originDisplayEarly;
  const destinationDisplay = destinationDisplayEarly;

  const siteUrl = getSiteUrl();
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Home', url: siteUrl },
    { name: 'Airlines', url: `${siteUrl}/airlines` },
    { name: airline.name, url: `${siteUrl}/airlines/${code.toLowerCase()}` },
    { name: `${originDisplay} to ${destinationDisplay}`, url: `${siteUrl}/airlines/${code.toLowerCase()}/${routeSlug}` },
  ]);

  // Extract route information for cards (SAME as /flights/del-bom)
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

  // Extract price data (SAME as /flights/del-bom)
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

  const flightSchema = generateFlightRouteSchema(
    origin,
    destination,
    origin,
    route.destination_city,
    route.flights_per_day
  );

  // Generate flight listing and schedule schemas for airline route
  const airlineFlightListingSchema = generateAirlineFlightListingSchema(
    flights,
    airline.name,
    airline.iata || airline.code || code,
    origin,
    destination,
    originDisplay,
    destinationDisplay
  );
  const airlineScheduleSchema = generateAirlineRouteScheduleSchema(
    flights,
    airline.name,
    origin,
    destination,
    originDisplay,
    destinationDisplay
  );

  // Get terminal phone information
  const originTerminalPhones = await getTerminalPhones(origin, airline.iata || airline.code);
  const destinationTerminalPhones = await getTerminalPhones(destination, airline.iata || airline.code);
  
  // Get terminal info for route (using new schema)
  const routeTerminalInfo = await getTerminalInfoForRoute(
    origin,
    destination,
    airline.iata || airline.code || code
  );
  
  // Generate airline-specific FAQs with terminal information
  const faqs = await generateAirlineRouteFAQs(
    airline,
    flights,
    allFlights, // Pass all flights for comparison
    origin,
    destination,
    originAirport,
    destinationAirport,
    route,
    distance,
    averageDuration !== 'Data not available' ? averageDuration : undefined,
    cheapestMonth,
    flightsPerWeek,
    averagePrice,
    originTerminalPhones,
    destinationTerminalPhones
  );

  // Fetch user-submitted FAQs for SEO
  const userFAQs = await findFAQsByPage('airline-route', routeSlug, {
    limit: 20,
    sortBy: 'most-helpful',
    includeUnanswered: false,
  });

  // Generate FAQ schema from user-submitted FAQs
  const userFAQSchema = userFAQs.length > 0
    ? generateFAQPageSchema(
        userFAQs
          .filter((faq) => faq.isAnswered && faq.answers && faq.answers.length > 0)
          .map((faq) => {
            const bestAnswer =
              faq.answers.find((a) => a.isExpertAnswer || a.author) ||
              faq.answers
                .sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0))[0] ||
              faq.answers[0];
            
            if (!bestAnswer) return null;

            // Get answer content (support both old and new format)
            const answerContent = bestAnswer.answer || bestAnswer.content || '';
            const answerText = stripHtml(answerContent);

            return {
              question: faq.question,
              answer: answerText,
            };
          })
          .filter((faq): faq is { question: string; answer: string } => faq !== null && !!faq.answer),
        `Frequently Asked Questions about ${airline.name} flights from ${originDisplay} to ${destinationDisplay}`
      )
    : null;

  // Generate FAQ schema (from generated FAQs)
  const faqSchema = generateFAQPageSchema(
    faqs,
    `Frequently Asked Questions about ${airline.name} flights from ${originDisplay} to ${destinationDisplay}`
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageViewTracker
        pageType="airline_route"
        entityPrimary={code}
        entitySecondary={routeSlug}
        additionalParams={{
          origin: origin,
          destination: destination,
        }}
      />
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Airlines', href: '/airlines' },
          { label: airline.name, href: `/airlines/${code.toLowerCase()}` },
          { label: `${originDisplay} to ${destinationDisplay}`, href: `/airlines/${code.toLowerCase()}/${routeSlug}` },
        ]}
      />
      
      <JsonLd data={breadcrumbData} />
      <JsonLd data={flightSchema} />
      {airlineFlightListingSchema && <JsonLd data={airlineFlightListingSchema} />}
      {airlineScheduleSchema && <JsonLd data={airlineScheduleSchema} />}
      {faqSchema && <JsonLd data={faqSchema} />}
      {userFAQSchema && <JsonLd data={userFAQSchema} />}
      
      {/* Local Business JSON-LD for Origin Terminal */}
      {(() => {
        const originTerminal = routeTerminalInfo?.origin || originTerminalPhones.find(tp => tp.departure_terminal || tp.terminal_name);
        if (originTerminal) {
          const terminal = originTerminal.departure_terminal || originTerminal.terminal_name;
          const phone = originTerminal.terminal_phone || originTerminal.phone_number || originTerminal.airlines_phone || originTerminal.airport_phone;
          if (terminal || phone) {
            const localBusinessSchema = generateAirlineLocalBusinessSchema(
              airline.name,
              airline.iata || airline.code || code,
              originDisplay,
              origin,
              terminal,
              phone,
              originAirport ? {
                addressLocality: originAirport.city || originDisplay,
                addressCountry: originAirport.country,
              } : undefined,
              airline.website
            );
            return <JsonLd data={localBusinessSchema} />;
          }
        }
        return null;
      })()}
      
      {/* Local Business JSON-LD for Destination Terminal */}
      {(() => {
        const destTerminal = routeTerminalInfo?.destination || destinationTerminalPhones.find(tp => tp.arrival_terminal || tp.terminal_name);
        if (destTerminal) {
          const terminal = destTerminal.arrival_terminal || destTerminal.terminal_name;
          const phone = destTerminal.terminal_phone || destTerminal.phone_number || destTerminal.airlines_phone || destTerminal.airport_phone;
          if (terminal || phone) {
            const localBusinessSchema = generateAirlineLocalBusinessSchema(
              airline.name,
              airline.iata || airline.code || code,
              destinationDisplay,
              destination,
              terminal,
              phone,
              destinationAirport ? {
                addressLocality: destinationAirport.city || destinationDisplay,
                addressCountry: destinationAirport.country,
              } : undefined,
              airline.website
            );
            return <JsonLd data={localBusinessSchema} />;
          }
        }
        return null;
      })()}

      {/* 1. Route Header with Airline-specific heading */}
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
        airlinesCount={1} // Only this airline
        flightsPerDay={route.flights_per_day || flights.length.toString()}
        airlineName={airline.name} // Pass airline name for airline-specific heading
      />

      {/* 2. Route Info Cards (SAME as /flights/del-bom) */}
      <Box sx={{ mb: 4 }}>
        <RouteInfoCards
          flightTimeRange={flightTimeRange}
          earliestFlight={earliestFlight}
          lastFlight={lastFlight}
          distance={formattedDistance}
          cheapestMonth={cheapestMonth}
          airlinesCount={1} // Only this airline
          flightsPerWeek={flightsPerWeek}
          departingTerminal={terminals.departing ? `${terminals.departing} (${origin})` : undefined}
          arrivingTerminal={terminals.arriving ? `${terminals.arriving} (${destination})` : undefined}
        />
      </Box>

      {/* 2.5. Terminal Information & Contact Details */}
      {(routeTerminalInfo?.origin || routeTerminalInfo?.destination || originTerminalPhones.length > 0 || destinationTerminalPhones.length > 0) && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
            {airline.name} Terminal Information & Contact
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Origin Terminal Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon fontSize="small" />
                  Departure Terminal - {originDisplay}
                </Typography>
                <Box sx={{ pl: 2 }}>
                  {routeTerminalInfo?.origin?.departure_terminal && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Terminal:</strong> {routeTerminalInfo.origin.departure_terminal}
                    </Typography>
                  )}
                  {!routeTerminalInfo?.origin?.departure_terminal && originTerminalPhones.find(tp => tp.departure_terminal) && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Terminal:</strong> {originTerminalPhones.find(tp => tp.departure_terminal)?.departure_terminal}
                    </Typography>
                  )}
                  {(() => {
                    const originTerminal = routeTerminalInfo?.origin || originTerminalPhones.find(tp => tp.departure_terminal || tp.terminal_name);
                    const phone = originTerminal?.terminal_phone || originTerminal?.phone_number || originTerminal?.airlines_phone || originTerminal?.airport_phone;
                    if (phone) {
                      return (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon fontSize="small" />
                          <strong>Phone:</strong> {phone}
                        </Typography>
                      );
                    }
                    return null;
                  })()}
                  {originAirport?.city && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Location:</strong> {routeTerminalInfo?.origin?.departure_terminal || originTerminalPhones.find(tp => tp.departure_terminal)?.departure_terminal || 'Terminal'}, {originAirport.city}{originAirport.country ? `, ${originAirport.country}` : ''}
                    </Typography>
                  )}
                  {routeTerminalInfo?.origin?.counter_office && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Counter Office:</strong> {routeTerminalInfo.origin.counter_office}
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Destination Terminal Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon fontSize="small" />
                  Arrival Terminal - {destinationDisplay}
                </Typography>
                <Box sx={{ pl: 2 }}>
                  {routeTerminalInfo?.destination?.arrival_terminal && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Terminal:</strong> {routeTerminalInfo.destination.arrival_terminal}
                    </Typography>
                  )}
                  {!routeTerminalInfo?.destination?.arrival_terminal && destinationTerminalPhones.find(tp => tp.arrival_terminal) && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Terminal:</strong> {destinationTerminalPhones.find(tp => tp.arrival_terminal)?.arrival_terminal}
                    </Typography>
                  )}
                  {(() => {
                    const destTerminal = routeTerminalInfo?.destination || destinationTerminalPhones.find(tp => tp.arrival_terminal || tp.terminal_name);
                    const phone = destTerminal?.terminal_phone || destTerminal?.phone_number || destTerminal?.airlines_phone || destTerminal?.airport_phone;
                    if (phone) {
                      return (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon fontSize="small" />
                          <strong>Phone:</strong> {phone}
                        </Typography>
                      );
                    }
                    return null;
                  })()}
                  {destinationAirport?.city && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Location:</strong> {routeTerminalInfo?.destination?.arrival_terminal || destinationTerminalPhones.find(tp => tp.arrival_terminal)?.arrival_terminal || 'Terminal'}, {destinationAirport.city}{destinationAirport.country ? `, ${destinationAirport.country}` : ''}
                    </Typography>
                  )}
                  {routeTerminalInfo?.destination?.counter_office && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Counter Office:</strong> {routeTerminalInfo.destination.counter_office}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}

      {/* 3. Flight List Section */}
      {flights.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
            {airline.name} Flight Schedule from {originDisplay} to {destinationDisplay}
      </Typography>
          <Paper sx={{ p: 2 }}>
            <FlightTable flights={flights} />
          </Paper>
        </Box>
      )}

      {/* 4. Flight Calendar & Schedule */}
      {flights.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
            {airline.name} Monthly Flight Calendar
          </Typography>
          <FlightCalendarWrapper 
            flights={flights}
            origin={origin}
            destination={destination}
            originDisplay={originDisplay}
            destinationDisplay={destinationDisplay}
          />
        </Box>
      )}

      {/* 4. Route Insights (SAME as /flights/del-bom) */}
      {(() => {
        const insights = generateRouteInsights({
          flights,
          route,
          averageDuration: averageDuration !== 'Data not available' ? averageDuration : undefined,
          distance,
          airlines: [airline.name],
          cheapestMonths: cheapestMonth ? [cheapestMonth] : undefined,
          busiestHours: busiestHours && busiestHours !== 'Data not available' ? [busiestHours] : undefined,
        });
        
        if (!shouldRenderInsights(insights)) return null;
        
        return (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', mb: 2, textAlign: 'left' }}>
              Route Insights
          </Typography>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {insights.whyDurationVaries && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Duration variability:</strong> {insights.whyDurationVaries}
                  </Typography>
                )}
                {insights.whyCheapestMonth && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Pricing patterns:</strong> {insights.whyCheapestMonth}
                  </Typography>
                )}
                {insights.bestTimeOfDay && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Best departure times:</strong> {insights.bestTimeOfDay}
                  </Typography>
                )}
                {insights.seasonalDemand && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Seasonal demand:</strong> {insights.seasonalDemand}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Box>
        );
      })()}

      {/* 5. Price Statistics (SAME as /flights/del-bom) */}
      {monthlyPrices.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <PriceStatistics
            averagePrice={averagePrice}
            monthlyPrices={monthlyPrices}
            description="The numbers are average prices found based on user searches for direct flights between the airports. It's calculated from the cheapest prices found per month for a round-trip with 1 adult and can vary depending on the amount of data we have for this particular route."
            originCity={originAirport?.city}
            destinationCity={route.destination_city || destinationAirport?.city}
            originCode={origin}
            destinationCode={destination}
          />
        </Box>
      )}

      {/* 6. Link to view all airlines (if this airline doesn't have all flights) */}
      {allFlights.length > flights.length && (
        <Box sx={{ mb: 4 }}>
          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="body2">
              <Link href={`/flights/${routeSlug}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                View all {allFlights.length} flights from {originDisplay} to {destinationDisplay} operated by {new Set(allFlights.map(f => f.airline_iata)).size} airline{new Set(allFlights.map(f => f.airline_iata)).size !== 1 ? 's' : ''} →
              </Link>
            </Typography>
          </Paper>
        </Box>
      )}

      {/* 7. POI Section (from apois collection) */}
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
            Places Near {destinationDisplay} Airport
          </Typography>
          <PoiSection pois={pois} title="" />
        </Box>
      )}

      {/* Map (Supporting element, below main content) */}
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

      {/* Terminal Information with Bullet Points */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
          {airline.name} Terminal Information
          </Typography>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Departure Terminal Information */}
            {(terminals.departing || originTerminalPhones.length > 0 || (originAirport?.terminals && originAirport.terminals.length > 0)) && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                    Departure Terminal at {originDisplay}:
          </Typography>
                  {terminals.departing && (
                    <Typography variant="body2" color="text.secondary">
                      • {airline.name} flights from {originDisplay} depart from Terminal {terminals.departing}
          </Typography>
                  )}
                  {originAirport?.terminals && originAirport.terminals.length > 0 && (
                    <Box sx={{ ml: 2, mt: 0.5 }}>
                      {originAirport.terminals
                        .filter(term => term.airlines.includes(airline.iata || airline.code || ''))
                        .map((term, idx) => {
                          const terminalPhone = originTerminalPhones.find(tp => 
                            tp.terminal_name === term.name && 
                            (tp.airline_code?.toUpperCase() === (airline.iata || airline.code)?.toUpperCase() || !tp.airline_code)
                          );
                          return (
                            <Box key={idx} sx={{ mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                • Terminal {term.name}: {airline.name} operates from this terminal
          </Typography>
                              {terminalPhone?.phone_number && (
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                  • Terminal {term.name} Phone: {terminalPhone.phone_number}
                                </Typography>
                              )}
                              {terminalPhone?.help_desk_phone && (
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                  • Terminal {term.name} Help Desk: {terminalPhone.help_desk_phone}
                                  {terminalPhone.help_desk_hours && ` (Hours: ${terminalPhone.help_desk_hours})`}
                                </Typography>
                              )}
                              {terminalPhone?.terminal_location && (
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                  • Terminal {term.name} Location: {terminalPhone.terminal_location}
                                </Typography>
                              )}
      </Box>
                          );
                        })}
                    </Box>
                  )}
                  {/* Show all terminal phones from collection that match this airline and airport */}
                  {originTerminalPhones
                    .filter(tp => {
                      // Show if it matches the airline code or is general (no airline_code)
                      const matchesAirline = !tp.airline_code || tp.airline_code.toUpperCase() === (airline.iata || airline.code)?.toUpperCase();
                      // Show if not already displayed in terminals above
                      const notInTerminals = !originAirport?.terminals?.some(term => term.name === tp.terminal_name);
                      return matchesAirline && (tp.phone_number || tp.help_desk_phone || tp.terminal_location) && (notInTerminals || tp.terminal_name);
                    })
                    .map((terminal, idx) => (
                      <Box key={`origin-phone-${idx}`} sx={{ ml: terminal.terminal_name ? 2 : 0, mt: 0.5 }}>
                        {terminal.terminal_name && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Terminal {terminal.terminal_name}:
                          </Typography>
                        )}
                        {terminal.phone_number && (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: terminal.terminal_name ? 2 : 0 }}>
                            • {terminal.airline_name || airline.name} Terminal Phone: {terminal.phone_number}
                          </Typography>
                        )}
                        {terminal.help_desk_phone && (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: terminal.terminal_name ? 2 : 0 }}>
                            • Help Desk: {terminal.help_desk_phone}
                            {terminal.help_desk_hours && ` (Hours: ${terminal.help_desk_hours})`}
                          </Typography>
                        )}
                        {terminal.terminal_location && (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: terminal.terminal_name ? 2 : 0 }}>
                            • Location: {terminal.terminal_location}
                          </Typography>
                        )}
                      </Box>
                    ))}
                </Box>
              )}
              
              {/* Arrival Terminal Information */}
              {(terminals.arriving || destinationTerminalPhones.length > 0 || (destinationAirport?.terminals && destinationAirport.terminals.length > 0)) && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                    Arrival Terminal at {destinationDisplay}:
                  </Typography>
                  {terminals.arriving && (
                    <Typography variant="body2" color="text.secondary">
                      • {airline.name} flights to {destinationDisplay} arrive at Terminal {terminals.arriving}
                    </Typography>
                  )}
                  {destinationAirport?.terminals && destinationAirport.terminals.length > 0 && (
                    <Box sx={{ ml: 2, mt: 0.5 }}>
                      {destinationAirport.terminals
                        .filter(term => term.airlines.includes(airline.iata || airline.code || ''))
                        .map((term, idx) => {
                          const terminalPhone = destinationTerminalPhones.find(tp => 
                            tp.terminal_name === term.name && 
                            (tp.airline_code?.toUpperCase() === (airline.iata || airline.code)?.toUpperCase() || !tp.airline_code)
                          );
                          return (
                            <Box key={idx} sx={{ mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                • Terminal {term.name}: {airline.name} operates from this terminal
                              </Typography>
                              {terminalPhone?.phone_number && (
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                  • Terminal {term.name} Phone: {terminalPhone.phone_number}
                                </Typography>
                              )}
                              {terminalPhone?.help_desk_phone && (
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                  • Terminal {term.name} Help Desk: {terminalPhone.help_desk_phone}
                                  {terminalPhone.help_desk_hours && ` (Hours: ${terminalPhone.help_desk_hours})`}
                                </Typography>
                              )}
                              {terminalPhone?.terminal_location && (
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                  • Terminal {term.name} Location: {terminalPhone.terminal_location}
                                </Typography>
                              )}
                            </Box>
                          );
                        })}
                    </Box>
                  )}
                  {/* Show all terminal phones from collection that match this airline and airport */}
                  {destinationTerminalPhones
                    .filter(tp => {
                      // Show if it matches the airline code or is general (no airline_code)
                      const matchesAirline = !tp.airline_code || tp.airline_code.toUpperCase() === (airline.iata || airline.code)?.toUpperCase();
                      // Show if not already displayed in terminals above
                      const notInTerminals = !destinationAirport?.terminals?.some(term => term.name === tp.terminal_name);
                      return matchesAirline && (tp.phone_number || tp.help_desk_phone || tp.terminal_location) && (notInTerminals || tp.terminal_name);
                    })
                    .map((terminal, idx) => (
                      <Box key={`dest-phone-${idx}`} sx={{ ml: terminal.terminal_name ? 2 : 0, mt: 0.5 }}>
                        {terminal.terminal_name && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Terminal {terminal.terminal_name}:
                          </Typography>
                        )}
                        {terminal.phone_number && (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: terminal.terminal_name ? 2 : 0 }}>
                            • {terminal.airline_name || airline.name} Terminal Phone: {terminal.phone_number}
                          </Typography>
                        )}
                        {terminal.help_desk_phone && (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: terminal.terminal_name ? 2 : 0 }}>
                            • Help Desk: {terminal.help_desk_phone}
                            {terminal.help_desk_hours && ` (Hours: ${terminal.help_desk_hours})`}
                          </Typography>
                        )}
                        {terminal.terminal_location && (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: terminal.terminal_name ? 2 : 0 }}>
                            • Location: {terminal.terminal_location}
                          </Typography>
                        )}
                      </Box>
                    ))}
        </Box>
      )}
              
              {/* Show message if no terminal data available */}
              {!terminals.departing && !terminals.arriving && 
               originTerminalPhones.length === 0 && destinationTerminalPhones.length === 0 && 
               (!originAirport?.terminals || originAirport.terminals.length === 0) && 
               (!destinationAirport?.terminals || destinationAirport.terminals.length === 0) && (
                <Typography variant="body2" color="text.secondary">
                  Terminal information for {airline.name} on this route is currently being updated. Please check back soon or contact the airports directly for terminal details.
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>

      {/* Weather Section */}
      {destinationWeather && (
        <WeatherSection weather={destinationWeather} airportName={destinationDisplay} />
      )}

      {/* Booking Insights */}
      {destinationBookingInsights && (
        <BookingInsightsSection insights={destinationBookingInsights} airportName={destinationDisplay} />
      )}

      {/* Price Trends */}
      {destinationPriceTrends && (
        <PriceTrendsSection trends={destinationPriceTrends} airportName={destinationDisplay} />
      )}

      {/* Seasonal Insights */}
      {destinationSeasonalInsights && (
        <SeasonalInsightsSection insights={destinationSeasonalInsights} airportName={destinationDisplay} airlineName={airline.name} />
      )}

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 2, textAlign: 'left' }}>
            Frequently Asked Questions about {airline.name} Flights
          </Typography>
          <Paper sx={{ p: 3 }}>
            {faqs.map((faq, idx) => (
              <Box key={idx} sx={{ mb: idx < faqs.length - 1 ? 3 : 0 }}>
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

      {/* Airlines Contact Information and Customer Services */}
      {(airline.address || airline.phone || airline.website || airline.city || airline.state || 
        airline.instagram_url || airline.twitter_url || airline.youtube_url || airline.tripadvisor_url || 
        airline.wikipedia_url || (airline as any).facebook_url || (airline as any).linkedin_url) && (
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }, mb: 3, textAlign: 'left', fontWeight: 600 }}>
            {airline.name} Contact Information and Customer Services
          </Typography>
          <Paper sx={{ p: { xs: 3, md: 4 } }}>
            <Grid container spacing={3}>
              {/* Address with Airline Name */}
              {(airline.address || airline.city || airline.state || airline.country) && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3 }}>
                    <LocationOnIcon sx={{ color: 'primary.main', mt: 0.5, flexShrink: 0, fontSize: '1.5rem' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        {airline.name} Address
                      </Typography>
                      <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                        {airline.address && `${airline.address}`}
                        {airline.address && (airline.city || airline.state || airline.zipcode || airline.country) && <br />}
                        {airline.city && airline.city}
                        {airline.city && airline.state && ', '}
                        {airline.state && airline.state}
                        {airline.zipcode && ` ${airline.zipcode}`}
                        {airline.country && (airline.city || airline.state || airline.zipcode) && ', '}
                        {airline.country && airline.country}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              
              {/* Phone Number */}
              {airline.phone && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3 }}>
                    <PhoneIcon sx={{ color: 'primary.main', mt: 0.5, flexShrink: 0, fontSize: '1.5rem' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        Customer Service Phone
                      </Typography>
                      <MuiLink
                        href={`tel:${airline.phone.replace(/\s/g, '')}`}
                        sx={{ 
                          textDecoration: 'none',
                          color: 'primary.main',
                          fontSize: '1.1rem',
                          fontWeight: 500,
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {airline.phone}
                      </MuiLink>
                    </Box>
                  </Box>
                </Grid>
              )}
              
              {/* Website */}
              {airline.website && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3 }}>
                    <LanguageIcon sx={{ color: 'primary.main', mt: 0.5, flexShrink: 0, fontSize: '1.5rem' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        Official Website
                      </Typography>
                      <MuiLink
                        href={airline.website.startsWith('http') ? airline.website : `https://${airline.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                          textDecoration: 'none',
                          color: 'primary.main',
                          fontSize: '1rem',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {airline.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                      </MuiLink>
                    </Box>
                  </Box>
                </Grid>
              )}

              {/* Social Media Links */}
              {(airline.instagram_url || airline.twitter_url || airline.youtube_url || airline.tripadvisor_url || 
                airline.wikipedia_url || (airline as any).facebook_url || (airline as any).linkedin_url) && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
                    Follow {airline.name} on Social Media
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {airline.instagram_url && (
                      <MuiLink
                        href={airline.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          color: 'text.primary',
                          textDecoration: 'none',
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        <InstagramIcon sx={{ color: '#E4405F', fontSize: '1.25rem' }} />
                        <Typography variant="body2">Instagram</Typography>
                      </MuiLink>
                    )}
                    {airline.twitter_url && (
                      <MuiLink
                        href={airline.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          color: 'text.primary',
                          textDecoration: 'none',
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        <TwitterIcon sx={{ color: '#1DA1F2', fontSize: '1.25rem' }} />
                        <Typography variant="body2">Twitter</Typography>
                      </MuiLink>
                    )}
                    {airline.youtube_url && (
                      <MuiLink
                        href={airline.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          color: 'text.primary',
                          textDecoration: 'none',
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        <YouTubeIcon sx={{ color: '#FF0000', fontSize: '1.25rem' }} />
                        <Typography variant="body2">YouTube</Typography>
                      </MuiLink>
                    )}
                    {(airline as any).facebook_url && (
                      <MuiLink
                        href={(airline as any).facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          color: 'text.primary',
                          textDecoration: 'none',
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        <FacebookIcon sx={{ color: '#1877F2', fontSize: '1.25rem' }} />
                        <Typography variant="body2">Facebook</Typography>
                      </MuiLink>
                    )}
                    {(airline as any).linkedin_url && (
                      <MuiLink
                        href={(airline as any).linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          color: 'text.primary',
                          textDecoration: 'none',
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        <LinkedInIcon sx={{ color: '#0077B5', fontSize: '1.25rem' }} />
                        <Typography variant="body2">LinkedIn</Typography>
                      </MuiLink>
                    )}
                    {airline.tripadvisor_url && (
                      <MuiLink
                        href={airline.tripadvisor_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          color: 'text.primary',
                          textDecoration: 'none',
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        <StarIcon sx={{ color: '#00AF87', fontSize: '1.25rem' }} />
                        <Typography variant="body2">TripAdvisor</Typography>
                      </MuiLink>
                    )}
                    {airline.wikipedia_url && (
                      <MuiLink
                        href={airline.wikipedia_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          color: 'text.primary',
                          textDecoration: 'none',
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        <LanguageIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                        <Typography variant="body2">Wikipedia</Typography>
                      </MuiLink>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Box>
      )}

      {/* Server-side FAQ Section for SEO */}
      <FAQServerSection
        pageType="airline-route"
        pageSlug={routeSlug}
      />

      {/* Interactive Q&A Section */}
      <Box sx={{ my: 6 }}>
        <QASection
          pageType="airline-route"
          pageSlug={routeSlug}
          pageUrl={`/airlines/${code.toLowerCase()}/${routeSlug}`}
        />
      </Box>

      {/* Related Pages */}
      <RelatedPages
        routes={relatedRoutes}
        airports={relatedAirports}
        airlines={otherAirlines}
        maxRoutes={6}
        maxAirports={2}
        maxAirlines={6}
      />
    </Container>
  );
}

