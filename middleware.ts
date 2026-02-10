import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Known scraper/bot user agents to block
const SCRAPER_USER_AGENTS = [
  'Scrapy',
  'Scraper',
  'curl',
  'wget',
  'python-requests',
  'Python-urllib',
  'go-http-client',
  'Java/',
  'node-fetch',
  'axios',
  'HttpClient',
  'okhttp',
  'Apache-HttpClient',
  'PostmanRuntime',
  'RestSharp',
  'Paw/',
  'Insomnia',
  'HTTPie',
  'Go-http-client',
  'Ruby',
  'php',
  'HeadlessChrome',
  'Headless',
  'Puppeteer',
  'Playwright',
  'Selenium',
  'beautifulsoup',
  'lxml',
  'Mechanize',
  'Faraday',
  'Typhoeus',
  'Mechanize',
  'WebScraping',
  'DataMiner',
  'Extractor',
  'Harvest',
  'Crawler',
  'Spider',
  'Bot',
  'bot',
  'BOT',
  // Add specific scrapers
  'scrapy',
  'ScrapyBot',
  'Masscan',
  'Zombie.js',
  'PhantomJS',
  'htmlunit',
  'HtmlUnit',
];

// Known good bots (search engines and AI platforms) - allow these
const ALLOWED_BOTS = [
  // Google Search
  'Googlebot',
  'Google-InspectionTool',
  'GoogleOther',
  'Mediapartners-Google',
  'AdsBot-Google',
  'GoogleImageBot',
  'Googlebot-Image',
  'Googlebot-News',
  'Googlebot-Video',
  'FeedFetcher-Google',
  
  // Bing/Microsoft
  'Bingbot',
  'bingbot', // Lowercase variant
  'msnbot', // MSN Bot (Microsoft)
  'MSNBot', // Uppercase variant
  'adidxbot', // Bing Ads Bot
  'BingPreview',
  'MicrosoftPreview',
  
  // DuckDuckGo
  'DuckDuckBot',
  'DuckDuckGo-Favicons-Bot',
  
  // Yandex
  'Yandex',
  'yandexbot',
  'YandexBot',
  'YandexAccessibilityBot',
  'YandexMobileBot',
  'YandexDirect',
  'YandexImages',
  'YandexMetrika',
  'YandexNews',
  'YandexPagechecker',
  'YandexSearch',
  
  // Yahoo
  'Slurp', // Yahoo
  'Yahoo! Slurp',
  'YahooSeeker',
  'Yahoo-MMCrawler',
  'YahooFeedSeeker',
  
  // Schema.org and Structured Data Validators
  'schema.org',
  'Google-Structured-Data-Testing-Tool',
  'RichResultsTest',
  'Validator.nu',
  'W3C_Validator',
  'W3C_I18n-Checker',
  'W3C_Unicorn',
  'W3C-mobileOK',
  
  // Other Search Engines
  'Baiduspider', // Baidu
  'Sogou', // Sogou
  'Exabot', // Exalead
  'ia_archiver', // Internet Archive
  'Applebot', // Apple
  'SemrushBot', // SEMrush
  'AhrefsBot', // Ahrefs
  'MJ12bot', // Majestic SEO
  'DotBot', // Moz
  
  // Social Media Bots
  'facebot', // Facebook
  'FacebookBot',
  'FacebookExternalHit',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'TelegramBot',
  'Slackbot',
  'SkypeUriPreview',
  'Discordbot',
  
  // AI Platforms - OpenAI
  'GPTBot',
  'ChatGPT-User',
  'ChatGPTUser',
  'OpenAI',
  'OpenAI-GPT',
  
  // AI Platforms - Anthropic
  'anthropic-ai',
  'Claude-Web',
  'ClaudeBot',
  'anthropic',
  
  // AI Platforms - Other
  'CCBot', // Common Crawl (used by AI)
  'PerplexityBot', // Perplexity AI
  'Perplexity',
  'YouBot', // You.com
  'BingChat', // Microsoft Bing Chat
  'Bard', // Google Bard
  'Google-Extended', // Google AI
  'Omgilibot', // Omgili
  'Diffbot', // Diffbot
  'Bytespider', // ByteDance
  'DataForSeoBot', // DataForSEO
  'MegaIndex', // MegaIndex
  'BLEXBot', // BLEXBot
  'SeznamBot', // Seznam
  'PingdomBot', // Pingdom
  'UptimeRobot', // UptimeRobot
  'StatusCake', // StatusCake
];

// IP-based rate limiting (simple in-memory store - use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // Requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function isAllowedBot(userAgent: string): boolean {
  if (!userAgent) return false;
  const uaLower = userAgent.toLowerCase();
  return ALLOWED_BOTS.some(bot => uaLower.includes(bot.toLowerCase()));
}

function isScraper(userAgent: string): boolean {
  // Allow known good bots FIRST - this is critical!
  // Check allowed bots before checking scraper patterns
  if (userAgent && isAllowedBot(userAgent)) {
    return false; // Not a scraper if it's an allowed bot
  }
  
  // Block requests without user agent (except for API routes which may not send UA)
  if (!userAgent || userAgent.trim() === '') {
    return true; // Block requests without user agent
  }
  
  const uaLower = userAgent.toLowerCase();
  
  // Check if it matches scraper patterns (but exclude generic "bot" if it's an allowed bot)
  // This extra check ensures we don't block allowed bots that might contain "bot" in their name
  for (const scraper of SCRAPER_USER_AGENTS) {
    const scraperLower = scraper.toLowerCase();
    // Skip generic "bot" pattern checks if user agent matches an allowed bot pattern
    if ((scraperLower === 'bot' || scraperLower === 'BOT') && isAllowedBot(userAgent)) {
      continue; // Skip generic bot check for allowed bots
    }
    if (uaLower.includes(scraperLower)) {
      return true;
    }
  }
  
  return false;
}

function getRateLimitKey(request: NextRequest): string {
  // Use IP address as key, or user agent if IP not available
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return ip;
}

function isAdminDomain(request: NextRequest): boolean {
  const referer = request.headers.get('referer') || '';
  const origin = request.headers.get('origin') || '';
  const host = request.headers.get('host') || '';
  
  // Check if request is from admin domain
  return (
    referer.includes('admintriposia.vercel.app') ||
    origin.includes('admintriposia.vercel.app') ||
    host.includes('admintriposia.vercel.app')
  );
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(key);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    requestCounts.set(key, {
      count: 1,
      resetTime: now + RATE_WINDOW,
    });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false; // Rate limit exceeded
  }
  
  record.count++;
  return true;
}

// Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean every minute

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for static files, API routes (except admin), webhooks, and Next.js internals
  // Webhook endpoints bypass all middleware checks (including rate limiting and scraper detection)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }
  
  // Check for scrapers
  if (isScraper(userAgent)) {
    // Return 403 Forbidden for scrapers
    return new NextResponse('Access Denied', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }
  
  // Rate limiting (skip for allowed bots, admin routes, and admin domain)
  if (!isAllowedBot(userAgent) && !pathname.startsWith('/admin') && !isAdminDomain(request)) {
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Content-Type': 'text/plain',
          'Retry-After': '60',
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
        },
      });
    }
  }
  
  // Add security headers
  const response = NextResponse.next();
  
  // Add custom headers to help identify requests
  response.headers.set('X-Request-ID', crypto.randomUUID());
  
  // Anti-scraping headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // DO NOT set X-Robots-Tag here - let page metadata control indexing
  // Only blocked scrapers get the noindex header (handled above in 403 response)
  
  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

