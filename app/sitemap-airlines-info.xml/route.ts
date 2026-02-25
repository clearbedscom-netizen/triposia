import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { COMPANY_INFO } from '@/lib/company';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Sitemap for airline customer service / info pages only.
 * URL pattern: /airlines/[code]/info
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || COMPANY_INFO.website;
  const lastMod = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const db = await getDatabase();
  const airlinesCollection = db.collection<any>('airlines');

  const airlines = await airlinesCollection
    .find({})
    .limit(10000)
    .toArray();

  const urls: string[] = [];

  for (const airline of airlines) {
    const code = airline.iata?.toLowerCase() || airline.code?.toLowerCase();
    if (!code) continue;

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
