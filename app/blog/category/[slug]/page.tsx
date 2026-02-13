import { Metadata } from 'next';
import { Container, Typography, Box, Grid, Paper, Card, CardContent, CardMedia, Chip, Link as MuiLink } from '@mui/material';
import { notFound } from 'next/navigation';
import { 
  generateMetadata as genMeta, 
  generateBreadcrumbList, 
  generateBlogListSchema,
  generateCollectionPageSchema,
  generateCategorySchema,
} from '@/lib/seo';
import { fetchCategoryBySlug, fetchPosts, fetchCategories, fetchAuthors, type Post } from '@/lib/contentApi';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { getSiteUrl, COMPANY_INFO } from '@/lib/company';
import { CalendarToday, Person, Category as CategoryIcon } from '@mui/icons-material';

// Use dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = await fetchCategoryBySlug(params.slug);

  if (!category) {
    return genMeta({
      title: 'Category Not Found',
      description: 'The requested blog category could not be found.',
      canonical: `/blog/category/${params.slug}`,
      noindex: true,
    });
  }

  const siteUrl = getSiteUrl();
  const categoryUrl = `${siteUrl}/blog/category/${category.slug}`;
  
  // Fetch posts in this category for description
  // Use _id if available (from API), otherwise use id
  const categoryId = (category as any)._id || category.id;
  const posts = await fetchPosts({ status: 'published', category_id: categoryId });
  
  const title = `${category.name} - Blog Category | ${COMPANY_INFO.name}`;
  const description = category.description || 
    `Browse ${posts.length} blog posts in the ${category.name} category. ${posts.length > 0 ? `Latest articles: ${posts.slice(0, 3).map(p => p.title).join(', ')}` : ''}`;

  return {
    ...genMeta({
      title,
      description: description.substring(0, 160),
      canonical: `/blog/category/${category.slug}`,
      type: 'website',
      noindex: false, // Explicitly allow indexing
      keywords: [category.name.toLowerCase(), 'travel blog', 'blog category', category.slug],
    }),
    // Note: canonical is already set by genMeta in alternates.canonical, no need to duplicate
    alternates: {
      languages: {
        'en-US': categoryUrl,
      },
    },
    openGraph: {
      ...genMeta({
        title,
        description,
        canonical: `/blog/category/${category.slug}`,
        type: 'website',
      }).openGraph,
      type: 'website',
      url: categoryUrl,
      siteName: COMPANY_INFO.name,
    },
    other: {
      'article:section': category.name,
    },
  };
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const category = await fetchCategoryBySlug(params.slug);

  if (!category) {
    notFound();
  }

  // Fetch posts in this category
  // Use _id if available (from API), otherwise use id
  const categoryId = (category as any)._id || category.id;
  const posts = await fetchPosts({ status: 'published', category_id: categoryId });
  const allCategories = await fetchCategories();
  const authors = await fetchAuthors();

  // Create author map
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
  const categoryUrl = `${siteUrl}/blog/category/${category.slug}`;
  
  // Generate breadcrumb data
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Home', url: siteUrl },
    { name: 'Blog', url: `${siteUrl}/blog` },
    { name: category.name, url: categoryUrl },
  ]);

  // Generate blog list schema
  const blogListSchema = generateBlogListSchema({
    name: `${category.name} Blog Posts`,
    description: category.description || `Blog posts in the ${category.name} category`,
    url: categoryUrl,
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
    name: `${category.name} - Blog Category`,
    description: category.description || `Browse all blog posts in the ${category.name} category`,
    url: categoryUrl,
    itemList: sortedPosts.map(post => ({
      name: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
    })),
  });

  // Generate category schema
  const categorySchema = generateCategorySchema({
    name: category.name,
    description: category.description,
    url: categoryUrl,
    numberOfItems: sortedPosts.length,
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* JSON-LD Schemas */}
      <JsonLd data={breadcrumbData} />
      <JsonLd data={blogListSchema} />
      <JsonLd data={collectionPageSchema} />
      <JsonLd data={categorySchema} />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: category.name, href: `/blog/category/${category.slug}` },
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

        {/* Category header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <CategoryIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />
          <Box>
            <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 700, mb: 1 }}>
              {category.name}
            </Typography>
            {category.description && (
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                {category.description}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {sortedPosts.length} {sortedPosts.length === 1 ? 'post' : 'posts'} in this category
            </Typography>
          </Box>
        </Box>

        {/* All categories */}
        <Paper sx={{ p: 2, mb: 4, bgcolor: 'action.hover' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
            Browse all categories:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {allCategories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                component={Link}
                href={`/blog/category/${cat.slug}`}
                clickable
                size="small"
                color={cat.slug === category.slug ? 'primary' : 'default'}
                sx={{
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                  },
                }}
              />
            ))}
          </Box>
        </Paper>

        {/* Posts in category */}
        {sortedPosts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No posts found in this category.
            </Typography>
          </Paper>
        ) : (
          <>
            <Typography variant="h2" gutterBottom sx={{ fontSize: '1.75rem', mb: 3, textAlign: 'left' }}>
              Posts ({sortedPosts.length})
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
                          {post.author && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Person sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {post.author.name}
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

