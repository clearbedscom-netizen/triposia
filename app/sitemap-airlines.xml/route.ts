import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getEntityRole, getSitemapPriority } from '@/lib/entityRoles';
import { COMPANY_INFO } from '@/lib/company';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Revalidate daily

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || COMPANY_INFO.website;
  // Use a date within the last 15 days (7 days ago as default)
  const lastMod = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const db = await getDatabase();
  const airlinesCollection = db.collection<any>('airlines');
  
  // Get all airlines
  const airlines = await airlinesCollection
    .find({})
    .limit(10000) // Increased limit for separate sitemap
    .toArray();

  const urls: string[] = [];

  for (const airline of airlines) {
    const code = airline.iata?.toLowerCase() || airline.code?.toLowerCase();
    if (!code) continue;

    const role = getEntityRole('airline');
    const priority = getSitemapPriority(role);

    // Main airline page
    urls.push(`  <url>
    <loc>${baseUrl}/airlines/${code}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`);

    // Airline info/customer service page
    urls.push(`  <url>
    <loc>${baseUrl}/airlines/${code}/info</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
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

