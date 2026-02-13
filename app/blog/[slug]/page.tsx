import { Metadata } from 'next';
import { Container, Typography, Box, Paper, Chip, Link as MuiLink, Grid, Card, CardContent, CardMedia } from '@mui/material';
import { notFound } from 'next/navigation';
import { 
  generateMetadata as genMeta, 
  generateBreadcrumbList, 
  generateBlogPostingSchema,
  generatePersonSchema,
  generateWebPageSchema,
  generateBlogListSchema,
  generateFAQPageSchema,
  generateVideoObjectSchema,
  extractYouTubeVideoId,
} from '@/lib/seo';
import { fetchPostBySlug, fetchAuthor, fetchCategories, fetchPosts, type Post } from '@/lib/contentApi';
import { calculateReadingTime, countWords, extractKeywords, generateMetaDescription } from '@/lib/blogUtils';
import { processContentForSEO, extractImagesFromContent, generateImageSchema, extractTextContent } from '@/lib/contentProcessor';
import { extractHeadings } from '@/lib/tableOfContents';
import TableOfContents from '@/components/blog/TableOfContents';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { getSiteUrl, COMPANY_INFO } from '@/lib/company';
import { CalendarToday, Person, Category as CategoryIcon, AccessTime } from '@mui/icons-material';

// Use dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await fetchPostBySlug(params.slug);

  if (!post) {
    return genMeta({
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
      canonical: `/blog/${params.slug}`,
      noindex: true,
    });
  }

  // Fetch author and category for metadata
  const author = post.author_id ? await fetchAuthor(post.author_id) : null;
  const allCategories = await fetchCategories();
  const category = post.category_id 
    ? allCategories.find(cat => cat.id === post.category_id) || null
    : null;

  const siteUrl = getSiteUrl();
  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || generateMetaDescription(post.excerpt, post.content_html);
  const keywords = extractKeywords(post.title, post.content_html || '', category?.name);
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  
  // Calculate reading time and word count for metadata
  const wordCount = countWords(post.content_html || '');
  const readingTime = calculateReadingTime(post.content_html || '');
  
  // Enhanced article-specific metadata with maximum SEO points
  const articleMetadata: Metadata = {
    ...genMeta({
      title,
      description,
      canonical: `/blog/${post.slug}`,
      type: 'article',
      keywords: keywords.length > 0 ? keywords : ['travel blog', 'flight tips', 'travel advice'],
      image: post.featured_image,
      noindex: false, // Explicitly allow indexing
    }),
    authors: author ? [{ name: author.name, url: author.slug ? `${siteUrl}/blog/author/${author.slug}` : undefined }] : undefined,
    creator: author?.name || COMPANY_INFO.name,
    publisher: COMPANY_INFO.name,
    // Note: canonical is already set by genMeta in alternates.canonical, no need to duplicate
    alternates: {
      languages: {
        'en-US': postUrl,
      },
    },
    openGraph: {
      ...genMeta({
        title,
        description,
        canonical: `/blog/${post.slug}`,
        type: 'article',
        image: post.featured_image,
      }).openGraph,
      type: 'article',
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || post.published_at || undefined,
      authors: author ? [author.name] : undefined,
      section: category?.name || undefined,
      tags: keywords.length > 0 ? keywords : undefined,
      url: postUrl,
      siteName: COMPANY_INFO.name,
      locale: 'en_US',
      ...(post.featured_image && {
        images: [{
          url: post.featured_image,
          width: 1200,
          height: 630,
          alt: post.title || 'Featured image',
        }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.featured_image ? [post.featured_image] : undefined,
      creator: author ? `@${author.name.replace(/\s+/g, '')}` : undefined,
    },
    other: {
      'article:published_time': post.published_at || '',
      'article:modified_time': post.updated_at || post.published_at || '',
      ...(category && { 'article:section': category.name }),
      ...(author && { 'article:author': author.name }),
      ...(keywords.length > 0 && { 'article:tag': keywords.join(', ') }),
      ...(readingTime > 0 && { 'readtime': `${readingTime} minutes` }),
      ...(wordCount > 0 && { 'wordcount': wordCount.toString() }),
      'og:type': 'article',
      'og:article:published_time': post.published_at || '',
      'og:article:modified_time': post.updated_at || post.published_at || '',
    },
  };

  return articleMetadata;
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await fetchPostBySlug(params.slug);

  if (!post || post.status !== 'published') {
    notFound();
  }

  // Fetch all related data
  const author = post.author_id ? await fetchAuthor(post.author_id) : null;
  const allCategories = await fetchCategories();
  const category = post.category_id 
    ? allCategories.find(cat => cat.id === post.category_id) || null
    : null;

  // Get related posts (same category or recent posts)
  const allPosts = await fetchPosts({ status: 'published' });
  const relatedPosts = allPosts
    .filter(p => p.id !== post.id && (p.category_id === post.category_id || !post.category_id))
    .slice(0, 3);

  // Process content for SEO
  const processedContent = processContentForSEO(post.content_html || '', {
    title: post.title,
    slug: post.slug,
    defaultAltText: post.title,
  });

  // Extract headings for table of contents
  const headings = extractHeadings(processedContent);

  // Extract images from content for schema
  const contentImages = extractImagesFromContent(post.content_html || '');
  const allImages = post.featured_image 
    ? [{ src: post.featured_image, alt: post.title }, ...contentImages]
    : contentImages;

  // Calculate metrics
  const wordCount = countWords(post.content_html || '');
  const readingTime = calculateReadingTime(post.content_html || '');
  const keywords = extractKeywords(post.title, post.content_html || '', category?.name);

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const modifiedDate = post.updated_at
    ? new Date(post.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  
  // Generate breadcrumb data
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Home', url: siteUrl },
    { name: 'Blog', url: `${siteUrl}/blog` },
    ...(category ? [{ name: category.name, url: `${siteUrl}/blog/category/${category.slug}` }] : []),
    { name: post.title, url: postUrl },
  ]);

  // Generate image schemas for all images in the post
  const imageSchemas = allImages.length > 0 ? generateImageSchema(allImages) : [];

  // Prepare author details for schema
  const authorSameAs = author ? (
    (author as any).sameAs || (author as any).social_links ? 
      (Array.isArray((author as any).social_links) ? (author as any).social_links : 
       (author as any).social_links ? [(author as any).social_links] : []) :
      [
        ...((author as any).linkedin ? [(author as any).linkedin] : []),
        ...((author as any).twitter ? [(author as any).twitter] : []),
        ...((author as any).facebook ? [(author as any).facebook] : []),
        ...((author as any).instagram ? [(author as any).instagram] : []),
        ...((author as any).youtube ? [(author as any).youtube] : []),
      ].filter(Boolean)
  ) : undefined;

  // Generate comprehensive schemas
  const blogPostingSchemaBase = generateBlogPostingSchema({
    title: post.title,
    description: post.excerpt || generateMetaDescription(post.excerpt, post.content_html),
    publishedTime: post.published_at || new Date().toISOString(),
    modifiedTime: post.updated_at || post.published_at || undefined,
    image: post.featured_image || undefined,
    authorName: author?.name || 'Admin',
    authorUrl: author?.slug ? `${siteUrl}/blog/author/${author.slug}` : undefined,
    authorImage: author?.avatar || undefined,
    authorBio: author?.bio || undefined,
    authorJobTitle: author ? ((author as any).job_title || (author as any).jobTitle || (author as any).title) : undefined,
    authorEmail: author ? ((author as any).email) : undefined,
    authorSameAs: authorSameAs && authorSameAs.length > 0 ? authorSameAs : undefined,
    url: postUrl,
    category: category?.name || undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
    wordCount: wordCount > 0 ? wordCount : undefined,
    readingTime: readingTime > 0 ? readingTime : undefined,
    mainEntityOfPage: postUrl,
  });

  // Enhance schema with all images from content
  const blogPostingSchema = {
    ...blogPostingSchemaBase,
    ...(imageSchemas.length > 0 && {
      image: imageSchemas.length === 1 
        ? imageSchemas[0]
        : imageSchemas, // Multiple images as array
    }),
  };

  // Generate comprehensive Person schema for author with all available fields
  const authorSchema = author ? generatePersonSchema({
    name: author.name,
    url: author.slug ? `${siteUrl}/blog/author/${author.slug}` : undefined,
    image: author.avatar || undefined,
    description: author.bio || undefined,
    jobTitle: (author as any).job_title || (author as any).jobTitle || (author as any).title || undefined,
    email: (author as any).email || undefined,
    sameAs: (author as any).sameAs || (author as any).social_links ? 
      (Array.isArray((author as any).social_links) ? (author as any).social_links : 
       (author as any).social_links ? [(author as any).social_links] : []) :
      (author as any).linkedin ? [(author as any).linkedin] :
      (author as any).twitter ? [(author as any).twitter] :
      (author as any).facebook ? [(author as any).facebook] :
      undefined,
    worksFor: {
      name: COMPANY_INFO.name,
      url: COMPANY_INFO.website,
    },
  }) : null;

  // Generate WebPage schema
  const webPageSchema = generateWebPageSchema({
    name: post.title,
    description: post.excerpt || generateMetaDescription(post.excerpt, post.content_html),
    url: postUrl,
    image: post.featured_image || undefined,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    author: author?.name || undefined,
    breadcrumb: breadcrumbData.itemListElement?.map((item: any) => ({
      name: item.name,
      url: typeof item.item === 'string' ? item.item : item.item['@id'] || item.item,
    })),
  });

  // Generate related posts schema if available
  const relatedPostsSchema = relatedPosts.length > 0 ? generateBlogListSchema({
    name: `Related posts to ${post.title}`,
    description: `Related blog posts similar to ${post.title}`,
    url: `${siteUrl}/blog`,
    items: relatedPosts.map(p => ({
      name: p.title,
      url: `${siteUrl}/blog/${p.slug}`,
      description: p.excerpt || undefined,
      image: p.featured_image || undefined,
      datePublished: p.published_at || undefined,
    })),
  }) : null;

  // Check for FAQs in the post
  const faqs = Array.isArray(post.faqs) && post.faqs.length > 0 ? post.faqs : [];
  
  // Generate FAQ schema if FAQs exist (strip HTML from answers for schema)
  const faqSchema = faqs.length > 0 ? generateFAQPageSchema(
    faqs.map(faq => ({
      question: faq.question || '',
      answer: extractTextContent(faq.answer || ''), // Strip HTML for JSON-LD
    })),
    `FAQs for ${post.title}`
  ) : null;

  // Check for YouTube video URL
  const youtubeUrl = (post as any).youtube_url || undefined;
  const videoId = youtubeUrl ? extractYouTubeVideoId(youtubeUrl) : null;
  
  // Generate VideoObject schema if YouTube URL exists
  const videoSchema = youtubeUrl && videoId ? generateVideoObjectSchema({
    name: post.title,
    description: post.excerpt || generateMetaDescription(post.excerpt, post.content_html),
    contentUrl: youtubeUrl,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    uploadDate: post.published_at || undefined,
    publisherName: COMPANY_INFO.name,
    publisherLogo: `${siteUrl}/logo.png`,
  }) : null;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, md: 4 } }}>
      {/* JSON-LD Schemas */}
      <JsonLd data={breadcrumbData} />
      <JsonLd data={blogPostingSchema} />
      <JsonLd data={webPageSchema} />
      {authorSchema && <JsonLd data={authorSchema} />}
      {relatedPostsSchema && <JsonLd data={relatedPostsSchema} />}
      {faqSchema && <JsonLd data={faqSchema} />}
      {videoSchema && <JsonLd data={videoSchema} />}

      <article itemScope itemType="https://schema.org/BlogPosting">
        {/* Hidden structured data properties */}
        <meta itemProp="headline" content={post.title} />
        <meta itemProp="description" content={post.excerpt || generateMetaDescription(post.excerpt, post.content_html)} />
        {post.published_at && <meta itemProp="datePublished" content={post.published_at} />}
        {post.updated_at && <meta itemProp="dateModified" content={post.updated_at} />}
        {author && <meta itemProp="author" content={author.name} />}
        {category && <meta itemProp="articleSection" content={category.name} />}
        
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            ...(category ? [{ label: category.name, href: `/blog/category/${category.slug}` }] : []),
            { label: post.title, href: `/blog/${post.slug}` },
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

          {/* Post metadata */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
            {category && (
              <Chip
                icon={<CategoryIcon />}
                label={category.name}
                component={Link}
                href={`/blog/category/${category.slug}`}
                clickable
                size="small"
                sx={{
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                  },
                }}
              />
            )}
            {formattedDate && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarToday sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {formattedDate}
                  {modifiedDate && modifiedDate !== formattedDate && ` (Updated: ${modifiedDate})`}
                </Typography>
              </Box>
            )}
            {author && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Person sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                <MuiLink
                  component={Link}
                  href={`/blog/author/${author.slug || author.id}`}
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    '&:hover': {
                      color: 'primary.main',
                      textDecoration: 'underline',
                    },
                  }}
                >
                  <Typography variant="body2">{author.name}</Typography>
                </MuiLink>
              </Box>
            )}
            {readingTime > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {readingTime} min read
                  {wordCount > 0 && ` • ${wordCount.toLocaleString()} words`}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Post title */}
          <Typography 
            variant="h1" 
            component="h1"
            itemProp="headline"
            gutterBottom 
            sx={{ 
              mb: 3, 
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }, 
              fontWeight: 700,
              lineHeight: { xs: 1.3, md: 1.2 }
            }}
          >
            {post.title}
          </Typography>

          {/* Featured image - displayed below title for better SEO and visual hierarchy */}
          {post.featured_image && (
            <Box 
              sx={{ 
                mb: 4,
                width: '100%',
                overflow: 'hidden',
                borderRadius: 2,
                position: 'relative',
              }} 
              itemProp="image" 
              itemScope 
              itemType="https://schema.org/ImageObject"
            >
              <meta itemProp="url" content={post.featured_image} />
              <meta itemProp="width" content="1200" />
              <meta itemProp="height" content="630" />
              <Box
                component="img"
                src={post.featured_image}
                alt={post.title || 'Featured image'}
                loading="eager"
                width={1200}
                height={630}
                itemProp="contentUrl"
                sx={{
                  width: '100%',
                  height: { xs: 'auto', md: '500px' },
                  maxHeight: { xs: '400px', md: '500px' },
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                }}
              />
            </Box>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <Typography 
              variant="h5" 
              component="p"
              itemProp="description"
              color="text.secondary" 
              sx={{ 
                mb: 4, 
                fontWeight: 400, 
                lineHeight: 1.6,
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
              }}
            >
              {post.excerpt}
            </Typography>
          )}

          {/* Table of Contents and Post content */}
          {processedContent && (
            <Grid container spacing={{ xs: 2, md: 4 }}>
              {headings.length > 0 && (
                <Grid item xs={12} md={3}>
                  <Box sx={{ 
                    position: { xs: 'static', md: 'sticky' },
                    top: { md: 100 },
                    mb: { xs: 3, md: 0 }
                  }}>
                    <TableOfContents items={headings} />
                  </Box>
                </Grid>
              )}
              <Grid item xs={12} md={headings.length > 0 ? 9 : 12}>
                <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
                  <Box
                    component="div"
                    itemScope
                    itemType="https://schema.org/BlogPosting"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                    sx={{
                      '& h1, & h2, & h3, & h4, & h5, & h6': {
                        mt: 3,
                        mb: 2,
                        fontWeight: 600,
                        scrollMarginTop: '100px', // Offset for sticky header
                        '&[id]': {
                          position: 'relative',
                        },
                      },
                      '& h1': { fontSize: { xs: '1.75rem', md: '2rem' } },
                      '& h2': { fontSize: { xs: '1.5rem', md: '1.75rem' } },
                      '& h3': { fontSize: { xs: '1.25rem', md: '1.5rem' } },
                      '& h4': { fontSize: { xs: '1.125rem', md: '1.25rem' } },
                      '& p': {
                        mb: 2,
                        lineHeight: 1.8,
                        fontSize: { xs: '1rem', md: '1.1rem' },
                      },
                      '& a': {
                        color: 'primary.main',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      },
                      '& img': {
                        maxWidth: '100%',
                        width: '100%',
                        height: 'auto',
                        borderRadius: 1,
                        my: 2,
                        display: 'block',
                        objectFit: 'contain',
                        objectPosition: 'center',
                      },
                      '& ul, & ol': {
                        mb: 2,
                        pl: 3,
                        '& li': {
                          mb: 1,
                          lineHeight: 1.8,
                        },
                      },
                      '& blockquote': {
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        pl: 2,
                        py: 1,
                        my: 2,
                        fontStyle: 'italic',
                        bgcolor: 'action.hover',
                      },
                      '& code': {
                        bgcolor: 'action.hover',
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 0.5,
                        fontFamily: 'monospace',
                      },
                      // Responsive table styling
                      '& table': {
                        width: '100%',
                        maxWidth: '100%',
                        borderCollapse: 'collapse',
                        mb: 3,
                        fontSize: { xs: '0.875rem', md: '1rem' },
                        overflowX: 'auto',
                        display: 'block',
                        overflow: 'auto',
                        '&::-webkit-scrollbar': {
                          height: 8,
                        },
                        '&::-webkit-scrollbar-track': {
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                        },
                        '&::-webkit-scrollbar-thumb': {
                          bgcolor: 'text.secondary',
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'text.primary',
                          },
                        },
                        '@media (min-width: 600px)': {
                          display: 'table',
                        },
                      },
                      '& thead': {
                        display: 'table-header-group',
                      },
                      '& tbody': {
                        display: 'table-row-group',
                      },
                      '& tr': {
                        display: { xs: 'block', sm: 'table-row' },
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        mb: { xs: 2, sm: 0 },
                        '&:last-child': {
                          borderBottom: 'none',
                        },
                      },
                      '& th, & td': {
                        display: { xs: 'block', sm: 'table-cell' },
                        padding: { xs: '0.75rem 0.5rem', sm: '0.75rem 1rem' },
                        textAlign: { xs: 'left', sm: 'inherit' },
                        borderBottom: { xs: 'none', sm: '1px solid' },
                        borderColor: { xs: 'transparent', sm: 'divider' },
                        width: { xs: '100%', sm: 'auto' },
                        maxWidth: { xs: '100%', sm: 'none' },
                        wordBreak: 'break-word',
                        '&:before': {
                          content: { xs: 'attr(data-label)', sm: 'none' },
                          fontWeight: 600,
                          display: { xs: 'inline-block', sm: 'none' },
                          width: { xs: '30%', sm: 'auto' },
                          mr: { xs: 1, sm: 0 },
                        },
                      },
                      '& th': {
                        fontWeight: 600,
                        bgcolor: 'action.hover',
                        borderBottom: '2px solid',
                        borderColor: 'divider',
                        fontSize: { xs: '0.875rem', md: '0.9375rem' },
                      },
                      '& td': {
                        fontSize: { xs: '0.875rem', md: '0.9375rem' },
                      },
                    }}
                  />
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Keywords/Tags */}
          {keywords.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Tags:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {keywords.slice(0, 10).map((keyword, index) => (
                  <Chip
                    key={index}
                    label={keyword}
                    size="small"
                    sx={{
                      fontSize: '0.75rem',
                      bgcolor: 'action.hover',
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Share section */}
          <Paper sx={{ p: { xs: 2, md: 3 }, bgcolor: 'action.hover', mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
              Share this post
            </Typography>
            <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, flexWrap: 'wrap' }}>
              <MuiLink
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Share on Twitter
              </MuiLink>
              <MuiLink
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Share on Facebook
              </MuiLink>
              <MuiLink
                href={`https://www.linkedin.com/shareArticle?url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Share on LinkedIn
              </MuiLink>
              <MuiLink
                href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(postUrl)}`}
                sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Email this post
              </MuiLink>
            </Box>
          </Paper>

          {/* Author bio with full details */}
          {author && (
            <Paper sx={{ p: 3, mb: 4, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                {author.avatar && (
                  <Box
                    component="img"
                    src={author.avatar}
                    alt={author.name}
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    About {author.name}
                  </Typography>
                  {((author as any).job_title || (author as any).jobTitle || (author as any).title) && (
                    <Typography variant="body2" color="primary.main" sx={{ mb: 1, fontWeight: 500 }}>
                      {(author as any).job_title || (author as any).jobTitle || (author as any).title}
                    </Typography>
                  )}
                  {author.bio && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.8 }}>
                      {author.bio}
                    </Typography>
                  )}
                  
                  {/* Social links and contact info */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
                    {author.slug && (
                      <MuiLink
                        component={Link}
                        href={`/blog/author/${author.slug}`}
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        View all posts by {author.name} →
                      </MuiLink>
                    )}
                    {(author as any).email && (
                      <MuiLink
                        href={`mailto:${(author as any).email}`}
                        sx={{
                          color: 'text.secondary',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: 'primary.main',
                          },
                        }}
                      >
                        {(author as any).email}
                      </MuiLink>
                    )}
                  </Box>
                  
                  {/* Social media links */}
                  {(((author as any).social_links && Array.isArray((author as any).social_links)) ||
                     (author as any).linkedin || (author as any).twitter || (author as any).facebook ||
                     (author as any).instagram || (author as any).youtube) && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
                      {(author as any).linkedin && (
                        <MuiLink
                          href={(author as any).linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          LinkedIn
                        </MuiLink>
                      )}
                      {(author as any).twitter && (
                        <MuiLink
                          href={(author as any).twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          Twitter
                        </MuiLink>
                      )}
                      {(author as any).facebook && (
                        <MuiLink
                          href={(author as any).facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          Facebook
                        </MuiLink>
                      )}
                      {(author as any).instagram && (
                        <MuiLink
                          href={(author as any).instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          Instagram
                        </MuiLink>
                      )}
                      {(author as any).youtube && (
                        <MuiLink
                          href={(author as any).youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          YouTube
                        </MuiLink>
                      )}
                      {(author as any).social_links && Array.isArray((author as any).social_links) && 
                       (author as any).social_links.map((link: string, idx: number) => (
                         <MuiLink
                           key={idx}
                           href={link}
                           target="_blank"
                           rel="noopener noreferrer"
                           sx={{
                             color: 'primary.main',
                             textDecoration: 'none',
                             fontSize: '0.85rem',
                             '&:hover': {
                               textDecoration: 'underline',
                             },
                           }}
                         >
                           {new URL(link).hostname.replace('www.', '')}
                         </MuiLink>
                       ))
                      }
                    </Box>
                  )}
                </Box>
              </Box>
            </Paper>
          )}

          {/* FAQs Section */}
          {faqs.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h2" gutterBottom sx={{ fontSize: '1.75rem', mb: 3 }}>
                Frequently Asked Questions
              </Typography>
              <Paper sx={{ p: { xs: 3, md: 4 } }}>
                {faqs.map((faq, idx) => (
                  <Box key={idx} sx={{ mb: idx < faqs.length - 1 ? 4 : 0 }}>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontSize: '1.25rem', 
                        mb: 1.5, 
                        fontWeight: 600,
                        color: 'text.primary'
                      }}
                    >
                      {faq.question}
                    </Typography>
                    <Box
                      component="div"
                      dangerouslySetInnerHTML={{ __html: faq.answer || '' }}
                      sx={{
                        '& p': {
                          mb: 1.5,
                          lineHeight: 1.8,
                          color: 'text.secondary',
                        },
                        '& p:last-child': {
                          mb: 0,
                        },
                        '& ul, & ol': {
                          mb: 1.5,
                          pl: 3,
                          '& li': {
                            mb: 0.5,
                            lineHeight: 1.8,
                          },
                        },
                        '& a': {
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        },
                      }}
                    />
                  </Box>
                ))}
              </Paper>
            </Box>
          )}

          {/* YouTube Video Section */}
          {youtubeUrl && videoId && (
            <Box sx={{ mt: 4, mb: 4 }}>
              <Typography variant="h2" gutterBottom sx={{ fontSize: '1.75rem', mb: 3 }}>
                Watch Video
              </Typography>
              <Paper sx={{ p: { xs: 2, md: 3 }, overflow: 'hidden' }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '56.25%', // 16:9 aspect ratio
                    height: 0,
                    overflow: 'hidden',
                    borderRadius: 1,
                    bgcolor: 'background.default',
                  }}
                >
                  <Box
                    component="iframe"
                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                  />
                </Box>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <MuiLink
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Watch on YouTube →
                  </MuiLink>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Related posts */}
          {relatedPosts.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h2" gutterBottom sx={{ fontSize: '1.75rem', mb: 3 }}>
                Related Posts
              </Typography>
              <Grid container spacing={3}>
                {relatedPosts.map((relatedPost) => (
                  <Grid item xs={12} sm={6} md={4} key={relatedPost.id}>
                    <Card
                      component={Link}
                      href={`/blog/${relatedPost.slug}`}
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
                      {relatedPost.featured_image && (
                        <CardMedia
                          component="img"
                          height="200"
                          image={relatedPost.featured_image}
                          alt={relatedPost.title}
                          sx={{ objectFit: 'cover' }}
                        />
                      )}
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                          {relatedPost.title}
                        </Typography>
                        {relatedPost.excerpt && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                            {relatedPost.excerpt.substring(0, 150)}
                            {relatedPost.excerpt.length > 150 ? '...' : ''}
                          </Typography>
                        )}
                        {relatedPost.published_at && (
                          <Typography variant="caption" color="text.secondary">
                            {new Date(relatedPost.published_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </article>
    </Container>
  );
}
