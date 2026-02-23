import { Container, Typography, Box, Grid, Paper, Chip } from '@mui/material';
import { 
  getAirline, 
  getAirportsByCountry, 
  getAirportSummary,
  getAirlineRoutes,
  getFlightsByRoute,
  getRouteWithMetadata
} from '@/lib/queries';
import { generateBreadcrumbList, generateAirlineSchema, generateFAQPageSchema, generateAirportSchema } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/layout/BreadcrumbsLazy';
import FlightTable from '@/components/ui/FlightTableLazy';
import StatCard from '@/components/ui/StatCard';
import { getSiteUrl } from '@/lib/company';
import Link from 'next/link';
import FlightIcon from '@mui/icons-material/Flight';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { formatAirportDisplay } from '@/lib/formatting';
import { formatDistance } from '@/lib/routeUtils';
import PageViewTracker from '@/components/analytics/PageViewTracker';
import QASection from '@/components/faq/QASectionLazy';
import FAQServerSection from '@/components/faq/FAQServerSection';
import { generateAirlineCountryFAQs } from '@/lib/faqGenerators';

interface AirlineCountryPageContentProps {
  airlineCode: string;
  countrySlug: string;
  matchingCountry: string;
  code: string;
}

export default async function AirlineCountryPageContent({
  airlineCode,
  countrySlug,
  matchingCountry,
  code,
}: AirlineCountryPageContentProps) {
  // Get airline
  const airline = await getAirline(airlineCode);
  if (!airline) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Airline Not Found
        </Typography>
      </Container>
    );
  }

  // Get all airports by country
  const airportsByCountry = await getAirportsByCountry();
  const countryAirports = airportsByCountry[matchingCountry];
  const countryAirportIatas = countryAirports.map(a => a.iata_from).filter(Boolean);

  if (countryAirportIatas.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          No Airports Found in {matchingCountry}
        </Typography>
      </Container>
    );
  }

  // Get all airline routes
  const airlineRoutes = await getAirlineRoutes(airlineCode);
  
  // Filter routes where destination is in the target country
  const routesToCountry = airlineRoutes.filter(route => 
    countryAirportIatas.includes(route.destination_iata?.toUpperCase())
  );

  if (routesToCountry.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Airlines', href: '/airlines' },
            { label: airline.name, href: `/airlines/${code.toLowerCase()}` },
            { label: `${airline.name} ${matchingCountry}`, href: `/airlines/${code.toLowerCase()}/${countrySlug}` },
          ]}
        />
        <Typography variant="h4" gutterBottom>
          {airline.name} Flights to {matchingCountry}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Currently, {airline.name} does not have any scheduled flights to {matchingCountry} in our database.
        </Typography>
      </Container>
    );
  }

  // Get flights for each route (limit to 50 for performance)
  const flightsData = await Promise.all(
    routesToCountry.slice(0, 50).map(async (route) => {
      try {
        const flights = await getFlightsByRoute(route.origin_iata, route.destination_iata);
        const airlineFlights = flights.filter(f => 
          f.airline_iata?.toUpperCase() === airlineCode.toUpperCase()
        );
        return {
          route,
          flights: airlineFlights,
        };
      } catch (error) {
        console.error(`Error fetching flights for ${route.origin_iata}-${route.destination_iata}:`, error);
        return { route, flights: [] };
      }
    })
  );

  // Flatten all flights
  const allFlights = flightsData.flatMap(data => data.flights);

  // Get route metadata for insights (limit to 20 for performance)
  const routesWithMetadata = await Promise.all(
    routesToCountry.slice(0, 20).map(async (route) => {
      try {
        const routeMetadata = await getRouteWithMetadata(route.origin_iata, route.destination_iata);
        const originAirport = await getAirportSummary(route.origin_iata);
        const destinationAirport = await getAirportSummary(route.destination_iata);
        return {
          route,
          metadata: routeMetadata,
          originAirport,
          destinationAirport,
        };
      } catch (error) {
        return { route, metadata: null, originAirport: null, destinationAirport: null };
      }
    })
  );

  // Calculate statistics
  const totalRoutes = routesToCountry.length;
  const totalFlights = allFlights.length;
  const weeklyFlights = totalFlights * 7; // Approximate
  const monthlyFlights = weeklyFlights * 4; // Approximate

  // Get unique destination airports in country
  const destinationAirports = routesWithMetadata
    .map(r => r.destinationAirport)
    .filter(Boolean);

  // Generate FAQs
  const faqs = generateAirlineCountryFAQs(airline.name, matchingCountry, totalRoutes, weeklyFlights);

  // Generate JSON-LD schemas
  const siteUrl = getSiteUrl();
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Home', url: siteUrl },
    { name: 'Airlines', url: `${siteUrl}/airlines` },
    { name: airline.name, url: `${siteUrl}/airlines/${code.toLowerCase()}` },
    { name: `${airline.name} ${matchingCountry}`, url: `${siteUrl}/airlines/${code.toLowerCase()}/${countrySlug}` },
  ]);

  const airlineSchema = generateAirlineSchema(airlineCode, airline.name, airline.country);
  
  // Airport schemas for destinations
  const airportSchemas = destinationAirports.slice(0, 10).map(airport => 
    airport ? generateAirportSchema(airport.iata_from, airport.city || '', airport.country || '') : null
  ).filter(Boolean);

  // Flight list schema
  const flightListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${airline.name} Flights to ${matchingCountry}`,
    description: `List of ${airline.name} flight routes to ${matchingCountry}`,
    numberOfItems: totalRoutes,
    itemListElement: routesToCountry.slice(0, 20).map((route, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Flight',
        flightNumber: route.destination_iata,
        airline: {
          '@type': 'Airline',
          name: airline.name,
          iataCode: airlineCode,
        },
        departureAirport: {
          '@type': 'Airport',
          iataCode: route.origin_iata,
        },
        arrivalAirport: {
          '@type': 'Airport',
          iataCode: route.destination_iata,
        },
      },
    })),
  };

  // FAQ schema
  const faqSchema = generateFAQPageSchema(faqs);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageViewTracker
        pageType="airline_country"
        entityPrimary={airlineCode}
        entitySecondary={matchingCountry}
      />
      
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Airlines', href: '/airlines' },
          { label: airline.name, href: `/airlines/${code.toLowerCase()}` },
          { label: `${airline.name} ${matchingCountry}`, href: `/airlines/${code.toLowerCase()}/${countrySlug}` },
        ]}
      />

      <JsonLd data={breadcrumbData} />
      <JsonLd data={airlineSchema} />
      {airportSchemas.map((schema, idx) => schema && <JsonLd key={idx} data={schema} />)}
      <JsonLd data={flightListSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      {/* Hero Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem' }, fontWeight: 700 }}>
          {airline.name} Flights to {matchingCountry}
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', color: 'text.secondary', mb: 3 }}>
          Discover {airline.name} flight routes, schedules, and frequencies to destinations in {matchingCountry}. 
          Find the best flights for your travel needs.
        </Typography>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <StatCard
              icon={<FlightIcon />}
              title="Total Routes"
              value={totalRoutes.toString()}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              icon={<ScheduleIcon />}
              title="Weekly Flights"
              value={weeklyFlights.toLocaleString()}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              icon={<ScheduleIcon />}
              title="Monthly Flights"
              value={monthlyFlights.toLocaleString()}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              icon={<LocationOnIcon />}
              title="Destinations"
              value={destinationAirports.length.toString()}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Routes List */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 3 }}>
          Flight Routes to {matchingCountry}
        </Typography>
        <Grid container spacing={2}>
          {routesToCountry.slice(0, 30).map((route) => {
            const routeData = routesWithMetadata.find(r => 
              r.route.origin_iata === route.origin_iata && 
              r.route.destination_iata === route.destination_iata
            );
            const routeFlights = flightsData.find(d => 
              d.route.origin_iata === route.origin_iata && 
              d.route.destination_iata === route.destination_iata
            )?.flights || [];
            const originDisplay = routeData?.originAirport 
              ? formatAirportDisplay(route.origin_iata, routeData.originAirport.city || '')
              : route.origin_iata;
            const destinationDisplay = routeData?.destinationAirport
              ? formatAirportDisplay(route.destination_iata, routeData.destinationAirport.city || '')
              : route.destination_iata;
            const distance = routeData?.metadata?.distance_km;
            const flightsPerWeek = routeFlights.length * 7;

            return (
              <Grid item xs={12} sm={6} md={4} key={`${route.origin_iata}-${route.destination_iata}`}>
                <Paper
                  component={Link}
                  href={`/airlines/${code.toLowerCase()}/${route.origin_iata.toLowerCase()}-${route.destination_iata.toLowerCase()}`}
                  sx={{
                    p: 3,
                    textDecoration: 'none',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      boxShadow: 3,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FlightIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {route.origin_iata} → {route.destination_iata}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {originDisplay} to {destinationDisplay}
                  </Typography>
                  {route.flights_per_day && (
                    <Chip 
                      label={`${route.flights_per_day} flights/day`} 
                      size="small" 
                      color="primary" 
                      sx={{ mb: 1, alignSelf: 'flex-start' }}
                    />
                  )}
                  {flightsPerWeek > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      ~{flightsPerWeek} flights/week
                    </Typography>
                  )}
                  {distance && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto', pt: 1 }}>
                      Distance: {formatDistance(distance)}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Flights Table */}
      {allFlights.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 3 }}>
            Flight Schedules
          </Typography>
          <FlightTable
            flights={allFlights.slice(0, 100) as any}
            showOrigin={true}
            showDestination={true}
          />
        </Box>
      )}

      {/* FAQs */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 3 }}>
          Frequently Asked Questions
        </Typography>
        <QASection
          pageType="airline"
          pageSlug={`${airlineCode.toLowerCase()}/${countrySlug}`}
          pageUrl={`/airlines/${airlineCode.toLowerCase()}/country/${countrySlug}`}
        />
      </Box>
    </Container>
  );
}
