import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Providers } from './providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FlightSearchBar from '@/components/flights/FlightSearchBar';
import ContentProtection from '@/components/layout/ContentProtection';
import SignInNotification from '@/components/faq/SignInNotification';
import { COMPANY_INFO, getSiteUrl } from '@/lib/company';
import { generateOrganizationSchema } from '@/lib/seo';
import { currentLanguageConfig } from '@/lib/i18n';
import JsonLd from '@/components/seo/JsonLd';
// Leaflet CSS is loaded dynamically when maps are used

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${COMPANY_INFO.name} - Flight Information & Airport Data`,
    template: `%s | ${COMPANY_INFO.name}`,
  },
  description: 'Comprehensive flight schedules, airport information, and airline data for travelers worldwide.',
  keywords: ['flights', 'airports', 'airlines', 'flight schedules', 'airport information', 'flight data'],
  authors: [{ name: COMPANY_INFO.name }],
  creator: COMPANY_INFO.name,
  publisher: COMPANY_INFO.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon-for-app/favicon.ico', sizes: 'any' },
      { url: '/favicon-for-public/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-for-public/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon-for-app/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: currentLanguageConfig.locale,
    alternateLocale: ['en_US'], // Future: add other locales when implemented
    url: siteUrl,
    siteName: COMPANY_INFO.name,
    title: `${COMPANY_INFO.name} - Flight Information & Airport Data`,
    description: 'Comprehensive flight schedules, airport information, and airline data for travelers worldwide.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: COMPANY_INFO.name,
        type: 'image/png',
      },
    ],
    emails: [COMPANY_INFO.email],
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'en-US': siteUrl,
      // Future: add other language URLs when implemented
      // 'es-ES': `${siteUrl}/es`,
      // 'ru-RU': `${siteUrl}/ru`,
      // 'de-DE': `${siteUrl}/de`,
      // 'ar-SA': `${siteUrl}/ar`,
      // 'he-IL': `${siteUrl}/he`,
    },
  },
  twitter: {
    card: 'summary_large_image',
    title: `${COMPANY_INFO.name} - Flight Information & Airport Data`,
    description: 'Comprehensive flight schedules, airport information, and airline data for travelers worldwide.',
    images: [`${siteUrl}/og-image.png`],
  },
  other: {
    'msapplication-TileColor': '#2563EB',
    'msapplication-TileImage': '/favicon-for-public/web-app-manifest-192x192.png',
    'theme-color': '#2563EB',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = generateOrganizationSchema();

  return (
    <html lang={currentLanguageConfig.code} dir={currentLanguageConfig.direction}>
      <head>
        <meta httpEquiv="content-language" content={currentLanguageConfig.locale} />
        <link rel="preconnect" href="https://ik.imagekit.io" />
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />
        {/* Google AdSense preconnect */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://googleads.g.doubleclick.net" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />
        {/* MCP/WebMCP Discovery */}
        <link rel="mcp-manifest" href="/.well-known/mcp.json" />
        <meta name="mcp-server" content={`${siteUrl}/api/mcp`} />
        <meta name="mcp-protocol" content="2024-11-05" />
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/_next/static/media/inter-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-B1JJ39XLHJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-B1JJ39XLHJ');
          `}
        </Script>
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3933523076239796"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <JsonLd data={organizationSchema} />
        <ContentProtection />
        <Providers>
          <SignInNotification />
          <Header />
          <FlightSearchBar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
