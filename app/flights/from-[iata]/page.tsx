import { Metadata } from 'next';
import { Container, Typography, Box, Grid } from '@mui/material';
import { getAirportSummary, getFlightsFromAirport, getFlightsToAirport, getRoutesFromAirport } from '@/lib/queries';
import { generateMetadata as genMeta, generateBreadcrumbList } from '@/lib/seo';
import { formatAirportDisplay } from '@/lib/formatting';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import StatCard from '@/components/ui/StatCard';
import OpenStreetMap from '@/components/maps/OpenStreetMap';
import AirportFlightsTabs from '@/components/flights/AirportFlightsTabs';
import FlightIcon from '@mui/icons-material/Flight';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { getEditorialPage } from '@/lib/editorialPages';

interface PageProps {
  params: {
    iata: string;
  };
}

export const revalidate = 86400; // ISR: 24 hours

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const iata = params?.iata?.toUpperCase() || '';
  const airport = await getAirportSummary(iata);
  
  // Check for editorial page meta data
  const slug = `flights/from-${iata.toLowerCase()}`;
  const editorialPage = await getEditorialPage(slug);
  const metaTitle = editorialPage?.meta?.title || editorialPage?.metadata?.title;
  const metaDescription = editorialPage?.meta?.description || editorialPage?.metadata?.description;
  const focusKeywords = editorialPage?.meta?.focusKeywords;
  
  const title = metaTitle || (airport
    ? `All Flights from ${iata} Airport - Destinations, Departures & Arrivals`
    : `Flights from ${iata}`);
  
  const description = metaDescription || (airport
    ? `Complete flight information for ${iata} Airport: ${airport.destinations_count} destinations, ${airport.departure_count} daily departures, ${airport.arrival_count} daily arrivals.`
    : `View all flights from ${iata} Airport.`);

  return genMeta({
    title,
    description,
    canonical: `/flights/from-${iata.toLowerCase()}`,
    keywords: focusKeywords ? focusKeywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
  });
}

export default async function FlightsFromPage({ params }: PageProps) {
  const iata = params?.iata?.toUpperCase() || '';
  const airport = await getAirportSummary(iata);
  const departures = await getFlightsFromAirport(iata);
  const arrivals = await getFlightsToAirport(iata);
  const routesFrom = await getRoutesFromAirport(iata);

  if (!airport) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Airport {iata} Not Found
        </Typography>
      </Container>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://triposia.com';
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Home', url: siteUrl },
    { name: 'Flights', url: `${siteUrl}/flights` },
    { name: `Flights from ${iata}`, url: `${siteUrl}/flights/from-${iata.toLowerCase()}` },
  ]);

  // Create destinations list from routes
  const destinationsMap = new Map();
  routesFrom.forEach(route => {
    destinationsMap.set(route.destination_iata, {
      iata: route.destination_iata,
      city: route.destination_city,
      flights_per_day: route.flights_per_day,
    });
  });
  const destinations = Array.from(destinationsMap.values());

  const airportDisplay = formatAirportDisplay(iata, airport.city);
  const introText = `${airport.destinations_count} destinations, ${airport.departure_count} daily departures, and ${airport.arrival_count} daily arrivals from ${airportDisplay}.`;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Flights', href: '/flights' },
          { label: `Flights from ${airportDisplay}`, href: `/flights/from-${iata.toLowerCase()}` },
        ]}
      />
      
      <JsonLd data={breadcrumbData} />

      <Typography variant="h1" gutterBottom sx={{ textAlign: 'left' }}>
        All Flights from {airportDisplay}
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem', lineHeight: 1.8 }}>
        {introText}
      </Typography>

      {/* Summary Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Destinations"
            value={airport.destinations_count}
            subtitle="Cities served"
            icon={<LocationOnIcon sx={{ color: 'primary.main' }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Daily Departures"
            value={airport.departure_count}
            subtitle="Outbound flights"
            icon={<FlightIcon sx={{ color: 'primary.main' }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Daily Arrivals"
            value={airport.arrival_count}
            subtitle="Inbound flights"
            icon={<ScheduleIcon sx={{ color: 'primary.main' }} />}
          />
        </Grid>
      </Grid>

      {/* Tabs Component */}
      <AirportFlightsTabs
        iata={iata}
        city={airport.city}
        departures={departures}
        arrivals={arrivals}
        destinations={destinations}
      />

      {/* Map */}
      {airport.lat && airport.lng && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', mb: 2, textAlign: 'left' }}>
            Airport Location
          </Typography>
          <OpenStreetMap
            lat={airport.lat}
            lon={airport.lng}
            zoom={12}
            marker={true}
            markerLabel={`${iata} Airport${airport.city ? ` - ${airport.city}` : ''}`}
            title=""
            height={300}
          />
        </Box>
      )}
    </Container>
  );
}

