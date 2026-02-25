import { MetadataRoute } from 'next';
import { COMPANY_INFO } from '@/lib/company';

// Make dynamic to prevent build issues
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || COMPANY_INFO.website;
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/mcp', '/.well-known/mcp.json'],
        disallow: [
          '/admin/',
          '/api/',
          '/api/admin/',
          '/_next/',
          // Disallow common scraping paths
          '/test/',
          '/debug/',
        ],
        crawlDelay: 1, // Add delay to discourage aggressive crawling
      },
      // Block known scrapers
      {
        userAgent: 'Scrapy',
        disallow: ['/'],
      },
      {
        userAgent: 'curl',
        disallow: ['/'],
      },
      {
        userAgent: 'wget',
        disallow: ['/'],
      },
      {
        userAgent: 'python-requests',
        disallow: ['/'],
      },
      {
        userAgent: 'Puppeteer',
        disallow: ['/'],
      },
      {
        userAgent: 'HeadlessChrome',
        disallow: ['/'],
      },
      {
        userAgent: 'Selenium',
        disallow: ['/'],
      },
      {
        userAgent: 'Playwright',
        disallow: ['/'],
      },
      // Google Search Engine
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Googlebot-News',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Googlebot-Video',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'AdsBot-Google',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      // Bing/Microsoft Search Engine
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'bingbot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'msnbot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'MSNBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'adidxbot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'BingPreview',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      // Yahoo Search Engine
      {
        userAgent: 'Slurp',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Yahoo! Slurp',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'YahooSeeker',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      // DuckDuckGo Search Engine
      {
        userAgent: 'DuckDuckBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'DuckDuckGo-Favicons-Bot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      // Yandex Search Engine
      {
        userAgent: 'Yandex',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'YandexBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'yandexbot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'YandexAccessibilityBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'YandexMobileBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'YandexDirect',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'YandexImages',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'YandexMetrika',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'YandexNews',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'YandexPagechecker',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'YandexSearch',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      // Schema.org Validators and Structured Data Validators
      {
        userAgent: 'schema.org',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Google-Structured-Data-Testing-Tool',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'RichResultsTest',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Validator.nu',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'W3C_Validator',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'W3C_I18n-Checker',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Baiduspider',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Sogou',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Exabot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'facebot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'ia_archiver',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Omgilibot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'FacebookBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Twitterbot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'rogerbot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'LinkedInBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'WhatsApp',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'FlipboardBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Applebot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'YandexImages',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'SemrushBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'AhrefsBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'DotBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-static.xml`,
      `${baseUrl}/sitemap-airports.xml`,
      `${baseUrl}/sitemap-airlines.xml`,
      `${baseUrl}/sitemap-blogs.xml`,
      // Flights sitemap parts (1-5)
      `${baseUrl}/sitemap-flights-1.xml`,
      `${baseUrl}/sitemap-flights-2.xml`,
      `${baseUrl}/sitemap-flights-3.xml`,
      `${baseUrl}/sitemap-flights-4.xml`,
      `${baseUrl}/sitemap-flights-5.xml`,
      // Airline routes sitemap parts (1-5)
      `${baseUrl}/sitemap-airline-routes-1.xml`,
      `${baseUrl}/sitemap-airline-routes-2.xml`,
      `${baseUrl}/sitemap-airline-routes-3.xml`,
      `${baseUrl}/sitemap-airline-routes-4.xml`,
      `${baseUrl}/sitemap-airline-routes-5.xml`,
      // Airline airports sitemap parts (1-5)
      `${baseUrl}/sitemap-airline-airports-1.xml`,
      `${baseUrl}/sitemap-airline-airports-2.xml`,
      `${baseUrl}/sitemap-airline-airports-3.xml`,
      `${baseUrl}/sitemap-airline-airports-4.xml`,
      `${baseUrl}/sitemap-airline-airports-5.xml`,
    ],
    // Note: llms.txt is available at /llms.txt for AI crawlers
  };
}

