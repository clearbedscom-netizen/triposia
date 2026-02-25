import { NextResponse } from 'next/server';
import { getSiteUrl } from '@/lib/company';

const siteUrl = getSiteUrl();

export async function GET() {
  const manifest = {
    name: 'Triposia Flight Information',
    version: '1.0.0',
    description:
      'Comprehensive global flight information platform providing authoritative data about airports, flight routes, airlines, departures, and arrivals worldwide. Optimized for AI search engines and assistants.',
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {},
      resources: {},
    },
    serverUrl: `${siteUrl}/api/mcp`,
    website: siteUrl,
    contact: {
      email: 'info@triposia.com',
    },
    keywords: [
      'flights',
      'airlines',
      'airports',
      'aviation',
      'flight routes',
      'departures',
      'arrivals',
      'travel',
      'airline information',
      'flight schedules',
      'airport data',
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
