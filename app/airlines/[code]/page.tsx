import { Metadata } from 'next';
import { Container, Typography, Box, Grid, Paper, List, ListItem, ListItemText, Avatar, Chip, Divider, Link as MuiLink } from '@mui/material';
import { getAirline, getAirlineRoutes } from '@/lib/queries';
import { generateMetadata as genMeta, generateBreadcrumbList, generateAirlineSchema } from '@/lib/seo';
import { getRelatedAirports, formatRouteAnchor, formatAirportAnchor, getRelatedAirlinesByCountry } from '@/lib/linking';
import RelatedPages from '@/components/ui/RelatedPages';
import { generateAirlineFAQs } from '@/lib/faqGenerators';
import { stripHtml } from '@/lib/utils/html';
import { getAirlineLogoUrl } from '@/lib/imagekit';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import StatCard from '@/components/ui/StatCard';
import AnswerSummary from '@/components/ui/AnswerSummary';
import ReliabilityScore from '@/components/ui/ReliabilityScore';
import FactBlock from '@/components/ui/FactBlock';
import EeatSignals from '@/components/ui/EeatSignals';
import DataTransparency from '@/components/ui/DataTransparency';
import FlightIcon from '@mui/icons-material/Flight';
import Link from 'next/link';
import PageViewTracker from '@/components/analytics/PageViewTracker';
import QASection from '@/components/faq/QASectionLazy';
import FAQServerSection from '@/components/faq/FAQServerSection';
import { findFAQsByPage } from '@/lib/faqs';
import { generateFAQPageSchema } from '@/lib/seo';
import LanguageIcon from '@mui/icons-material/Language';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import StarIcon from '@mui/icons-material/Star';
import BusinessIcon from '@mui/icons-material/Business';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import SafetyCheckIcon from '@mui/icons-material/SafetyCheck';
import LuggageIcon from '@mui/icons-material/Luggage';
import { optimizeTitle, optimizeDescription } from '@/lib/metadata-utils';

interface PageProps {
  params: {
    code: string;
  };
}

export const revalidate = 86400; // ISR: 24 hours

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const code = params.code.toUpperCase();
  const airline = await getAirline(code);
  
  const title = airline
    ? optimizeTitle(`${airline.name} (${code}) - Airline Information & Routes`)
    : `${code} Airline`;
  
  const description = airline
    ? optimizeDescription(`Complete information about ${airline.name} (${code}). View routes, destinations, flight schedules, fleet information, ratings, and contact details.`)
    : `View airline information and routes for ${code}.`;

  return genMeta({
    title,
    description,
    canonical: `/airlines/${code.toLowerCase()}`,
  });
}

export default async function AirlinePage({ params }: PageProps) {
  const code = params.code.toUpperCase();
  const airline = await getAirline(code);
  const routes = await getAirlineRoutes(code);

  if (!airline) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Airline {code} Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The airline code {code} could not be found in our database.
        </Typography>
      </Container>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://triposia.com';
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Home', url: siteUrl },
    { name: 'Airlines', url: `${siteUrl}/airlines` },
    { name: airline.name, url: `${siteUrl}/airlines/${code.toLowerCase()}` },
  ]);

  const airlineSchema = generateAirlineSchema(code, airline.name, airline.country);

  // Fetch user-submitted FAQs for SEO
  const userFAQs = await findFAQsByPage('airline', code.toLowerCase(), {
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
        `Frequently Asked Questions about ${airline.name}`
      )
    : null;

  // Calculate reliability based on route count
  const reliability: 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited' = 
    routes.length >= 50 ? 'Very Stable' :
    routes.length >= 20 ? 'Moderate' :
    routes.length >= 5 ? 'Seasonal' : 'Limited';

  // Get hub airports and popular routes for linking
  const hubAirportsArray = await getRelatedAirports(
    routes.map(r => r.origin_iata),
    [],
    6
  );
  const popularRoutes = routes.slice(0, 8).map(r => ({ ...r, shouldIndex: r.has_flight_data }));
  
  // Get related airlines from same country
  const relatedAirlines = airline.country 
    ? await getRelatedAirlinesByCountry(airline.country, code, 6)
    : [];

  // Generate comprehensive answer-first summary
  let answerSummary = `${airline.name}${airline.short_name ? ` (${airline.short_name})` : ''} (${code})`;
  if (airline.country) answerSummary += ` is based in ${airline.country}`;
  if (airline.city && airline.state) answerSummary += `, ${airline.city}, ${airline.state}`;
  answerSummary += `. `;
  
  if (routes.length > 0) {
    answerSummary += `Operates flights to ${routes.length} destination${routes.length !== 1 ? 's' : ''}. `;
  }
  
  if (airline.fleet_size || airline.total_aircrafts) {
    const fleetSize = airline.fleet_size || airline.total_aircrafts || 0;
    answerSummary += `Fleet size: ${fleetSize} aircraft${fleetSize !== 1 ? 's' : ''}. `;
  }
  
  if (airline.average_fleet_age) {
    answerSummary += `Average fleet age: ${airline.average_fleet_age} years. `;
  }
  
  if (airline.rating_skytrax_stars) {
    answerSummary += `Skytrax rating: ${airline.rating_skytrax_stars} star${airline.rating_skytrax_stars !== 1 ? 's' : ''}. `;
  }
  
  if (airline.reliability_score) {
    answerSummary += `Reliability score: ${airline.reliability_score}/10.`;
  }

  // Generate FAQs
  const faqs = generateAirlineFAQs(airline, routes, code);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageViewTracker
        pageType="airline"
        entityPrimary={code}
      />
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Airlines', href: '/airlines' },
          { label: airline.name, href: `/airlines/${code.toLowerCase()}` },
        ]}
      />
      
      <JsonLd data={breadcrumbData} />
      <JsonLd data={airlineSchema} />
      {userFAQSchema && <JsonLd data={userFAQSchema} />}

      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            src={getAirlineLogoUrl(airline.iata || code)}
            alt={airline.name}
            variant="rounded"
            sx={{ width: 80, height: 80 }}
          >
            {code}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h1" gutterBottom sx={{ textAlign: 'left', mb: 0.5, fontSize: { xs: '1.75rem', sm: '2.5rem' } }}>
              {airline.name}
              {airline.short_name && airline.short_name !== airline.name && (
                <Typography component="span" variant="h4" color="text.secondary" sx={{ ml: 1, fontSize: '1.25rem' }}>
                  ({airline.short_name})
                </Typography>
              )}
      </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Chip label={`IATA: ${airline.iata || code}`} size="small" variant="outlined" />
              {airline.icao && <Chip label={`ICAO: ${airline.icao}`} size="small" variant="outlined" />}
              {airline.is_passenger && <Chip label="Passenger" size="small" color="primary" />}
              {airline.is_cargo && <Chip label="Cargo" size="small" color="secondary" />}
              {airline.is_scheduled && <Chip label="Scheduled" size="small" />}
              {airline.domestic && <Chip label="Domestic" size="small" />}
            </Box>
          </Box>
        </Box>

      <AnswerSummary>
        {answerSummary}
      </AnswerSummary>
      </Box>

      {/* Overview Section */}
      {airline.overview && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
            About {airline.name}
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ lineHeight: 1.8, textAlign: 'left' }}>
              {airline.overview}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Key Statistics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Destinations"
            value={routes.length}
            subtitle="Routes operated"
            icon={<FlightIcon />}
          />
        </Grid>
        {(airline.fleet_size || airline.total_aircrafts) && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Fleet Size"
              value={airline.fleet_size || airline.total_aircrafts || 0}
              subtitle="Total aircraft"
              icon={<AirplanemodeActiveIcon />}
            />
          </Grid>
        )}
        {airline.average_fleet_age && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Fleet Age"
              value={`${airline.average_fleet_age} years`}
              subtitle="Average age"
            />
          </Grid>
        )}
        {airline.rating_skytrax_stars && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Skytrax Rating"
              value={`${airline.rating_skytrax_stars}/5`}
              subtitle={`${airline.rating_skytrax_reviews || 0} reviews`}
              icon={<StarIcon />}
            />
          </Grid>
        )}
        {airline.reliability_score && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Reliability Score"
              value={`${airline.reliability_score}/10`}
              subtitle="Performance rating"
            />
          </Grid>
        )}
        {airline.country && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Country"
              value={airline.country}
              subtitle="Base country"
              icon={<LocationOnIcon />}
            />
          </Grid>
        )}
        {airline.class_count && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Cabin Classes"
              value={airline.class_count}
              subtitle="Service classes"
            />
          </Grid>
        )}
        {airline.found && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Founded"
              value={airline.found.toString()}
              subtitle="Year established"
              icon={<BusinessIcon />}
            />
          </Grid>
        )}
      </Grid>

      {/* Safety & Ratings Section */}
      {(airline.accidents_last_5y !== undefined || airline.crashes_last_5y !== undefined || airline.rating_tripadvisor || airline.rating_skytrax_stars) && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
            Safety & Ratings
          </Typography>
          <Grid container spacing={2}>
            {airline.rating_skytrax_stars && (
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <StarIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {airline.rating_skytrax_stars}/5
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Skytrax Rating
                  </Typography>
                  {airline.rating_skytrax_reviews && (
                    <Typography variant="caption" color="text.secondary">
                      {airline.rating_skytrax_reviews} reviews
                    </Typography>
                  )}
                </Paper>
              </Grid>
            )}
            {airline.rating_tripadvisor && (
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <StarIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {airline.rating_tripadvisor}/5
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tripadvisor Rating
                  </Typography>
                </Paper>
              </Grid>
            )}
            {airline.accidents_last_5y !== undefined && (
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <SafetyCheckIcon sx={{ fontSize: 40, color: airline.accidents_last_5y === 0 ? 'success.main' : 'warning.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {airline.accidents_last_5y}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accidents (Last 5 Years)
                  </Typography>
                </Paper>
              </Grid>
            )}
            {airline.crashes_last_5y !== undefined && (
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <SafetyCheckIcon sx={{ fontSize: 40, color: airline.crashes_last_5y === 0 ? 'success.main' : 'error.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {airline.crashes_last_5y}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crashes (Last 5 Years)
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      <ReliabilityScore
        level={reliability}
        description={airline.punctuality_summary || (reliability === 'Very Stable' 
          ? 'Extensive route network with consistent service'
          : reliability === 'Moderate'
          ? 'Moderate route network with regular service'
          : reliability === 'Seasonal'
          ? 'Limited route network with seasonal variations'
          : 'Small route network')}
      />

      {/* Airlines Contact Information and Customer Services */}
      {(airline.address || airline.phone || airline.website || airline.city || airline.state || 
        airline.instagram_url || airline.twitter_url || airline.youtube_url || airline.tripadvisor_url || 
        airline.wikipedia_url || (airline as any).facebook_url || (airline as any).linkedin_url) && (
        <Box sx={{ mb: 4 }}>
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

      {/* Social Media & External Links */}
      {(airline.instagram_url || airline.twitter_url || airline.youtube_url || airline.tripadvisor_url || airline.wikipedia_url) && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
            Social Media & Resources
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {airline.website && (
                <MuiLink
                  href={airline.website.startsWith('http') ? airline.website : `https://${airline.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
                >
                  <LanguageIcon /> Official Website
                </MuiLink>
              )}
              {airline.instagram_url && (
                <MuiLink
                  href={airline.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
                >
                  <InstagramIcon /> Instagram
                </MuiLink>
              )}
              {airline.twitter_url && (
                <MuiLink
                  href={airline.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
                >
                  <TwitterIcon /> Twitter
                </MuiLink>
              )}
              {airline.youtube_url && (
                <MuiLink
                  href={airline.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
                >
                  <YouTubeIcon /> YouTube
                </MuiLink>
              )}
              {airline.tripadvisor_url && (
                <MuiLink
                  href={airline.tripadvisor_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
                >
                  <StarIcon /> Tripadvisor
                </MuiLink>
              )}
              {airline.wikipedia_url && (
                <MuiLink
                  href={airline.wikipedia_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
                >
                  <LanguageIcon /> Wikipedia
                </MuiLink>
              )}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Hub Airports */}
      {airline.hubs && airline.hubs.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
            Hub Airports
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {airline.hubs.map((hub, idx) => (
                <Chip
                  key={idx}
                  label={hub}
                  component={Link}
                  href={`/airports/${hub.toLowerCase()}`}
                  clickable
                  sx={{ textDecoration: 'none' }}
                />
              ))}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Fleet Information */}
      {(airline.fleet_overview && airline.fleet_overview.length > 0) || airline.classes ? (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
            Fleet & Services
          </Typography>
          <Grid container spacing={2}>
            {airline.fleet_overview && airline.fleet_overview.length > 0 && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h3" gutterBottom sx={{ fontSize: '1.25rem', mb: 2, textAlign: 'left' }}>
                    Fleet Overview
                  </Typography>
                  <List dense>
                    {airline.fleet_overview.map((aircraft, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={aircraft.type}
                          secondary={`${aircraft.count} aircraft`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            )}
            {airline.classes && airline.classes.length > 0 && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h3" gutterBottom sx={{ fontSize: '1.25rem', mb: 2, textAlign: 'left' }}>
                    Cabin Classes
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {airline.classes.map((className, idx) => (
                      <Chip key={idx} label={className} />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      ) : null}

      {/* Baggage Information */}
      {(airline.baggage_allowance_domestic || airline.baggage_allowance_international || airline.baggage) && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
            Baggage Information
          </Typography>
          <Grid container spacing={2}>
            {airline.baggage_allowance_domestic && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LuggageIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h3" sx={{ fontSize: '1.25rem', textAlign: 'left' }}>
                    Domestic Flights
                  </Typography>
                  </Box>
                  <Typography variant="body1">{airline.baggage_allowance_domestic}</Typography>
                </Paper>
              </Grid>
            )}
            {airline.baggage_allowance_international && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LuggageIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h3" sx={{ fontSize: '1.25rem', textAlign: 'left' }}>
                    International Flights
                  </Typography>
                  </Box>
                  <Typography variant="body1">{airline.baggage_allowance_international}</Typography>
                </Paper>
              </Grid>
            )}
            {airline.baggage && !airline.baggage_allowance_domestic && !airline.baggage_allowance_international && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LuggageIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h3" sx={{ fontSize: '1.25rem', textAlign: 'left' }}>
                      Baggage Policy
                    </Typography>
                  </Box>
                  <Typography variant="body1">{airline.baggage}</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Check-in Information */}
      {airline.check_in && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
            Check-in Information
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ lineHeight: 1.8, textAlign: 'left' }}>
              {airline.check_in}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Cancellation & Flexibility */}
      {airline.cancellation_flexibility && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
            Cancellation & Flexibility
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ lineHeight: 1.8, textAlign: 'left' }}>
              {airline.cancellation_flexibility}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Customer Reviews */}
      {airline.review_sentiment && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2, textAlign: 'left' }}>
            Customer Sentiment
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ lineHeight: 1.8, textAlign: 'left' }}>
              {airline.review_sentiment}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Comprehensive Airline Information */}
      <FactBlock
        title="Airline Details"
        facts={[
          { label: 'Airline Code', value: code },
          { label: 'IATA Code', value: airline.iata || code },
          ...(airline.icao ? [{ label: 'ICAO Code', value: airline.icao }] : []),
          { label: 'Destinations', value: routes.length },
          ...(airline.country ? [{ label: 'Country', value: airline.country }] : []),
          ...(airline.city ? [{ label: 'City', value: airline.city }] : []),
          ...(airline.state ? [{ label: 'State', value: airline.state }] : []),
          ...(airline.fleet_size ? [{ label: 'Fleet Size', value: airline.fleet_size.toString() }] : []),
          ...(airline.total_aircrafts ? [{ label: 'Total Aircraft', value: airline.total_aircrafts.toString() }] : []),
          ...(airline.average_fleet_age ? [{ label: 'Avg Fleet Age', value: `${airline.average_fleet_age} years` }] : []),
          ...(airline.found ? [{ label: 'Founded', value: airline.found.toString() }] : []),
          ...(airline.class_count ? [{ label: 'Cabin Classes', value: airline.class_count.toString() }] : []),
          ...(airline.reliability_score ? [{ label: 'Reliability Score', value: `${airline.reliability_score}/10` }] : []),
        ]}
        columns={3}
      />

      {/* Routes Section */}
      {routes.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 2, textAlign: 'left' }}>
            Routes Operated by {airline.name}
          </Typography>
          <Paper sx={{ p: 2 }}>
            <List>
              {routes.map((route) => (
                <ListItem
                  key={`${route.origin_iata}-${route.destination_iata}`}
                  component={Link}
                  href={`/airlines/${code.toLowerCase()}/${route.origin_iata.toLowerCase()}-${route.destination_iata.toLowerCase()}`}
                  sx={{ textDecoration: 'none', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemText
                    primary={`${route.origin_iata} → ${route.destination_iata} (${route.destination_city})`}
                    secondary={`${route.flights_per_day}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}

      {/* Internal Links Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', mb: 2, textAlign: 'left' }}>
          Related Information
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Hub Airports */}
            {hubAirportsArray.length > 0 && (
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  Major hub airports:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {hubAirportsArray.filter(a => a.shouldIndex).map((airport, idx) => (
                    <span key={airport.iata}>
                      <Link href={`/airports/${airport.iata.toLowerCase()}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                        {formatAirportAnchor(airport.iata, undefined, idx)}
                      </Link>
                      {idx < hubAirportsArray.filter(a => a.shouldIndex).length - 1 ? ' • ' : ''}
                    </span>
                  ))}
                </Typography>
              </Box>
            )}

            {/* Popular Routes */}
            {popularRoutes.length > 0 && (
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  Popular routes:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {popularRoutes.map((route, idx) => (
                    <span key={`${route.origin_iata}-${route.destination_iata}`}>
                      <Link 
                        href={`/flights/${route.origin_iata.toLowerCase()}-${route.destination_iata.toLowerCase()}`} 
                        style={{ color: 'inherit', textDecoration: 'underline' }}
                      >
                        {formatRouteAnchor(route, idx)}
                      </Link>
                      {idx < popularRoutes.length - 1 ? ' • ' : ''}
                    </span>
                  ))}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

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
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {faq.answer}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      )}

      {/* Server-side FAQ Section for SEO */}
      <FAQServerSection
        pageType="airline"
        pageSlug={code.toLowerCase()}
      />

      {/* Interactive Q&A Section */}
      <QASection
        pageType="airline"
        pageSlug={code.toLowerCase()}
        pageUrl={`/airlines/${code.toLowerCase()}`}
      />

      {/* Related Pages */}
      <RelatedPages
        routes={popularRoutes}
        airports={hubAirportsArray.map(a => ({ iata: a.iata, shouldIndex: a.shouldIndex }))}
        airlines={relatedAirlines}
        maxRoutes={8}
        maxAirports={6}
        maxAirlines={6}
      />

      <DataTransparency lastUpdated={new Date()} dataSource="Airline data from official sources, flight schedules, and verified airline information" />
    </Container>
  );
}
