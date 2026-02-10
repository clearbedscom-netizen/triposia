import { Metadata } from 'next';
import { Container, Typography, Box, Paper, Grid, Chip, Avatar, Link as MuiLink, Divider } from '@mui/material';
import { generateMetadata as genMeta, generateBreadcrumbList, generatePersonSchema } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import Link from 'next/link';
import { COMPANY_INFO, getSiteUrl } from '@/lib/company';
import { fetchAuthors, fetchPosts } from '@/lib/contentApi';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import PublicIcon from '@mui/icons-material/Public';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import HikingIcon from '@mui/icons-material/Hiking';
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';
import ArticleIcon from '@mui/icons-material/Article';

export const metadata: Metadata = genMeta({
  title: `Our Team - ${COMPANY_INFO.name}`,
  description: 'Meet the travel experts and developers behind Triposia. Our team of adventure enthusiasts, travel experts, and developers are dedicated to providing travel information.',
  canonical: '/team',
});

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

interface TeamMember {
  name: string;
  role: string;
  title: string;
  bio: string;
  destinations: string[];
  activities: string[];
  location?: string;
  linkedin?: string;
  icon?: React.ReactNode;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Hayley Nash',
    role: 'Travel Expert',
    title: 'Customer Operations Team Leader',
    bio: "Adventure travel expert Hayley is a true wanderer at heart. Her passion lies in the enigmatic and diverse continent of South America, where she has ventured into the heart of Peru's ancient mysteries and hiked through the awe-inspiring landscapes of Patagonia. Her travels have taken her to far-flung corners of the world, from the lush jungles of Sri Lanka to the vibrant streets of Thailand, the rugged wilderness of Canada, and the sun-soaked coasts of Spain and Portugal. With an insatiable appetite for exploration and a wealth of firsthand experience, Hayley is your go-to expert for unforgettable adventures in some of the world's most extraordinary destinations.",
    destinations: ['Argentina', 'Chile', 'Italy', 'Peru'],
    activities: ['Culture', 'Walking & Trekking'],
    icon: <HikingIcon />,
  },
  {
    name: 'Emma Cambers',
    role: 'Travel Expert',
    title: 'Product Manager',
    bio: "Emma's love for travel was instilled in her from a first family holiday abroad at the age of 14. Since then, she has travelled the world and has been lucky enough to visit all seven continents. During her career in travel, Emma has spent many years focused on group and tailor-made travel to Latin America and has enjoyed research trips to destinations including the wildlife haven of the Pantanal, Chile's stunning Atacama Desert and the icy landscapes of Antarctica. She is one of Exodus' Product Managers for the Americas region, covering countries as diverse as Cuba (where she lived for a year during a languages degree), Brazil and Canada.",
    destinations: ['Brazil', 'Canada', 'Colombia', 'Costa Rica', 'Cuba', 'Mexico', 'USA'],
    activities: [],
    icon: <PublicIcon />,
  },
  {
    name: 'Danny Bell',
    role: 'Travel Expert',
    title: 'Product Manager',
    bio: "After a life at sea that took him around the world, sailing through wonders such as the fjords of Norway and Chile, Danny is now shoreside and, when not in the office, looking for his next big adventure. He's walked the Inca Trail to Machu Picchu and trekked areas such as Ladakh, Annapurna and the Southern Alps in New Zealand, but he's also a keen cyclist – choosing his next trip is always a dilemma between the saddle or hiking boots.",
    destinations: ['Italy', 'Madagascar', 'Nepal'],
    activities: ['Cycling', 'Walking & Trekking'],
    icon: <DirectionsBikeIcon />,
  },
  {
    name: 'Ashok Bhamla',
    role: 'Developer',
    title: 'Full Stack Developer',
    bio: 'My professional journey has taken me across many cities in India—through academic excellence and professional growth. I bring expertise in building scalable web applications and innovative solutions for the travel industry.',
    destinations: [],
    activities: [],
    location: 'Gurgaon, Haryana, India',
    linkedin: 'https://in.linkedin.com/in/ashokbhamla',
    icon: <DeveloperModeIcon />,
  },
];

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default async function TeamPage() {
  // Fetch authors from API
  const apiAuthors = await fetchAuthors();
  const allPosts = await fetchPosts({ status: 'published' });
  
  // Count posts per author
  const authorPostCounts = new Map<string, number>();
  allPosts.forEach((post) => {
    if (post.author_id) {
      const authorId = String(post.author_id);
      authorPostCounts.set(authorId, (authorPostCounts.get(authorId) || 0) + 1);
    }
  });

  // Process API authors - map _id to id if needed
  const processedAuthors = apiAuthors.map((author: any) => {
    const authorId = String(author._id || author.id);
    return {
      ...author,
      id: author._id || author.id,
      postCount: authorPostCounts.get(authorId) || 0,
    };
  }).filter((author: any) => author.postCount > 0); // Only show authors with published posts

  const siteUrl = getSiteUrl();
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Home', url: siteUrl },
    { name: 'Team', url: `${siteUrl}/team` },
  ]);

  // Generate Person schemas for each team member
  const personSchemas = teamMembers.map((member) => ({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: member.name,
    jobTitle: member.title,
    worksFor: {
      '@type': 'Organization',
      name: COMPANY_INFO.name,
      url: COMPANY_INFO.website,
    },
    description: member.bio.substring(0, 200),
    ...(member.linkedin && {
      sameAs: member.linkedin,
    }),
  }));

  // Generate Person schemas for API authors
  const authorSchemas = processedAuthors.map((author: any) => 
    generatePersonSchema({
      name: author.name,
      url: `${siteUrl}/blog/author/${author.slug}`,
      image: author.avatar || undefined,
      description: author.bio || undefined,
    })
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Team', href: '/team' },
        ]}
      />

      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 2,
            fontSize: { xs: '2rem', md: '3rem' },
            color: 'primary.main',
          }}
        >
          Meet Our Team
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'text.secondary',
            maxWidth: '700px',
            mx: 'auto',
            lineHeight: 1.7,
            fontSize: { xs: '1rem', md: '1.25rem' },
          }}
        >
          Our passionate team of travel experts and developers are dedicated to providing you with the best travel information, insights, and experiences from around the world.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {teamMembers.map((member, index) => (
          <Grid item xs={12} md={6} key={member.name}>
            <Paper
              elevation={2}
              sx={{
                p: { xs: 3, md: 4 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                <Avatar
                  sx={{
                    width: { xs: 64, md: 80 },
                    height: { xs: 64, md: 80 },
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    fontWeight: 700,
                    mr: 2,
                  }}
                >
                  {member.icon || getInitials(member.name)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                      fontWeight: 700,
                      mb: 0.5,
                      fontSize: { xs: '1.25rem', md: '1.5rem' },
                    }}
                  >
                    {member.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <WorkIcon sx={{ fontSize: '1rem', mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {member.title}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      fontSize: '0.75rem',
                    }}
                  >
                    {member.role}
                  </Typography>
                </Box>
              </Box>

              <Typography
                variant="body1"
                sx={{
                  mb: 3,
                  color: 'text.secondary',
                  lineHeight: 1.8,
                  flexGrow: 1,
                  fontSize: { xs: '0.9375rem', md: '1rem' },
                }}
              >
                {member.bio}
              </Typography>

              {member.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOnIcon sx={{ fontSize: '1rem', mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {member.location}
                  </Typography>
                </Box>
              )}

              {member.destinations.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}
                  >
                    Destinations
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {member.destinations.map((destination) => (
                      <Chip
                        key={destination}
                        label={destination}
                        size="small"
                        sx={{
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                          fontWeight: 500,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {member.activities.length > 0 && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}
                  >
                    Activities
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {member.activities.map((activity) => (
                      <Chip
                        key={activity}
                        label={activity}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          fontWeight: 500,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Blog Authors Section */}
      {processedAuthors.length > 0 && (
        <>
          <Divider sx={{ my: 6 }} />
          <Box sx={{ mb: 5, textAlign: 'center' }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem' },
                color: 'primary.main',
              }}
            >
              Our Blog Authors
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.7,
                fontSize: { xs: '1rem', md: '1.25rem' },
              }}
            >
              Meet the talented writers who create engaging travel content and share their expertise with our readers.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {processedAuthors.map((author: any) => (
              <Grid item xs={12} sm={6} md={4} key={author.id || author._id}>
                <Paper
                  elevation={2}
                  sx={{
                    p: { xs: 3, md: 4 },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                    {author.avatar ? (
                      <Avatar
                        src={author.avatar}
                        alt={author.name}
                        sx={{
                          width: { xs: 64, md: 80 },
                          height: { xs: 64, md: 80 },
                          mr: 2,
                        }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: { xs: 64, md: 80 },
                          height: { xs: 64, md: 80 },
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          fontSize: { xs: '1.5rem', md: '2rem' },
                          fontWeight: 700,
                          mr: 2,
                        }}
                      >
                        {getInitials(author.name)}
                      </Avatar>
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          fontWeight: 700,
                          mb: 0.5,
                          fontSize: { xs: '1.125rem', md: '1.25rem' },
                        }}
                      >
                        <Link
                          href={`/blog/author/${author.slug}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          {author.name}
                        </Link>
                      </Typography>
                      {author.designation && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <WorkIcon sx={{ fontSize: '1rem', mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {author.designation}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <ArticleIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {author.postCount} {author.postCount === 1 ? 'Article' : 'Articles'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {author.bio && (
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 2,
                        color: 'text.secondary',
                        lineHeight: 1.7,
                        flexGrow: 1,
                        fontSize: '0.9375rem',
                      }}
                    >
                      {author.bio.length > 150
                        ? `${author.bio.substring(0, 150)}...`
                        : author.bio}
                    </Typography>
                  )}

                  {author.expertise_topics && author.expertise_topics.length > 0 && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}
                      >
                        Expertise
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {author.expertise_topics.slice(0, 4).map((topic: string) => (
                          <Chip
                            key={topic}
                            label={topic}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: 'primary.main',
                              color: 'primary.main',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                            }}
                          />
                        ))}
                        {author.expertise_topics.length > 4 && (
                          <Chip
                            label={`+${author.expertise_topics.length - 4} more`}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: 'grey.400',
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Link
                      href={`/blog/author/${author.slug}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'primary.main',
                          fontWeight: 600,
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        View All Articles →
                      </Typography>
                    </Link>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* JSON-LD Schemas */}
      <JsonLd data={breadcrumbData} />
      {personSchemas.map((schema, index) => (
        <JsonLd key={`team-member-${index}`} data={schema} />
      ))}
      {authorSchemas.map((schema, index) => (
        <JsonLd key={`author-${index}`} data={schema} />
      ))}
    </Container>
  );
}

