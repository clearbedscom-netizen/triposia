import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { COMPANY_INFO } from '@/lib/company';

// Make dynamic to prevent build timeouts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Country name to slug mapping (common countries)
const COUNTRY_SLUG_MAP: Record<string, string> = {
  'United States': 'united-states',
  'United Kingdom': 'united-kingdom',
  'United Arab Emirates': 'united-arab-emirates',
  'South Korea': 'south-korea',
  'New Zealand': 'new-zealand',
  'Saudi Arabia': 'saudi-arabia',
  'South Africa': 'south-africa',
  'Czech Republic': 'czech-republic',
  'Dominican Republic': 'dominican-republic',
  'Costa Rica': 'costa-rica',
  'El Salvador': 'el-salvador',
  'Puerto Rico': 'puerto-rico',
  'Trinidad and Tobago': 'trinidad-and-tobago',
  'Papua New Guinea': 'papua-new-guinea',
  'Burkina Faso': 'burkina-faso',
  'Cape Verde': 'cape-verde',
  'Central African Republic': 'central-african-republic',
  'Cote d\'Ivoire': 'cote-divoire',
  'Equatorial Guinea': 'equatorial-guinea',
  'French Polynesia': 'french-polynesia',
  'Marshall Islands': 'marshall-islands',
  'Northern Mariana Islands': 'northern-mariana-islands',
  'Saint Kitts and Nevis': 'saint-kitts-and-nevis',
  'Saint Lucia': 'saint-lucia',
  'Saint Vincent and the Grenadines': 'saint-vincent-and-the-grenadines',
  'Sao Tome and Principe': 'sao-tome-and-principe',
  'Solomon Islands': 'solomon-islands',
  'Timor-Leste': 'timor-leste',
  'Turks and Caicos Islands': 'turks-and-caicos-islands',
  'Virgin Islands, British': 'british-virgin-islands',
  'Virgin Islands, U.S.': 'us-virgin-islands',
};

function formatCountrySlug(countryName: string): string {
  // Check if we have a mapping
  if (COUNTRY_SLUG_MAP[countryName]) {
    return COUNTRY_SLUG_MAP[countryName];
  }
  
  // Convert to lowercase and replace spaces with hyphens
  return countryName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || COMPANY_INFO.website;
  // Use a date within the last 15 days (7 days ago as default)
  const lastMod = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const db = await getDatabase();
  const urls: string[] = [];

  // Get all airlines (reduced limit for speed)
  const airlinesCollection = db.collection<any>('airlines');
  const airlines = await airlinesCollection
    .find({})
    .limit(1000) // Reduced for speed - focus on major airlines
    .toArray();

  // Build airport IATA -> country map efficiently using aggregation
  const airportsCollection = db.collection<any>('airports');
  const airportFinalCollection = db.collection<any>('airportfinal');
  
  // Get airport-country mappings efficiently (reduced limit for speed)
  const [airportDocs, airportFinalDocs] = await Promise.all([
    airportsCollection
      .find({ country: { $exists: true, $ne: null } })
      .project({ iata: 1, iata_from: 1, country: 1 })
      .limit(10000) // Reduced for speed
      .toArray(),
    airportFinalCollection
      .find({ country: { $exists: true, $ne: null } })
      .project({ iata: 1, country: 1 })
      .limit(10000) // Reduced for speed
      .toArray(),
  ]);

  // Create a map of airport IATA -> country
  const airportCountryMap = new Map<string, string>();
  airportDocs.forEach((airport: any) => {
    const iata = (airport.iata_from || airport.iata || '').toUpperCase();
    const country = airport.country;
    if (iata && country) {
      airportCountryMap.set(iata, country);
    }
  });
  
  airportFinalDocs.forEach((airport: any) => {
    const iata = (airport.iata || '').toUpperCase();
    const country = airport.country;
    if (iata && country && !airportCountryMap.has(iata)) {
      airportCountryMap.set(iata, country);
    }
  });

  // Use aggregation to get unique airline-country combinations in one query
  // This is much faster than looping through each airline
  const departuresCollection = db.collection<any>('departures');
  const arrivalsCollection = db.collection<any>('arrivals');
  
  // Get distinct airline-airport combinations efficiently
  // Use a smaller sample and process in memory for speed
  const [departurePairs, arrivalPairs] = await Promise.all([
    departuresCollection
      .find(
        { airline_iata: { $exists: true, $ne: null } },
        { projection: { airline_iata: 1, origin_iata: 1, destination_iata: 1 } }
      )
      .limit(10000) // Smaller sample for speed
      .toArray(),
    arrivalsCollection
      .find(
        { airline_iata: { $exists: true, $ne: null } },
        { projection: { airline_iata: 1, origin_iata: 1, destination_iata: 1 } }
      )
      .limit(10000) // Smaller sample for speed
      .toArray(),
  ]);

  // Create a map of airline -> countries
  const airlineCountriesMap = new Map<string, Set<string>>();
  
  // Process departure pairs
  departurePairs.forEach((item: any) => {
    const airlineCode = (item.airline_iata || '').toUpperCase();
    if (!airlineCode) return;
    
    const code = airlineCode.toLowerCase();
    if (!airlineCountriesMap.has(code)) {
      airlineCountriesMap.set(code, new Set());
    }
    
    const countries = airlineCountriesMap.get(code)!;
    
    if (item.origin_iata) {
      const country = airportCountryMap.get(item.origin_iata.toUpperCase());
      if (country) countries.add(country);
    }
    if (item.destination_iata) {
      const country = airportCountryMap.get(item.destination_iata.toUpperCase());
      if (country) countries.add(country);
    }
  });
  
  // Process arrival pairs
  arrivalPairs.forEach((item: any) => {
    const airlineCode = (item.airline_iata || '').toUpperCase();
    if (!airlineCode) return;
    
    const code = airlineCode.toLowerCase();
    if (!airlineCountriesMap.has(code)) {
      airlineCountriesMap.set(code, new Set());
    }
    
    const countries = airlineCountriesMap.get(code)!;
    
    if (item.origin_iata) {
      const country = airportCountryMap.get(item.origin_iata.toUpperCase());
      if (country) countries.add(country);
    }
    if (item.destination_iata) {
      const country = airportCountryMap.get(item.destination_iata.toUpperCase());
      if (country) countries.add(country);
    }
  });

  // Generate airline-country pages
  for (const airline of airlines) {
    const code = airline.iata?.toLowerCase() || airline.code?.toLowerCase();
    if (!code) continue;

    const uniqueCountries = airlineCountriesMap.get(code);
    if (!uniqueCountries || uniqueCountries.size === 0) continue;

    // Generate URL for each country
    for (const countryName of uniqueCountries) {
      const countrySlug = formatCountrySlug(countryName);
      if (!countrySlug) continue;
      
      urls.push(`  <url>
    <loc>${baseUrl}/airlines/${code}/country/${countrySlug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  }

  // Ensure at least one URL exists
  if (urls.length === 0) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/airlines</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
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
