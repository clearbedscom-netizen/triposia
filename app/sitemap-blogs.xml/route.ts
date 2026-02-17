import { NextResponse } from 'next/server';
import { getEntityRole, getSitemapPriority } from '@/lib/entityRoles';
import { COMPANY_INFO } from '@/lib/company';
import { fetchPosts } from '@/lib/contentApi';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Revalidate on every request for fresh data

const DOMAIN_ID = 2; // Triposia.com domain ID

// Escape XML special characters in URLs
function escapeXmlUrl(url: string): string {
  return url
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || COMPANY_INFO.website;
  // Use a date within the last 15 days (7 days ago as default)
  const lastMod = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const urls: string[] = [];

  try {
    // Fetch published posts from Content API for domain_id = 2
    const posts = await fetchPosts({ 
      domain_id: DOMAIN_ID,
      status: 'published',
      limit: 10000 // Large limit to get all posts
    });

    for (const post of posts) {
      if (!post.slug || post.status !== 'published') continue;

      const role = getEntityRole('blog');
      const priority = getSitemapPriority(role);
      
      // Use post's actual date if within last 15 days, otherwise use default
      const postDate = post.updated_at || post.published_at;
      let postLastMod = lastMod;
      if (postDate) {
        const postDateMs = new Date(postDate).getTime();
        const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
        if (postDateMs > fifteenDaysAgo) {
          postLastMod = new Date(postDate).toISOString();
        }
      }

      // Escape the URL to handle special characters in slugs
      const escapedSlug = escapeXmlUrl(post.slug);
      const escapedUrl = escapeXmlUrl(`${baseUrl}/blog/${post.slug}`);
      
      urls.push(`  <url>
    <loc>${escapedUrl}</loc>
    <lastmod>${postLastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`);
    }
  } catch (error) {
    // Log error but return empty sitemap to prevent breaking
    console.error('Error fetching blog posts for sitemap:', error);
  }

  // Ensure at least one URL to prevent empty sitemap
  if (urls.length === 0) {
    const escapedBlogUrl = escapeXmlUrl(`${baseUrl}/blog`);
    urls.push(`  <url>
    <loc>${escapedBlogUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

