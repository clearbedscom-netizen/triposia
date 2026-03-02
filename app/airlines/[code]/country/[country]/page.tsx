import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Container, Typography, Box, Grid, Paper, Chip, Divider, Link as MuiLink } from '@mui/material';
import { 
  getAirline, 
  getAirlineBySlug,
  getAirportsByCountry, 
  getAllAirports,
  getAirportSummary,
  getAirlineRoutes,
  getAirlineFlightsFromAirport,
  getFlightsByRoute,
  getRoute,
  getRouteWithMetadata
} from '@/lib/queries';
import { generateMetadata as genMeta, generateBreadcrumbList, generateAirlineSchema, generateFAQPageSchema, generateAirportSchema, generateAirlineLocalBusinessSchema } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/layout/BreadcrumbsLazy';
import FlightTable from '@/components/ui/FlightTableLazy';
import StatCard from '@/components/ui/StatCard';
import { getSiteUrl } from '@/lib/company';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import FlightIcon from '@mui/icons-material/Flight';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { formatAirportDisplay } from '@/lib/formatting';
import { calculateFlightsPerWeek, formatDistance } from '@/lib/routeUtils';
import PageViewTracker from '@/components/analytics/PageViewTracker';
import QASection from '@/components/faq/QASectionLazy';
import FAQServerSection from '@/components/faq/FAQServerSection';
import { findFAQsByPage } from '@/lib/faqs';
import { generateAirlineCountryFAQs } from '@/lib/faqGenerators';

// Lazy load client components
const RouteDataVisualizationLazy = dynamic(() => import('@/components/flights/RouteDataVisualizationLazy'), {
  ssr: false,
  loading: () => <Box sx={{ p: 3, textAlign: 'center' }}>Loading visualizations...</Box>,
});

const FilterableFlightsSectionLazy = dynamic(() => import('@/components/flights/FilterableFlightsSectionLazy'), {
  ssr: false,
  loading: () => <Box sx={{ p: 3, textAlign: 'center', minHeight: 200 }}>Loading flights...</Box>,
});

interface PageProps {
  params: Promise<{
    code: string;
    country: string;
  }>;
}

export const revalidate = 86400; // ISR: 24 hours

// Country name mapping (normalize country names from URL slugs to database names)
const COUNTRY_MAPPING: Record<string, string> = {
  'united-kingdom': 'United Kingdom',
  'uk': 'United Kingdom',
  'united-states': 'United States',
  'usa': 'United States',
  'united-arab-emirates': 'United Arab Emirates',
  'uae': 'United Arab Emirates',
  'dubai': 'United Arab Emirates',
  'trinidad-and-tobago': 'Trinidad and Tobago',
  'costa-rica': 'Costa Rica',
  'el-salvador': 'El Salvador',
  'hong-kong': 'Hong Kong',
  'new-zealand': 'New Zealand',
  'nz': 'New Zealand',
  'canada': 'Canada',
  'brazil': 'Brazil',
  'mexico': 'Mexico',
  'australia': 'Australia',
  'france': 'France',
  'germany': 'Germany',
  'italy': 'Italy',
  'spain': 'Spain',
  'japan': 'Japan',
  'china': 'China',
  'india': 'India',
};

function isAirlineNameSlug(codeParam: string): boolean {
  const s = (codeParam || '').trim();
  return s.length > 2 || s.includes('-');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code: codeParam, country } = await params;
  let airlineCode = codeParam.toUpperCase();
  if (isAirlineNameSlug(codeParam)) {
    const { code: resolvedCode } = await getAirlineBySlug(codeParam);
    if (resolvedCode) airlineCode = resolvedCode.toUpperCase();
  }
  const countryName = COUNTRY_MAPPING[country.toLowerCase()] || country.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  const airline = await getAirline(airlineCode);
  if (!airline) {
    return genMeta({
      title: 'Airline Not Found',
      description: 'Airline not found',
      noindex: true,
    });
  }

  const title = `${airline.name} ${countryName} - Flights, Destinations & Routes`;
  const description = `Discover ${airline.name} ${countryName} operations, including all destinations served, flight routes from and to ${countryName} airports, schedules, and frequencies. View departures and arrivals.`;

  return genMeta({
    title,
    description,
    canonical: `/airlines/${airlineCode.toLowerCase()}/country/${country.toLowerCase()}`,
    keywords: [`${airline.name} ${countryName}`, `${airline.name} flights`, `${countryName} flights`, 'flight schedules', 'airline routes'],
  });
}

export default async function AirlineCountryPage({ params }: PageProps) {
  const { code: codeParam, country } = await params;
  const countrySlug = country.toLowerCase();

  // If URL uses airline full name (e.g. /airlines/mauritania-airlines/country/...), redirect to IATA code
  if (isAirlineNameSlug(codeParam)) {
    const { redirect } = await import('next/navigation');
    const { code: resolvedCode } = await getAirlineBySlug(codeParam);
    if (resolvedCode) {
      redirect(`/airlines/${resolvedCode.toLowerCase()}/country/${countrySlug}`);
    }
  }

  const airlineCode = codeParam.toUpperCase();
  const code = airlineCode.toLowerCase(); // canonical code for URLs
  const countryName = COUNTRY_MAPPING[countrySlug] || country.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Get airline
  const airline = await getAirline(airlineCode);
  if (!airline) {
    notFound();
  }

  // Get all airports by country
  const airportsByCountry = await getAirportsByCountry();
  
  // Find matching country (case-insensitive, handle variations) - prioritize full names
  const countrySlugLower = countrySlug.toLowerCase().trim();
  const countryNameLower = countryName.toLowerCase().trim();
  
  // Get all available countries for debugging
  const availableCountries = Object.keys(airportsByCountry);
  console.log(`[Country Page] Searching for: "${countrySlug}" -> "${countryName}"`);
  console.log(`[Country Page] Available countries (first 10):`, availableCountries.slice(0, 10));
  
  // First try exact matches with the mapped country name (highest priority)
  let matchingCountry = Object.keys(airportsByCountry).find(
    c => {
      if (!c) return false;
      const cLower = c.toLowerCase().trim();
      const normalized = cLower.replace(/\s+/g, '-');
      
      // Direct exact matches (case-insensitive) - prioritize countryName
      if (cLower === countryNameLower) return true;
      if (normalized === countryNameLower.replace(/\s+/g, '-')) return true;
      if (cLower === countrySlugLower) return true;
      if (normalized === countrySlugLower) return true;
      
      return false;
    }
  );
  
  // If no exact match, try fuzzy matching but be more strict
  if (!matchingCountry) {
    matchingCountry = Object.keys(airportsByCountry).find(
      c => {
        if (!c) return false;
        const cLower = c.toLowerCase().trim();
        
        // Prefer matches that start with the country name
        if (cLower.startsWith(countryNameLower) || countryNameLower.startsWith(cLower)) {
          // Only if lengths are similar (within 3 characters for better matching)
          if (Math.abs(cLower.length - countryNameLower.length) <= 3) {
            return true;
          }
        }
        
        // Also check if country slug starts with country name or vice versa
        if (cLower.startsWith(countrySlugLower) || countrySlugLower.startsWith(cLower)) {
          // Only if lengths are similar (within 3 characters)
          if (Math.abs(cLower.length - countrySlugLower.length) <= 3) {
            return true;
          }
        }
        
        return false;
      }
    );
  }
  
  console.log(`[Country Page] Matched country: "${matchingCountry}"`);

  // Get database connection for direct queries
  const { getDatabase } = await import('@/lib/mongodb');
  const db = await getDatabase();
  
  let countryAirportIatas: string[] = [];
  let displayCountryName = matchingCountry || countryName;

  // If we found a matching country in airportsByCountry, use those airports
  if (matchingCountry && airportsByCountry[matchingCountry]) {
  const countryAirports = airportsByCountry[matchingCountry];
    countryAirportIatas = countryAirports.map(a => a.iata_from?.toUpperCase()).filter(Boolean);
  }

  // If no airports found with matchingCountry, try querying airports collection directly
  // This handles cases where country might be stored as "CA" instead of "Canada"
  if (countryAirportIatas.length === 0) {
    const airportsCollection = db.collection<any>('airports');
    const airportFinalCollection = db.collection<any>('airportfinal');
    
    // Try to find airports by country name variations
    const countryVariations = [
      matchingCountry,
      countryName,
      countrySlug,
      'CA', // Canada country code
      'CAN', // ISO code
    ];
    
    const airports = await airportsCollection
      .find({
        $or: [
          { country: { $in: countryVariations } },
          { country: new RegExp(`^${matchingCountry}$`, 'i') },
          { country: new RegExp(`^${countryName}$`, 'i') },
        ]
      })
      .limit(500)
      .toArray();
    
    // Also check airportfinal collection
    const airportFinals = await airportFinalCollection
      .find({
        $or: [
          { country: { $in: countryVariations } },
          { country: new RegExp(`^${matchingCountry}$`, 'i') },
          { country: new RegExp(`^${countryName}$`, 'i') },
        ]
      })
      .limit(500)
      .toArray();
    
    // Combine IATAs from both collections
    const iatasFromAirports = airports.map(a => a.iata_from?.toUpperCase()).filter(Boolean);
    const iatasFromFinal = airportFinals.map(a => a.iata?.toUpperCase()).filter(Boolean);
    countryAirportIatas = Array.from(new Set([...iatasFromAirports, ...iatasFromFinal]));
    
    // If we found airports via direct query, update displayCountryName
    if (countryAirportIatas.length > 0 && airports.length > 0) {
      displayCountryName = airports[0].country || countryName;
    }
    
    console.log(`[Country Page] Found ${countryAirportIatas.length} airports via direct query for "${displayCountryName}"`);
  }

  if (countryAirportIatas.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Airlines', href: '/airlines' },
            { label: airline.name, href: `/airlines/${code.toLowerCase()}` },
            { label: `${airline.name} ${displayCountryName}`, href: `/airlines/${code.toLowerCase()}/country/${country}` },
          ]}
        />
        <Typography variant="h4" gutterBottom>
          No Airports Found in {displayCountryName}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Currently, {airline.name} does not have any scheduled flights in {displayCountryName} in our database.
        </Typography>
      </Container>
    );
  }

  // Query database for Delta operations IN Canada (not just TO Canada)
  // This means: routes FROM Canadian airports AND routes TO Canadian airports
  const departuresCollection = db.collection<any>('departures');
  const arrivalsCollection = db.collection<any>('arrivals');
  const routesCollection = db.collection<any>('routes');
  
  console.log(`[Country Page] Querying for ${airlineCode} flights at ${countryAirportIatas.length} airports in ${displayCountryName}`);
  
  // Get all Delta departures FROM Canadian airports OR TO Canadian airports
  // Check both origin_iata and destination_iata
  const departuresFromCanada = await departuresCollection
    .find({ 
      airline_iata: airlineCode.toUpperCase(),
      $or: [
        { origin_iata: { $in: countryAirportIatas } },
        { destination_iata: { $in: countryAirportIatas } }
      ]
    })
    .limit(5000)
    .toArray();
  
  // Get all Delta arrivals TO Canadian airports OR FROM Canadian airports
  // Check both origin_iata and destination_iata
  const arrivalsToCanada = await arrivalsCollection
    .find({ 
      airline_iata: airlineCode.toUpperCase(),
      $or: [
        { origin_iata: { $in: countryAirportIatas } }, // In arrivals, origin_iata is the destination airport
        { destination_iata: { $in: countryAirportIatas } } // Also check destination_iata field
      ]
    })
    .limit(5000)
    .toArray();
  
  // Also check destinations collection for routes
  const destinationsCollection = db.collection<any>('destinations');
  const destinationsToCanada = await destinationsCollection
    .find({
      airline_iata: airlineCode.toUpperCase(),
      $or: [
        { origin_iata: { $in: countryAirportIatas } },
        { destination_iata: { $in: countryAirportIatas } }
      ]
    })
    .limit(5000)
    .toArray();
  
  // Aggregate unique routes FROM Canada (departures)
  const routesFromCanada = new Map<string, { 
    origin_iata: string; 
    destination_iata: string; 
    flight_count: number;
    origin_city?: string;
    destination_city?: string;
  }>();
  
  departuresFromCanada.forEach((flight) => {
    const origin = flight.origin_iata?.toUpperCase();
    const destination = flight.destination_iata?.toUpperCase();
    // Include routes where origin OR destination is in Canada
    if (origin && destination && (countryAirportIatas.includes(origin) || countryAirportIatas.includes(destination))) {
      const routeKey = `${origin}-${destination}`;
      const existing = routesFromCanada.get(routeKey);
      if (existing) {
        existing.flight_count++;
      } else {
        routesFromCanada.set(routeKey, {
          origin_iata: origin,
          destination_iata: destination,
          flight_count: 1,
        });
      }
    }
  });
  
  // Also process destinations collection
  destinationsToCanada.forEach((dest) => {
    const origin = dest.origin_iata?.toUpperCase();
    const destination = dest.destination_iata?.toUpperCase();
    if (origin && destination && (countryAirportIatas.includes(origin) || countryAirportIatas.includes(destination))) {
      const routeKey = `${origin}-${destination}`;
      const existing = routesFromCanada.get(routeKey);
      if (existing) {
        existing.flight_count++;
      } else {
        routesFromCanada.set(routeKey, {
          origin_iata: origin,
          destination_iata: destination,
          flight_count: 1,
        });
      }
    }
  });
  
  // Aggregate unique routes TO Canada (arrivals)
  const routesToCanada = new Map<string, { 
    origin_iata: string; 
    destination_iata: string; 
    flight_count: number;
    origin_city?: string;
    destination_city?: string;
  }>();
  
  arrivalsToCanada.forEach((flight) => {
    // In arrivals collection, check both origin_iata and destination_iata
    const origin = flight.source_iata || flight.departure_airport?.IATA || flight.origin_iata?.toUpperCase();
    const destination = flight.destination_iata?.toUpperCase() || flight.origin_iata?.toUpperCase(); // In arrivals, origin_iata can be the destination
    
    // Include routes where origin OR destination is in Canada
    if (origin && destination && (countryAirportIatas.includes(origin) || countryAirportIatas.includes(destination))) {
      const routeKey = `${origin}-${destination}`;
      const existing = routesToCanada.get(routeKey);
      if (existing) {
        existing.flight_count++;
      } else {
        routesToCanada.set(routeKey, {
          origin_iata: origin?.toUpperCase(),
          destination_iata: destination,
          flight_count: 1,
        });
      }
    }
  });
  
  // Combine all routes (from and to Canada)
  const allRoutesMap = new Map([...routesFromCanada, ...routesToCanada]);
  
  // Get route details from routes collection and enrich with airport info
  const routesToCountry = await Promise.all(
    Array.from(allRoutesMap.values()).map(async (routeInfo) => {
      const route = await routesCollection.findOne({
        origin_iata: routeInfo.origin_iata,
        destination_iata: routeInfo.destination_iata,
      });
      
      // Get airport summaries for city names
      const originAirport = await getAirportSummary(routeInfo.origin_iata);
      const destAirport = await getAirportSummary(routeInfo.destination_iata);
      
      return {
        _id: route?._id || routeInfo.origin_iata + '-' + routeInfo.destination_iata,
        origin_iata: routeInfo.origin_iata,
        destination_iata: routeInfo.destination_iata,
        origin_city: originAirport?.city || route?.origin_city || '',
        destination_city: destAirport?.city || route?.destination_city || '',
        flights_per_day: route?.flights_per_day || `${routeInfo.flight_count} flights`,
        has_flight_data: route?.has_flight_data || true,
        is_from_canada: countryAirportIatas.includes(routeInfo.origin_iata),
        is_to_canada: countryAirportIatas.includes(routeInfo.destination_iata),
      };
    })
  );
  
  // Filter to show only routes where at least one endpoint is in Canada
  const filteredRoutes = routesToCountry.filter(route => 
    route.is_from_canada || route.is_to_canada
  );

  // Get all Delta departures and arrivals at Canadian airports for statistics
  const allDeparturesFromCanada = departuresFromCanada.filter(f => 
    f.airline_iata?.toUpperCase() === airlineCode.toUpperCase()
  );
  const allArrivalsToCanada = arrivalsToCanada.filter(f => 
    f.airline_iata?.toUpperCase() === airlineCode.toUpperCase()
  );

  if (filteredRoutes.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Airlines', href: '/airlines' },
            { label: airline.name, href: `/airlines/${code.toLowerCase()}` },
            { label: `${airline.name} ${displayCountryName}`, href: `/airlines/${code.toLowerCase()}/country/${country}` },
          ]}
        />
        <Typography variant="h4" gutterBottom>
          {airline.name} Operations in {displayCountryName}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Currently, {airline.name} does not have any scheduled flights in {matchingCountry} in our database.
        </Typography>
      </Container>
    );
  }

  // Get flights for each route
  const flightsData = await Promise.all(
    filteredRoutes.slice(0, 50).map(async (route) => {
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

  // Get route metadata for insights
  const routesWithMetadata = await Promise.all(
    filteredRoutes.slice(0, 20).map(async (route) => {
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
  const totalRoutes = filteredRoutes.length;
  const totalDepartures = allDeparturesFromCanada.length;
  const totalArrivals = allArrivalsToCanada.length;
  const totalFlights = totalDepartures + totalArrivals;
  const weeklyFlights = totalFlights * 7; // Approximate
  const monthlyFlights = weeklyFlights * 4; // Approximate

  // Calculate unique destinations (airports in the country)
  const uniqueDestinationsInCountry = Array.from(new Set(
    filteredRoutes
      .filter(r => r.is_to_canada)
      .map(r => r.destination_iata)
  )).length;
  
  // Calculate unique origins in country
  const uniqueOriginsInCountry = Array.from(new Set(
    filteredRoutes
      .filter(r => r.is_from_canada)
      .map(r => r.origin_iata)
  )).length;
  
  // Total unique airports in country served by airline
  const totalDestinations = uniqueDestinationsInCountry + uniqueOriginsInCountry;

  // Get unique Canadian airports served by Delta (both origins and destinations)
  const canadianAirportsServed = Array.from(new Set([
    ...filteredRoutes.filter(r => r.is_from_canada).map(r => r.origin_iata),
    ...filteredRoutes.filter(r => r.is_to_canada).map(r => r.destination_iata),
  ]));

  // Get airport summaries for Canadian airports
  const canadianAirportSummaries = await Promise.all(
    canadianAirportsServed.map(iata => getAirportSummary(iata))
  );

  // Get unique origin airports (can be from anywhere, including Canada)
  const originAirports = Array.from(new Set(filteredRoutes.map(r => r.origin_iata)))
    .map(iata => routesWithMetadata.find(r => r.route.origin_iata === iata)?.originAirport)
    .filter(Boolean);

  // Get unique destination airports (can be anywhere, including Canada)
  const destinationAirports = routesWithMetadata
    .map(r => r.destinationAirport)
    .filter(Boolean);

  // Query airlines_country collection for airline address, phone, terminals, and airports
  // The collection has nested structure: airlines[].countries[]
  const airlinesCountryCollection = db.collection<any>('airlines_country');
  const allAirlinesCountryDocs = await airlinesCountryCollection.find({}).toArray();
  
  // Extract airline country info from nested structure
  let airlineCountryInfo: any[] = [];
  
  for (const doc of allAirlinesCountryDocs) {
    if (!doc.airlines || !Array.isArray(doc.airlines)) continue;
    
    // Find the airline matching our airline code
    const matchingAirline = doc.airlines.find((airline: any) => 
      airline.airline?.iata?.toUpperCase() === airlineCode.toUpperCase() ||
      airline.airline?.iata_code?.toUpperCase() === airlineCode.toUpperCase()
    );
    
    if (!matchingAirline || !matchingAirline.countries || !Array.isArray(matchingAirline.countries)) continue;
    
    // Find countries matching our country
    const countryVariations = [
      displayCountryName,
      countryName,
      countrySlug,
      matchingCountry,
    ].filter(Boolean);
    
    // Add country code variations for Canada
    if (displayCountryName.toLowerCase().includes('canada') || countrySlug.toLowerCase() === 'canada') {
      countryVariations.push('CA', 'CAN');
    }
    
    const matchingCountries = matchingAirline.countries.filter((country: any) => {
      const countryNameLower = (country.country || '').toLowerCase();
      const iso2 = (country.iso2 || '').toUpperCase();
      
      return countryVariations.some(variation => {
        if (!variation) return false;
        const varLower = variation.toLowerCase();
        return countryNameLower.includes(varLower) || 
               varLower.includes(countryNameLower) ||
               iso2 === varLower.toUpperCase() ||
               iso2 === 'CA' && varLower === 'canada';
      });
    });
    
    // Transform to flat structure for display and enrich with airport address data
    for (const country of matchingCountries) {
      let airportAddress = null;
      
      // Get airport address from airportfinal collection if airport IATA is available
      if (country.airport?.iata) {
        const airportFinalCollection = db.collection<any>('airportfinal');
        const airportData = await airportFinalCollection.findOne({
          iata: country.airport.iata.toUpperCase()
        });
        
        if (airportData) {
          airportAddress = {
            streetAddress: airportData.address || airportData.street_address || airportData.street,
            addressLocality: airportData.city || country.airport.name,
            addressRegion: airportData.state || airportData.region || airportData.province,
            postalCode: airportData.postal_code || airportData.zipcode || airportData.zip,
            addressCountry: airportData.country || country.country || country.iso2,
          };
        } else {
          // Fallback: use airport name and country as address
          airportAddress = {
            addressLocality: country.airport.name,
            addressCountry: country.country || country.iso2,
          };
        }
      }
      
      airlineCountryInfo.push({
        airline_name: matchingAirline.airline?.name || airline.name,
        airline_iata: matchingAirline.airline?.iata || airlineCode,
        country: country.country,
        country_code: country.iso2,
        calling_code: country.calling_code,
        phone: country.phone,
        phone_number: country.phone,
        airport: country.airport?.name,
        airport_iata: country.airport?.iata,
        terminal: country.airport?.terminal,
        terminals: country.airport?.terminal ? [country.airport.terminal] : [],
        address: country.address,
        airportAddress: airportAddress,
      });
    }
  }
  
  console.log(`[Country Page] Found ${airlineCountryInfo.length} airline country records for ${airlineCode} in ${displayCountryName}`);

  // Generate FAQs with factual data
  // Get airport names from summaries
  const canadianAirportNames = canadianAirportsServed
    .slice(0, 10)
    .map(iata => {
      const summary = canadianAirportSummaries.find(s => s?.iata_from === iata);
      if (summary) {
        const city = summary.city || '';
        const name = summary.name || iata;
        return city ? `${city} (${iata})` : `${name} (${iata})`;
      }
      return iata;
    })
    .filter(Boolean);
  
  const phoneNumber = airlineCountryInfo.length > 0 ? airlineCountryInfo[0].phone || airlineCountryInfo[0].phone_number : undefined;
  const airportInfo = airlineCountryInfo.map(info => ({
    airport: info.airport || '',
    airport_iata: info.airport_iata || '',
    terminal: info.terminal,
  }));
  
  const faqs = generateAirlineCountryFAQs(
    airline.name,
    displayCountryName,
    totalRoutes,
    weeklyFlights,
    totalDestinations,
    canadianAirportNames,
    phoneNumber,
    airportInfo
  );

  // Generate JSON-LD schemas
  const siteUrl = getSiteUrl();
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Home', url: siteUrl },
    { name: 'Airlines', url: `${siteUrl}/airlines` },
    { name: airline.name, url: `${siteUrl}/airlines/${code.toLowerCase()}` },
    { name: `${airline.name} ${displayCountryName}`, url: `${siteUrl}/airlines/${code.toLowerCase()}/country/${country}` },
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
    itemListElement: filteredRoutes.slice(0, 20).map((route, index) => ({
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
  
  // Generate LocalBusiness schemas for airline locations in country
  const localBusinessSchemas = airlineCountryInfo.map((info) => {
    return generateAirlineLocalBusinessSchema(
      info.airline_name || airline.name,
      info.airline_iata || airlineCode,
      info.airport || '',
      info.airport_iata || '',
      info.terminal,
      info.phone || info.phone_number,
      info.airportAddress || (info.address ? {
        addressLocality: info.airport || displayCountryName,
        addressCountry: info.country || displayCountryName,
      } : undefined),
      airline.website
    );
  });

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
          { label: `${airline.name} ${matchingCountry}`, href: `/airlines/${code.toLowerCase()}/country/${country}` },
        ]}
      />

      <JsonLd data={breadcrumbData} />
      <JsonLd data={airlineSchema} />
      {airportSchemas.map((schema, idx) => schema && <JsonLd key={idx} data={schema} />)}
      {localBusinessSchemas.map((schema, idx) => <JsonLd key={`local-business-${idx}`} data={schema} />)}
      <JsonLd data={flightListSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      {/* Hero Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem' }, fontWeight: 700 }}>
          {airline.name} {displayCountryName}
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, color: 'text.secondary', mb: 2, fontWeight: 500 }}>
          {totalRoutes} Routes • {totalDestinations} Destinations • {weeklyFlights.toLocaleString()} Weekly Flights
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', color: 'text.secondary', mb: 2 }}>
          {airline.name} operates {totalRoutes} routes to {totalDestinations} destinations in {displayCountryName}, 
          with approximately {weeklyFlights.toLocaleString()} flights per week. 
          Discover all {airline.name} {displayCountryName} flight routes, schedules, and frequencies.
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
              title="Canadian Airports"
              value={canadianAirportsServed.length.toString()}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Airline Presence in Country */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.50' }}>
        <Typography variant="h3" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2 }}>
          {airline.name} in {displayCountryName}
        </Typography>
        <Typography variant="body1" paragraph>
          {airline.name} operates flights from and to {canadianAirportsServed.length} airports across {displayCountryName}, 
          connecting cities with destinations worldwide. The airline serves major hubs, providing extensive connectivity for travelers.
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Link href={`/airlines/${code.toLowerCase()}`} passHref>
            <MuiLink color="primary" underline="hover" sx={{ fontWeight: 500 }}>
              {airline.name} Routes & Flights
            </MuiLink>
          </Link>
          <Link href={`/airlines/${code.toLowerCase()}/info`} passHref>
            <MuiLink color="primary" underline="hover" sx={{ fontWeight: 500 }}>
              {airline.name} Customer Service
            </MuiLink>
          </Link>
        </Box>
        
        {/* Display airline country information from airlines_country collection */}
        {airlineCountryInfo.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, mb: 2 }}>
              {airline.name} Contact Information in {displayCountryName}
            </Typography>
            {airlineCountryInfo.map((info, idx) => (
              <Box key={idx} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                {info.airport && (
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
                    {info.airport} {info.airport_iata && `(${info.airport_iata})`}
                  </Typography>
                )}
                {info.terminal && (
                  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                    <strong>Terminal:</strong> {info.terminal}
                  </Typography>
                )}
                {(info.phone || info.phone_number) && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Phone:</strong> <a href={`tel:${info.phone || info.phone_number}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {info.phone || info.phone_number}
                    </a>
                  </Typography>
                )}
                {info.calling_code && (
                  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                    <strong>Calling Code:</strong> {info.calling_code}
                  </Typography>
                )}
                {/* Display address information */}
                {(info.airportAddress || info.address) && (
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                      Address:
                    </Typography>
                    {info.airportAddress ? (
                      <Typography variant="body2" component="div" sx={{ color: 'text.secondary' }}>
                        {info.airportAddress.streetAddress && (
                          <Box component="span" display="block">{info.airportAddress.streetAddress}</Box>
                        )}
                        <Box component="span" display="block">
                          {[
                            info.airportAddress.addressLocality,
                            info.airportAddress.addressRegion,
                            info.airportAddress.postalCode
                          ].filter(Boolean).join(', ')}
                        </Box>
                        {info.airportAddress.addressCountry && (
                          <Box component="span" display="block">{info.airportAddress.addressCountry}</Box>
                        )}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {info.address}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          For customer service and reservations in {displayCountryName}, please contact {airline.name} directly or visit their website.
        </Typography>
      </Paper>

      {/* Routes List */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 3 }}>
          {airline.name} Routes in {displayCountryName}
        </Typography>
        <Grid container spacing={2}>
          {filteredRoutes.slice(0, 30).map((route) => {
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
          pageSlug={`${airlineCode.toLowerCase()}/${country}`}
          pageUrl={`/airlines/${airlineCode.toLowerCase()}/country/${country}`}
        />
      </Box>
    </Container>
  );
}
