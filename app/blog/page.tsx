import { Metadata } from 'next';
import { Container, Typography, Box, Grid, Paper, Card, CardContent, CardMedia, Chip, Link as MuiLink } from '@mui/material';
import { generateMetadata as genMeta, generateBreadcrumbList, generateBlogListSchema, generateCollectionPageSchema } from '@/lib/seo';
import { fetchPosts, fetchCategories, fetchAuthors, type Post } from '@/lib/contentApi';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { getSiteUrl, COMPANY_INFO } from '@/lib/company';
import { CalendarToday, Person } from '@mui/icons-material';

// Use dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const blogUrl = `${siteUrl}/blog`;
  
  // Fetch posts for better metadata
  const posts = await fetchPosts({ status: 'published' });
  const categories = await fetchCategories();
  
  const title = `Travel Blog - Insights, Tips & Guides | ${COMPANY_INFO.name}`;
  const description = `Discover ${posts.length} travel insights, flight tips, airport guides, and airline information. Expert advice for travelers worldwide. Browse ${categories.length} categories covering all aspects of travel.`;

  return {
    ...genMeta({
      title,
      description,
      canonical: '/blog',
      type: 'website',
      noindex: false, // Explicitly allow indexing
      keywords: [
        'travel blog',
        'flight tips',
        'airport guides',
        'travel advice',
        'airline information',
        'travel insights',
        'flight information',
        'travel guides',
      ],
    }),
    // Note: canonical is already set by genMeta in alternates.canonical, no need to duplicate
    alternates: {
      languages: {
        'en-US': blogUrl,
      },
    },
    openGraph: {
      ...genMeta({
        title,
        description,
        canonical: '/blog',
        type: 'website',
      }).openGraph,
      type: 'website',
      url: blogUrl,
      siteName: COMPANY_INFO.name,
    },
    other: {
      'blog:total_posts': posts.length.toString(),
      'blog:total_categories': categories.length.toString(),
    },
  };
}

interface BlogCardProps {
  post: Post;
}

interface BlogCardPropsWithAuthor extends BlogCardProps {
  authorName?: string;
}

function BlogCard({ post, authorName }: BlogCardPropsWithAuthor) {
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
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
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
          {post.title}
        </Typography>
        {post.excerpt && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
            {post.excerpt}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 'auto', flexWrap: 'wrap' }}>
          {formattedDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarToday sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formattedDate}
              </Typography>
            </Box>
          )}
          {authorName && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Person sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {authorName}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default async function BlogPage() {
  // Fetch published posts
  const posts = await fetchPosts({ status: 'published' });
  const categories = await fetchCategories();
  const authors = await fetchAuthors();

  // Create author map for quick lookup
  const authorMap = new Map(authors.map(author => [author.id, author]));

  // Enhance posts with author names
  const postsWithAuthors = posts.map(post => ({
    ...post,
    author: post.author_id ? authorMap.get(post.author_id) : null,
  }));

  // Sort posts by published date (newest first)
  const sortedPosts = [...postsWithAuthors].sort((a, b) => {
    const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
    const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
    return dateB - dateA;
  });

  const siteUrl = getSiteUrl();
  const blogUrl = `${siteUrl}/blog`;
  
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Home', url: siteUrl },
    { name: 'Blog', url: blogUrl },
  ]);

  // Generate blog list schema
  const blogListSchema = generateBlogListSchema({
    name: 'Travel Blog Posts',
    description: 'Discover travel insights, flight tips, airport guides, and airline information.',
    url: blogUrl,
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
    name: 'Travel Blog',
    description: 'Browse all travel blog posts with expert advice on flights, airports, and airlines.',
    url: blogUrl,
    itemList: sortedPosts.slice(0, 20).map(post => ({
      name: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
    })),
  });

  // Generate WebSite schema with Blog section
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: COMPANY_INFO.name,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/blog?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    mainEntity: {
      '@type': 'Blog',
      name: 'Travel Blog',
      url: blogUrl,
      blogPost: sortedPosts.slice(0, 10).map(post => ({
        '@type': 'BlogPosting',
        headline: post.title,
        url: `${siteUrl}/blog/${post.slug}`,
        datePublished: post.published_at || undefined,
        ...(post.author && {
          author: {
            '@type': 'Person',
            name: post.author.name,
          },
        }),
      })),
    },
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
        ]}
      />
      <JsonLd data={breadcrumbData} />
      <JsonLd data={blogListSchema} />
      <JsonLd data={collectionPageSchema} />
      <JsonLd data={websiteSchema} />

      <Box component="header" sx={{ mb: 4 }}>
        <Typography variant="h1" gutterBottom sx={{ mb: 2, textAlign: 'left' }}>
          Travel Blog
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, fontSize: '1.1rem', lineHeight: 1.8, maxWidth: '800px' }}>
          Discover travel insights, flight tips, airport guides, and airline information. Expert advice for travelers worldwide.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>{sortedPosts.length}</strong> {sortedPosts.length === 1 ? 'post' : 'posts'} • 
            <strong> {categories.length}</strong> {categories.length === 1 ? 'category' : 'categories'} • 
            <strong> {authors.length}</strong> {authors.length === 1 ? 'author' : 'authors'}
          </Typography>
        </Box>
      </Box>

      {categories.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h2" gutterBottom sx={{ fontSize: '1.5rem', mb: 3, textAlign: 'left' }}>
            Categories
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                component={Link}
                href={`/blog/category/${category.slug}`}
                clickable
                sx={{
                  fontSize: '0.95rem',
                  height: 36,
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                  },
                }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {sortedPosts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No blog posts found.
          </Typography>
        </Paper>
      ) : (
        <>
          <Typography variant="h2" gutterBottom sx={{ fontSize: '1.75rem', mb: 3, textAlign: 'left' }}>
            Latest Posts ({sortedPosts.length})
          </Typography>
          <Grid container spacing={3}>
            {sortedPosts.map((post) => (
              <Grid item xs={12} sm={6} md={4} key={post.id}>
                <BlogCard post={post} authorName={post.author?.name} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
}

