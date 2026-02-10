import { Container, Typography, Box, Grid, Avatar, Paper, Divider, Chip } from '@mui/material';
import { Metadata } from 'next';
import { getAirportSummary, getRoutesFromAirport, getDepartures, getArrivals, getPoisByAirport, getAllAirlines, getAirportDetails, getTerminalPhones, getAirline, getWeatherByAirport, getBookingInsightsByAirport, getPriceTrendsByAirport, getApoisByAirport } from '@/lib/queries';
import { generateMetadata as genMeta, generateBreadcrumbList, generateAirportSchema } from '@/lib/seo';
import { getDomesticInternationalSplit } from '@/lib/insights';
import { shouldIndexAirport } from '@/lib/indexing';
import { evaluateAirportPageQuality } from '@/lib/pageQuality';
import { getRelatedRoutes, getRelatedAirlines, getRelatedBlogs, formatRouteAnchor, formatAirlineAnchor, formatBlogAnchor, LINK_LIMITS } from '@/lib/linking';
import RelatedPages from '@/components/ui/RelatedPages';
import { generateAirportFAQs } from '@/lib/faqGenerators';
import { stripHtml } from '@/lib/utils/html';
import { getAirportImageUrl } from '@/lib/imagekit';
import { formatAirportName } from '@/lib/formatting';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import StatCard from '@/components/ui/StatCard';
import PoiSection from '@/components/poi/PoiSection';
import AirportMap from '@/components/maps/AirportMap';
import AirportTabs from '@/components/airport/AirportTabs';
import WeatherSection from '@/components/travel/WeatherSection';
import AirportOperationsOverview from '@/components/airports/AirportOperationsOverview';
import { getEditorialPage, shouldUseOldModel } from '@/lib/editorialPages';
import BookingInsightsSection from '@/components/travel/BookingInsightsSection';
import PriceTrendsSection from '@/components/travel/PriceTrendsSection';
import Link from 'next/link';
import LanguageIcon from '@mui/icons-material/Language';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightIcon from '@mui/icons-material/Flight';
import InfoIcon from '@mui/icons-material/Info';
import PageViewTracker from '@/components/analytics/PageViewTracker';
import QASection from '@/components/faq/QASectionLazy';
import FAQServerSection from '@/components/faq/FAQServerSection';
import { findFAQsByPage } from '@/lib/faqs';
import { generateFAQPageSchema } from '@/lib/seo';

interface PageProps {
  params: {
    iata: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const iata = params.iata.toUpperCase();
  const airport = await getAirportSummary(iata);
  const flights = await getDepartures(iata, 50);
  
  const indexingCheck = shouldIndexAirport(airport, flights);
  
  const qualityCheck = airport 
    ? evaluateAirportPageQuality({
        airport,
        flights,
        routesFrom: [],
        pois: [],
        terminals: airport.terminals,
      })
    : { indexable: false, missingDataPoints: [] };
  
  const finalShouldIndex = indexingCheck.shouldIndex && qualityCheck.indexable;
  
  // Format airport name for metadata
  const airportDisplayMeta = airport ? await formatAirportName(iata, airport) : iata;
  
  const title = airport
    ? `${airportDisplayMeta} - Flight Information & Statistics`
    : `${iata} Airport`;
  
  const description = airport
    ? `Comprehensive information about ${airportDisplayMeta}. ${airport.destinations_count} destinations, ${airport.departure_count} daily departures, ${airport.arrival_count} daily arrivals. Find flight schedules, terminal information, and airport facilities.`
    : `Flight information and statistics for ${iata} Airport.`;

  return genMeta({
    title,
    description,
    canonical: `/airports/${iata.toLowerCase()}`,
    noindex: !finalShouldIndex,
  });
}

export default async function AirportPage({ params }: PageProps) {
  const iata = params.iata.toUpperCase();
  const airport = await getAirportSummary(iata);
  const airportDetails = await getAirportDetails(iata);
  const routesFrom = await getRoutesFromAirport(iata);
  const departures = await getDepartures(iata, 100);
  const arrivals = await getArrivals(iata, 100);
  const pois = await getPoisByAirport(iata, 6);
  const apois = await getApoisByAirport(iata, 6);
  const terminalPhones = await getTerminalPhones(iata);
  
  // Fetch travel decision data
  const weather = await getWeatherByAirport(iata);
  const bookingInsights = await getBookingInsightsByAirport(iata);
  const priceTrends = await getPriceTrendsByAirport(iata);
  
  // Format airport name with city
  const airportDisplay = await formatAirportName(iata, airport);
  
  // Get unique airlines from departures and arrivals
  const allAirlineCodes = Array.from(new Set([
    ...departures.map(f => f.airline_iata).filter(Boolean),
    ...arrivals.map(f => f.airline_iata).filter(Boolean),
  ]));
  
  // Get airline details and group flights by airline
  const airlinesWithFlights = await Promise.all(
    allAirlineCodes.map(async (airlineCode) => {
      const airline = await getAirline(airlineCode);
      const airlineDepartures = departures.filter(f => f.airline_iata === airlineCode);
      const airlineArrivals = arrivals.filter(f => f.airline_iata === airlineCode);
      return {
        code: airlineCode,
        name: airline?.name || airlineCode,
        iata: airline?.iata || airlineCode,
        departures: airlineDepartures,
        arrivals: airlineArrivals,
        totalFlights: airlineDepartures.length + airlineArrivals.length,
      };
    })
  );
  
  // Sort airlines by total flights
  airlinesWithFlights.sort((a, b) => b.totalFlights - a.totalFlights);

  if (!airport) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Airport {iata} Not Found
        </Typography>
      </Container>
    );
  }

  const indexingCheck = shouldIndexAirport(airport, departures);
  const qualityCheck = evaluateAirportPageQuality({
    airport,
    flights: departures,
    routesFrom,
    pois,
    terminals: airport.terminals,
  });
  
  const finalShouldIndex = indexingCheck.shouldIndex && qualityCheck.indexable;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://triposia.com';
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Home', url: siteUrl },
    { name: 'Airports', url: `${siteUrl}/airports` },
    { name: airportDisplay, url: `${siteUrl}/airports/${iata.toLowerCase()}` },
  ]);

  const airportSchema = generateAirportSchema(iata, `${iata} Airport`, airport.city, airport.country);

  // Fetch user-submitted FAQs for SEO
  const userFAQs = await findFAQsByPage('airport', iata.toLowerCase(), {
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
        `Frequently Asked Questions about ${iata} Airport`
      )
    : null;
  const domesticIntl = getDomesticInternationalSplit(airport, routesFrom);
  
  // Get related routes, airlines, and blogs for linking (with limits)
  const topRoutes = await getRelatedRoutes(iata, LINK_LIMITS.airport.routes);
  const airlineCodes = Array.from(new Set(departures.map(f => f.airline_iata).filter(Boolean)));
  const relatedAirlines = await getRelatedAirlines(airlineCodes, LINK_LIMITS.airport.airlines);
  const relatedBlogs = await getRelatedBlogs('airport', iata, LINK_LIMITS.airport.blogs);
  const faqs = await generateAirportFAQs(airport, departures, arrivals, routesFrom.length);

  // Check if page exists in pages_editorial collection
  const slug = `airports/${iata.toLowerCase()}`;
  const editorialPage = await getEditorialPage(slug);
  const useOldModel = await shouldUseOldModel(slug);

  // Get top destinations with coordinates for the map
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageViewTracker
        pageType="airport"
        entityPrimary={iata}
        additionalParams={{
          ...(airport.country && { country: airport.country }),
        }}
      />
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Airports', href: '/airports' },
            { label: airportDisplay, href: `/airports/${iata.toLowerCase()}` },
        ]}
      />
      
      <JsonLd data={breadcrumbData} />
      <JsonLd data={airportSchema} />
      {userFAQSchema && <JsonLd data={userFAQSchema} />}

      {/* 1. Airport Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            src={getAirportImageUrl(iata)}
            alt={iata}
            variant="rounded"
            sx={{ width: 64, height: 64 }}
          >
            {iata}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h1" gutterBottom sx={{ textAlign: 'left', mb: 0.5, fontSize: { xs: '1.75rem', sm: '2.5rem' } }}>
              {airportDetails?.name || airport.name || airportDisplay}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'left', mb: 1 }}>
              {airportDisplay}
              {airportDetails?.state && `, ${airportDetails.state}`}
              {airport.country && `, ${airport.country}`}
              </Typography>
            {airportDetails?.icao && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                <Chip label={`IATA: ${iata}`} size="small" variant="outlined" />
                <Chip label={`ICAO: ${airportDetails.icao}`} size="small" variant="outlined" />
                {airportDetails.timezone && (
                  <Chip label={`Timezone: ${airportDetails.timezone}`} size="small" variant="outlined" />
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Conditional rendering: Old model if in pages_editorial, else new operational overview */}
      {useOldModel ? (
        <>
          {/* Airport Description - Only show if in editorial or airport has description */}
          {(editorialPage?.description || airportDetails?.description) && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, maxWidth: '900px', textAlign: 'left' }}>
                {editorialPage?.description || airportDetails?.description}
              </Typography>
            </Box>
          )}
        </>
      ) : (
        <AirportOperationsOverview
          airportName={airportDetails?.name || airport.name || airportDisplay}
          iata={iata}
          destinationCount={airport.destinations_count}
          airlineCount={airlinesWithFlights.length}
          peakHours={airport.peak_departure_hours}
          isPrimarilyDomestic={domesticIntl.domestic > domesticIntl.international}
        />
      )}

      {/* 2. Airport Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Destinations" value={airport.destinations_count} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Daily Departures" value={airport.departure_count} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Daily Arrivals" value={airport.arrival_count} />
        </Grid>
        {(domesticIntl.domestic > 0 || domesticIntl.international > 0) && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Route Split" 
              value={`${domesticIntl.domestic}D / ${domesticIntl.international}I`} 
            />
          </Grid>
        )}
      </Grid>

      {/* 3. Tabs (Departures/Arrivals/Airlines) */}
      <AirportTabs 
        departures={departures} 
        arrivals={arrivals}
        airlines={airlinesWithFlights}
        airportDisplay={airportDisplay}
      />
      
      {/* Terminal Information Section */}
      {(airport.terminals && airport.terminals.length > 0) || (terminalPhones && terminalPhones.length > 0) ? (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 3, textAlign: 'left' }}>
            Terminal Information
          </Typography>
          <Paper sx={{ p: 3 }}>
            {airport.terminals && airport.terminals.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h3" gutterBottom sx={{ fontSize: '1.25rem', mb: 2, textAlign: 'left' }}>
                  Terminals
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {airport.terminals.map((terminal, idx) => (
                    <Box key={idx}>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Terminal {terminal.name}
                      </Typography>
                      {terminal.airlines && terminal.airlines.length > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          Airlines: {terminal.airlines.join(', ')}
                        </Typography>
                      )}
                      {terminalPhones && terminalPhones.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {terminalPhones
                            .filter(tp => tp.terminal_name === terminal.name)
                            .map((tp, tpIdx) => (
                              <Box key={tpIdx} sx={{ mt: 1 }}>
                                {tp.phone_number && (
                                  <Typography variant="body2" color="text.secondary">
                                    • Phone: {tp.phone_number}
                                  </Typography>
                                )}
                                {tp.help_desk_phone && (
                                  <Typography variant="body2" color="text.secondary">
                                    • Help Desk: {tp.help_desk_phone}
                                    {tp.help_desk_hours && ` (${tp.help_desk_hours})`}
                                  </Typography>
                                )}
                                {tp.terminal_location && (
                                  <Typography variant="body2" color="text.secondary">
                                    • Location: {tp.terminal_location}
                                  </Typography>
                                )}
                              </Box>
                            ))}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            
            {terminalPhones && terminalPhones.length > 0 && (
              <Box>
                <Typography variant="h3" gutterBottom sx={{ fontSize: '1.25rem', mb: 2, textAlign: 'left' }}>
                  Terminal Contact Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {terminalPhones.map((terminal, idx) => (
                    <Box key={idx} sx={{ pb: 1.5, borderBottom: idx < terminalPhones.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                      {terminal.terminal_name && (
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {terminal.airline_name ? `${terminal.airline_name} - ` : ''}Terminal {terminal.terminal_name}
                        </Typography>
                      )}
                      {terminal.phone_number && (
                        <Typography variant="body2" color="text.secondary">
                          • Phone: {terminal.phone_number}
                        </Typography>
                      )}
                      {terminal.help_desk_phone && (
                        <Typography variant="body2" color="text.secondary">
                          • Help Desk: {terminal.help_desk_phone}
                          {terminal.help_desk_hours && ` (${terminal.help_desk_hours})`}
                        </Typography>
                      )}
                      {terminal.terminal_location && (
                        <Typography variant="body2" color="text.secondary">
                          • Location: {terminal.terminal_location}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      ) : null}

      {/* 4. Airport Information Section */}
      {airportDetails && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 3, textAlign: 'left' }}>
            Airport Information
          </Typography>
          <Grid container spacing={3}>
            {/* Contact Information */}
            {(airportDetails.phone || airportDetails.email || airportDetails.website || airportDetails.address) && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h3" gutterBottom sx={{ fontSize: '1.25rem', mb: 2, textAlign: 'left' }}>
                    Contact Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {airportDetails.address && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <LocationOnIcon sx={{ color: 'primary.main', mt: 0.5, flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary">
                          {airportDetails.address}
                        </Typography>
                      </Box>
                    )}
                    {airportDetails.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon sx={{ color: 'primary.main', flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary">
                          {airportDetails.phone}
                        </Typography>
                      </Box>
                    )}
                    {airportDetails.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon sx={{ color: 'primary.main', flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary">
                          {airportDetails.email}
                        </Typography>
                      </Box>
                    )}
                    {airportDetails.website && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LanguageIcon sx={{ color: 'primary.main', flexShrink: 0 }} />
                        <Typography variant="body2">
                          <Link 
                            href={airportDetails.website.startsWith('http') ? airportDetails.website : `https://${airportDetails.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'inherit', textDecoration: 'underline' }}
                          >
                            {airportDetails.website.replace(/^https?:\/\//, '')}
                          </Link>
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            )}

            {/* Airport Details */}
            {(airportDetails.elevation || airportDetails.timezone || airportDetails.facilities || airportDetails.parking || airportDetails.ground_transportation) && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h3" gutterBottom sx={{ fontSize: '1.25rem', mb: 2, textAlign: 'left' }}>
                    Airport Details
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {airportDetails.elevation && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Elevation:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {airportDetails.elevation} {typeof airportDetails.elevation === 'number' && airportDetails.elevation < 1000 ? 'ft' : ''}
                        </Typography>
                      </Box>
                    )}
                    {airportDetails.timezone && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Timezone:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {airportDetails.timezone}
                        </Typography>
                      </Box>
                    )}
                    {airportDetails.facilities && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Facilities:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {Array.isArray(airportDetails.facilities) 
                            ? airportDetails.facilities.join(', ')
                            : airportDetails.facilities
                          }
                        </Typography>
                      </Box>
                    )}
                    {airportDetails.parking && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Parking:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {airportDetails.parking}
                        </Typography>
                      </Box>
                    )}
                    {airportDetails.ground_transportation && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Ground Transportation:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {airportDetails.ground_transportation}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* 5. Weather Section */}
      {weather && (
        <WeatherSection weather={weather} airportName={airportDisplay} />
      )}

      {/* 6. Booking Insights */}
      {bookingInsights && (
        <BookingInsightsSection insights={bookingInsights} airportName={airportDisplay} />
      )}

      {/* 7. Price Trends */}
      {priceTrends && (
        <PriceTrendsSection trends={priceTrends} airportName={airportDisplay} />
      )}

      {/* 8. POIs Near Airport (from apois collection) */}
      {apois.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 3, textAlign: 'left' }}>
            Things to Do Near {iata} Airport
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

      {/* 9. Legacy POIs (if apois is empty, fallback to pois) */}
      {apois.length === 0 && pois.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <PoiSection pois={pois} title="Places Near Airport" />
        </Box>
      )}

      {/* Map (Supporting element, below main content and POIs) */}
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

      {/* Airlines Operating from This Airport */}
      {airlinesWithFlights.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: '1.75rem', mb: 2, textAlign: 'left' }}>
            Airlines Operating from {airportDisplay}
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={2}>
              {airlinesWithFlights.slice(0, 6).map((airline) => {
                const airlineCode = (airline.iata || airline.code || '').toLowerCase();
                const airlineAirportUrl = `/airlines/${airlineCode}/${iata.toLowerCase()}`;
                return (
                  <Grid item xs={12} sm={6} md={4} key={airline.code}>
                    <Paper
                      component={Link}
                      href={airlineAirportUrl}
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
                        <FlightTakeoffIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {airline.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {airline.totalFlights} flight{airline.totalFlights !== 1 ? 's' : ''} • {airline.departures.length} departure{airline.departures.length !== 1 ? 's' : ''} • {airline.arrivals.length} arrival{airline.arrivals.length !== 1 ? 's' : ''}
                      </Typography>
                      <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                        View {airline.name} flights from {airportDisplay} →
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Box>
      )}

      {/* View All Flights from This Airport */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: '1.75rem', mb: 2, textAlign: 'left' }}>
          View All Flights from {airportDisplay}
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Complete Flight Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View all flights, destinations, and routes from {airportDisplay}. Includes flight schedules, departures, arrivals, and destination information.
              </Typography>
            </Box>
            <Link
              href={`/flights/${iata.toLowerCase()}`}
              style={{ textDecoration: 'none' }}
            >
              <Chip
                label={`View All Flights from ${airportDisplay}`}
                clickable
                icon={<FlightIcon sx={{ fontSize: 16 }} />}
                sx={{
                  fontSize: '1rem',
                  py: 2.5,
                  px: 2,
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                  },
                }}
              />
            </Link>
          </Box>
        </Paper>
      </Box>

      {/* Related Pages */}
      <RelatedPages
        routes={topRoutes.filter(r => r.shouldIndex).slice(0, LINK_LIMITS.airport.routes)}
        airlines={relatedAirlines.slice(0, LINK_LIMITS.airport.airlines)}
        maxRoutes={LINK_LIMITS.airport.routes}
        maxAirports={0}
        maxAirlines={LINK_LIMITS.airport.airlines}
      />

      {/* FAQ Section */}
      {faqs.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h2" gutterBottom sx={{ fontSize: '1.75rem', mb: 2, textAlign: 'left' }}>
              Frequently Asked Questions
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

      {/* Q&A Section */}
      {/* Server-side FAQ Section for SEO */}
      <FAQServerSection
        pageType="airport"
        pageSlug={iata.toLowerCase()}
      />

      {/* Interactive Q&A Section */}
      <QASection
        pageType="airport"
        pageSlug={iata.toLowerCase()}
        pageUrl={`/airports/${iata.toLowerCase()}`}
      />
    </Container>
  );
}
