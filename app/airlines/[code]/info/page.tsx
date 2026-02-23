import { Metadata } from 'next';
import { Container, Typography, Box, Grid, Paper, Divider, Link as MuiLink, Chip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { getAirline, getAirlineRoutes, getAirlineBySlug } from '@/lib/queries';
import { generateMetadata as genMeta, generateBreadcrumbList, generateAirlineSchema, generateFAQPageSchema } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import PageViewTracker from '@/components/analytics/PageViewTracker';
import QASection from '@/components/faq/QASectionLazy';
import { generateAirlineInfoFAQs } from '@/lib/faqGenerators';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FlightIcon from '@mui/icons-material/Flight';
import BusinessIcon from '@mui/icons-material/Business';
import LuggageIcon from '@mui/icons-material/Luggage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StarIcon from '@mui/icons-material/Star';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import RelatedPages from '@/components/ui/RelatedPages';
import { getRelatedAirlinesByCountry, getRelatedAirlines } from '@/lib/linking';
import { getAllAirlines } from '@/lib/queries';

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const { airline, code: airlineCode } = await getAirlineBySlug(code);

  if (!airline || !airlineCode) {
    return genMeta({
      title: 'Airline Not Found',
      description: 'Airline information not found',
      noindex: true,
    });
  }

  // Generate keyword variations for customer service
  const airlineName = airline.name;
  const airlineNameLower = airlineName.toLowerCase();
  const airlineNameShort = airline.short_name || airlineName;
  
  // Customer service keywords (replace "delta" with airline name)
  const customerServiceKeywords = [
    `${airlineNameLower} airline customer service`,
    `${airlineNameLower} airline customer service number`,
    `${airlineName} customer service phone number`,
    `${airlineNameLower} customer service phone number`,
    `${airlineName} phone number`,
    `${airlineNameLower} customer service number`,
    `${airlineName} customer service`,
    `${airlineName} customer service number`,
    `${airlineName} phone number`,
    `${airlineNameLower} customer service`,
  ];

  const title = `${airlineName} Customer Service & Contact Information | ${airlineName} Customer Service Phone Number`;
  const description = `${airlineName} customer service phone number: ${airline.phone || 'Contact information available'}. Complete ${airlineNameLower} customer service information including ${airlineNameLower} customer service number, ${airlineName} phone number, baggage policies, check-in procedures, and more.`;

  return genMeta({
    title,
    description,
    canonical: `/airlines/${airlineCode.toLowerCase()}/info`,
    keywords: customerServiceKeywords,
  });
}

export default async function AirlineInfoPage({ params }: PageProps) {
  const { code } = await params;
  const { airline, code: airlineCode } = await getAirlineBySlug(code);

  if (!airline || !airlineCode) {
    notFound();
  }

  // Redirect to canonical URL if accessed via name slug
  const canonicalCode = airlineCode.toLowerCase();
  if (code.toLowerCase() !== canonicalCode) {
    // This will be handled by Next.js redirect
    const { redirect } = await import('next/navigation');
    redirect(`/airlines/${canonicalCode}/info`);
  }

  const routes = await getAirlineRoutes(airlineCode);

  // Get related data for interlinking
  const topRoutes = routes
    .filter(r => r.has_flight_data)
    .slice(0, 8)
    .map(r => ({ ...r, shouldIndex: true }));

  // Get hub airports from airline data
  const hubAirports: Array<{ iata: string; city?: string; name?: string; shouldIndex: boolean }> = [];
  if (airline.hubs && airline.hubs.length > 0) {
    hubAirports.push(...airline.hubs.slice(0, 5).map(iata => ({
      iata: iata.toUpperCase(),
      shouldIndex: true,
    })));
  }

  // Get related airlines (same country)
  const relatedAirlines = airline.country
    ? await getRelatedAirlinesByCountry(airline.country, airlineCode, 6)
    : [];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://triposia.com';
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Home', url: siteUrl },
    { name: 'Airlines', url: `${siteUrl}/airlines` },
    { name: airline.name, url: `${siteUrl}/airlines/${airlineCode.toLowerCase()}` },
    { name: 'Customer Service', url: `${siteUrl}/airlines/${airlineCode.toLowerCase()}/info` },
  ]);

  // Generate JSON-LD schemas
  const airlineSchema = generateAirlineSchema(airlineCode, airline.name, airline.country);
  
  // Organization schema with contact details
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: airline.name,
    alternateName: airline.short_name,
    identifier: airline.iata || airline.code,
    legalName: airline.name,
    url: airline.website,
    telephone: airline.phone,
    address: airline.address || airline.city || airline.state || airline.country ? {
      '@type': 'PostalAddress',
      streetAddress: airline.address,
      addressLocality: airline.city,
      addressRegion: airline.state,
      addressCountry: airline.country,
      postalCode: airline.zipcode,
    } : undefined,
    sameAs: [
      airline.instagram_url,
      airline.twitter_url,
      airline.youtube_url,
      airline.tripadvisor_url,
      airline.wikipedia_url,
    ].filter(Boolean),
  };

  // Generate FAQs
  const faqs = generateAirlineInfoFAQs(airline, routes.length);
  const faqSchema = generateFAQPageSchema(faqs);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageViewTracker
        pageType="airline_info"
        entityPrimary={airlineCode}
      />
      
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Airlines', href: '/airlines' },
          { label: airline.name, href: `/airlines/${airlineCode.toLowerCase()}` },
          { label: 'Customer Service', href: `/airlines/${airlineCode.toLowerCase()}/info` },
        ]}
      />

      <JsonLd data={breadcrumbData} />
      <JsonLd data={airlineSchema} />
      <JsonLd data={organizationSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      {/* Hero Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }, fontWeight: 700 }}>
          {airline.name} Customer Service & Contact Information
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', color: 'text.secondary', mb: 2 }}>
          {airline.name} customer service phone number: {airline.phone || 'Contact information available'}. Find {airline.name.toLowerCase()} customer service number, {airline.name} phone number, and complete {airline.name.toLowerCase()} customer service information including contact details, baggage policies, and more.
        </Typography>
        {airline.phone && (
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, color: 'primary.main', mb: 3 }}>
            {airline.name} Customer Service Number: {airline.phone}
          </Typography>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
              {airline.name} Customer Service Contact Information
            </Typography>
            <List>
              {airline.phone && (
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${airline.name} Customer Service Phone Number`}
                    secondary={
                      <Box>
                        <MuiLink href={`tel:${airline.phone}`} color="primary" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                          {airline.phone}
                        </MuiLink>
                        <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                          {airline.name.toLowerCase()} customer service number
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              )}
              {airline.website && (
                <ListItem>
                  <ListItemIcon>
                    <LanguageIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Website"
                    secondary={
                      <MuiLink href={airline.website} target="_blank" rel="noopener noreferrer" color="primary">
                        {airline.website}
                      </MuiLink>
                    }
                  />
                </ListItem>
              )}
              {(airline.address || airline.city || airline.state || airline.country) && (
                <ListItem>
                  <ListItemIcon>
                    <LocationOnIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Address"
                    secondary={
                      <Box>
                        {airline.address && <Typography variant="body2">{airline.address}</Typography>}
                        {(airline.city || airline.state || airline.country) && (
                          <Typography variant="body2">
                            {[airline.city, airline.state, airline.country].filter(Boolean).join(', ')}
                            {airline.zipcode && ` ${airline.zipcode}`}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              )}
            </List>

            {/* Social Media Links */}
            {(airline.instagram_url || airline.twitter_url || airline.youtube_url || airline.tripadvisor_url) && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 1 }}>
                  Social Media
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {airline.instagram_url && (
                    <Chip
                      label="Instagram"
                      component="a"
                      href={airline.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      clickable
                      size="small"
                    />
                  )}
                  {airline.twitter_url && (
                    <Chip
                      label="Twitter"
                      component="a"
                      href={airline.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      clickable
                      size="small"
                    />
                  )}
                  {airline.youtube_url && (
                    <Chip
                      label="YouTube"
                      component="a"
                      href={airline.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      clickable
                      size="small"
                    />
                  )}
                  {airline.tripadvisor_url && (
                    <Chip
                      label="TripAdvisor"
                      component="a"
                      href={airline.tripadvisor_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      clickable
                      size="small"
                    />
                  )}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Airline Overview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
              Airline Overview
            </Typography>
            <List>
              {airline.iata && (
                <ListItem>
                  <ListItemIcon>
                    <FlightIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="IATA Code"
                    secondary={airline.iata}
                  />
                </ListItem>
              )}
              {airline.icao && (
                <ListItem>
                  <ListItemIcon>
                    <FlightIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="ICAO Code"
                    secondary={airline.icao}
                  />
                </ListItem>
              )}
              {airline.country && (
                <ListItem>
                  <ListItemIcon>
                    <LocationOnIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Country"
                    secondary={airline.country}
                  />
                </ListItem>
              )}
              {routes.length > 0 && (
                <ListItem>
                  <ListItemIcon>
                    <BusinessIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Routes"
                    secondary={`${routes.length} route${routes.length !== 1 ? 's' : ''}`}
                  />
                </ListItem>
              )}
              {airline.hubs && airline.hubs.length > 0 && (
                <ListItem>
                  <ListItemIcon>
                    <LocationOnIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Hubs"
                    secondary={airline.hubs.join(', ')}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Fleet Information */}
        {(airline.fleet_size || airline.total_aircrafts || airline.fleet_overview || airline.average_fleet_age) && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
                Fleet Information
              </Typography>
              <List>
                {(airline.fleet_size || airline.total_aircrafts) && (
                  <ListItem>
                    <ListItemIcon>
                      <FlightIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Fleet Size"
                      secondary={airline.fleet_size || airline.total_aircrafts || 'N/A'}
                    />
                  </ListItem>
                )}
                {airline.average_fleet_age && (
                  <ListItem>
                    <ListItemIcon>
                      <ScheduleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Average Fleet Age"
                      secondary={`${airline.average_fleet_age} years`}
                    />
                  </ListItem>
                )}
                {airline.fleet_overview && airline.fleet_overview.length > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <BusinessIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Fleet Composition"
                      secondary={
                        <Box>
                          {airline.fleet_overview.map((aircraft, idx) => (
                            <Typography key={idx} variant="body2">
                              {aircraft.type}: {aircraft.count} aircraft
                            </Typography>
                          ))}
                        </Box>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        )}

        {/* Baggage & Policies */}
        {(airline.baggage || airline.baggage_allowance_domestic || airline.baggage_allowance_international || 
          airline.cancellation_flexibility || airline.check_in) && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
                Baggage & Policies
              </Typography>
              <List>
                {airline.baggage && (
                  <ListItem>
                    <ListItemIcon>
                      <LuggageIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Baggage Policy"
                      secondary={airline.baggage}
                    />
                  </ListItem>
                )}
                {airline.baggage_allowance_domestic && (
                  <ListItem>
                    <ListItemIcon>
                      <LuggageIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Domestic Baggage Allowance"
                      secondary={airline.baggage_allowance_domestic}
                    />
                  </ListItem>
                )}
                {airline.baggage_allowance_international && (
                  <ListItem>
                    <ListItemIcon>
                      <LuggageIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="International Baggage Allowance"
                      secondary={airline.baggage_allowance_international}
                    />
                  </ListItem>
                )}
                {airline.cancellation_flexibility && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Cancellation & Flexibility"
                      secondary={airline.cancellation_flexibility}
                    />
                  </ListItem>
                )}
                {airline.check_in && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Check-in Information"
                      secondary={airline.check_in}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        )}

        {/* Ratings & Reviews */}
        {(airline.rating_skytrax_stars || airline.rating_skytrax_reviews || airline.rating_tripadvisor || 
          airline.reliability_score || airline.punctuality_summary) && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
                Ratings & Performance
              </Typography>
              <List>
                {airline.rating_skytrax_stars && (
                  <ListItem>
                    <ListItemIcon>
                      <StarIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Skytrax Rating"
                      secondary={`${airline.rating_skytrax_stars} stars`}
                    />
                  </ListItem>
                )}
                {airline.rating_skytrax_reviews && (
                  <ListItem>
                    <ListItemIcon>
                      <StarIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Skytrax Reviews"
                      secondary={`${airline.rating_skytrax_reviews} reviews`}
                    />
                  </ListItem>
                )}
                {airline.rating_tripadvisor && (
                  <ListItem>
                    <ListItemIcon>
                      <StarIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="TripAdvisor Rating"
                      secondary={`${airline.rating_tripadvisor}/5`}
                    />
                  </ListItem>
                )}
                {airline.reliability_score && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Reliability Score"
                      secondary={`${airline.reliability_score}%`}
                    />
                  </ListItem>
                )}
                {airline.punctuality_summary && (
                  <ListItem>
                    <ListItemIcon>
                      <ScheduleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Punctuality"
                      secondary={airline.punctuality_summary}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        )}

        {/* Safety Information */}
        {(airline.accidents_last_5y !== undefined || airline.crashes_last_5y !== undefined) && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
                Safety Record (Last 5 Years)
              </Typography>
              <List>
                {airline.accidents_last_5y !== undefined && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Accidents"
                      secondary={airline.accidents_last_5y}
                    />
                  </ListItem>
                )}
                {airline.crashes_last_5y !== undefined && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Crashes"
                      secondary={airline.crashes_last_5y}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        )}

        {/* Service Classes */}
        {airline.classes && airline.classes.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
                Service Classes
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {airline.classes.map((serviceClass, idx) => (
                  <Chip key={idx} label={serviceClass} size="small" />
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Overview */}
        {airline.overview && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
                About {airline.name}
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {airline.overview}
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <Grid item xs={12}>
            <Box sx={{ mt: 4 }}>
              <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 3 }}>
                Frequently Asked Questions
              </Typography>
              <QASection 
                pageType="airline"
                pageSlug={airlineCode.toLowerCase()}
                pageUrl={`/airlines/${airlineCode.toLowerCase()}/info`}
              />
            </Box>
          </Grid>
        )}

        {/* Related Links Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
            <Typography variant="h3" gutterBottom sx={{ fontSize: '1.25rem', fontWeight: 600, mb: 2 }}>
              Related Information
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Link href={`/airlines/${airlineCode.toLowerCase()}`} passHref>
                <MuiLink color="primary" underline="hover" sx={{ fontWeight: 500 }}>
                  {airline.name} Routes & Flights
                </MuiLink>
              </Link>
              {routes.length > 0 && (
                <Link href={`/airlines/${airlineCode.toLowerCase()}`} passHref>
                  <MuiLink color="primary" underline="hover">
                    View All {routes.length} Routes
                  </MuiLink>
                </Link>
              )}
              {airline.country && (
                <Link href={`/airlines/${airlineCode.toLowerCase()}/country/${airline.country.toLowerCase().replace(/\s+/g, '-')}`} passHref>
                  <MuiLink color="primary" underline="hover">
                    {airline.name} in {airline.country}
                  </MuiLink>
                </Link>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Related Pages - Routes, Airports, Airlines */}
        {(topRoutes.length > 0 || hubAirports.length > 0 || relatedAirlines.length > 0) && (
          <Grid item xs={12}>
            <RelatedPages
              routes={topRoutes}
              airports={hubAirports}
              airlines={relatedAirlines}
              maxRoutes={8}
              maxAirports={5}
              maxAirlines={6}
            />
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
