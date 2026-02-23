import { MetadataRoute } from 'next';
import { COMPANY_INFO } from '@/lib/company';

// Make dynamic to prevent build timeouts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || COMPANY_INFO.website;
  
  // Main sitemap index - split large sitemaps into 5 parts each
  const sitemaps: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/sitemap-static.xml`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sitemap-airports.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sitemap-airlines.xml`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sitemap-blogs.xml`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  // Add flights sitemap parts (1-5)
  for (let i = 1; i <= 5; i++) {
    sitemaps.push({
      url: `${baseUrl}/sitemap-flights-${i}.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    });
  }

  // Add airline-routes sitemap parts (1-5)
  for (let i = 1; i <= 5; i++) {
    sitemaps.push({
      url: `${baseUrl}/sitemap-airline-routes-${i}.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }

  // Add airline-airports sitemap parts (1-5)
  for (let i = 1; i <= 5; i++) {
    sitemaps.push({
      url: `${baseUrl}/sitemap-airline-airports-${i}.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    });
  }

  // Add airline-countries sitemap
  sitemaps.push({
    url: `${baseUrl}/sitemap-airline-countries.xml`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  });

  return sitemaps;
}
