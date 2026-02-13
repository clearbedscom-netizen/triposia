import { Metadata } from 'next';
import { Container, Typography, Box, Grid, Paper, Card, CardContent, CardMedia, Chip, Link as MuiLink, Avatar } from '@mui/material';
import { notFound } from 'next/navigation';
import { 
  generateMetadata as genMeta, 
  generateBreadcrumbList, 
  generateBlogListSchema,
  generatePersonSchema,
  generateCollectionPageSchema,
} from '@/lib/seo';
import { fetchAuthorBySlug, fetchPosts, fetchAuthors, type Post } from '@/lib/contentApi';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { getSiteUrl, COMPANY_INFO } from '@/lib/company';
import { CalendarToday, Person, Person as PersonIcon } from '@mui/icons-material';

// Use dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const author = await fetchAuthorBySlug(params.slug);

  if (!author) {
    return genMeta({
      title: 'Author Not Found',
      description: 'The requested author could not be found.',
      canonical: `/blog/author/${params.slug}`,
      noindex: true,
    });
  }

  const siteUrl = getSiteUrl();
  const authorUrl = `${siteUrl}/blog/author/${author.slug}`;
  
  // Fetch posts by this author
  const posts = await fetchPosts({ status: 'published', author_id: author.id });
  
  const title = `${author.name} - Blog Author | ${COMPANY_INFO.name}`;
  const description = author.bio || 
    `Read ${posts.length} blog posts by ${author.name}. ${posts.length > 0 ? `Latest articles: ${posts.slice(0, 3).map(p => p.title).join(', ')}` : ''}`;

  return {
    ...genMeta({
      title,
      description: description.substring(0, 160),
      canonical: `/blog/author/${author.slug}`,
      type: 'website',
      noindex: false, // Explicitly allow indexing
      keywords: [author.name, 'blog author', 'travel writer', author.slug],
      image: author.avatar,
    }),
    // Note: canonical is already set by genMeta in alternates.canonical, no need to duplicate
    alternates: {
      languages: {
        'en-US': authorUrl,
      },
    },
    openGraph: {
      ...genMeta({
        title,
        description: description.substring(0, 160),
        canonical: `/blog/author/${author.slug}`,
        type: 'website',
        image: author.avatar,
      }).openGraph,
      type: 'profile',
      url: authorUrl,
      siteName: COMPANY_INFO.name,
      ...(author.avatar && {
        images: [{ url: author.avatar }],
      }),
    },
    other: {
      'profile:first_name': author.name.split(' ')[0] || author.name,
      'profile:last_name': author.name.split(' ').slice(1).join(' ') || '',
    },
  };
}

export default async function BlogAuthorPage({ params }: PageProps) {
  const author = await fetchAuthorBySlug(params.slug);

  if (!author) {
    notFound();
  }

  // Fetch posts by this author
  const posts = await fetchPosts({ status: 'published', author_id: author.id });
  const allAuthors = await fetchAuthors();

  // Sort posts by published date (newest first)
  const sortedPosts = [...posts].sort((a, b) => {
    const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
    const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
    return dateB - dateA;
  });

  const siteUrl = getSiteUrl();
  const authorUrl = `${siteUrl}/blog/author/${author.slug}`;
  
  // Generate breadcrumb data
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Home', url: siteUrl },
    { name: 'Blog', url: `${siteUrl}/blog` },
    { name: author.name, url: authorUrl },
  ]);

  // Generate Person schema
  const personSchema = generatePersonSchema({
    name: author.name,
    url: authorUrl,
    image: author.avatar || undefined,
    description: author.bio || undefined,
  });

  // Generate blog list schema
  const blogListSchema = generateBlogListSchema({
    name: `Blog Posts by ${author.name}`,
    description: author.bio || `Blog posts written by ${author.name}`,
    url: authorUrl,
    items: sortedPosts.map(post => ({
      name: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
      description: post.excerpt || undefined,
      image: post.featured_image || undefined,
      datePublished: post.published_at || undefined,
    })),
  });

  // Generate collection page schema
  const collectionPageSchema = generateCollectionPageSchema({
    name: `${author.name} - Blog Author`,
    description: author.bio || `Browse all blog posts written by ${author.name}`,
    url: authorUrl,
    itemList: sortedPosts.map(post => ({
      name: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
    })),
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* JSON-LD Schemas */}
      <JsonLd data={breadcrumbData} />
      <JsonLd data={personSchema} />
      <JsonLd data={blogListSchema} />
      <JsonLd data={collectionPageSchema} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: author.name, href: `/blog/author/${author.slug}` },
        ]}
      />

      <Box sx={{ mb: 4 }}>
        {/* Back to blog link */}
        <MuiLink
          component={Link}
          href="/blog"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            mb: 3,
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          ← Back to Blog
        </MuiLink>

        {/* Author header */}
        <Paper sx={{ p: 4, mb: 4, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {author.avatar && (
              <Avatar
                src={author.avatar}
                alt={author.name}
                sx={{
                  width: { xs: 80, md: 120 },
                  height: { xs: 80, md: 120 },
                  fontSize: { xs: '2rem', md: '3rem' },
                }}
              >
                {author.name.charAt(0).toUpperCase()}
              </Avatar>
            )}
            {!author.avatar && (
              <Avatar
                sx={{
                  width: { xs: 80, md: 120 },
                  height: { xs: 80, md: 120 },
                  fontSize: { xs: '2rem', md: '3rem' },
                  bgcolor: 'primary.main',
                }}
              >
                {author.name.charAt(0).toUpperCase()}
              </Avatar>
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 700, mb: 1 }}>
                {author.name}
              </Typography>
              {author.bio && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontSize: '1.1rem', lineHeight: 1.6 }}>
                  {author.bio}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                {sortedPosts.length} {sortedPosts.length === 1 ? 'post' : 'posts'} published
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Posts by author */}
        {sortedPosts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No posts found by this author.
            </Typography>
          </Paper>
        ) : (
          <>
            <Typography variant="h2" gutterBottom sx={{ fontSize: '1.75rem', mb: 3, textAlign: 'left' }}>
              Posts by {author.name} ({sortedPosts.length})
            </Typography>
            <Grid container spacing={3}>
              {sortedPosts.map((post) => {
                const formattedDate = post.published_at
                  ? new Date(post.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '';

                return (
                  <Grid item xs={12} sm={6} md={4} key={post.id}>
                    <Card
                      component={Link}
                      href={`/blog/${post.slug}`}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        textDecoration: 'none',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                      }}
                    >
                      {post.featured_image && (
                        <CardMedia
                          component="img"
                          height="200"
                          image={post.featured_image}
                          alt={post.title}
                          sx={{ objectFit: 'cover' }}
                        />
                      )}
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                          {post.title}
                        </Typography>
                        {post.excerpt && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                            {post.excerpt.length > 120 
                              ? `${post.excerpt.substring(0, 120)}...` 
                              : post.excerpt}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 'auto', flexWrap: 'wrap' }}>
                          {formattedDate && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarToday sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {formattedDate}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </Box>
    </Container>
  );
}

