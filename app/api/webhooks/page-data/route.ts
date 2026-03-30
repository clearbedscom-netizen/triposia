import { NextRequest, NextResponse } from 'next/server';
import { getAirline, getAirlineRoutes, getAirlineFlightsFromAirport, getAirlineFlightsToAirport } from '@/lib/queries';
import { getAirportSummary, getRoutesFromAirport, getRoutesToAirport, getDepartures, getArrivals, getFlightsFromAirport, getFlightsToAirport } from '@/lib/queries';
import { getRoute, getFlightsByRoute, getRouteWithMetadata, getDestinationData } from '@/lib/queries';
import { getEditorialPage, shouldUseOldModel } from '@/lib/editorialPages';
import { formatAirportName } from '@/lib/formatting';
import { generateRouteFAQs, generateAirportFAQs, generateAirlineFAQs, generateAirlineRouteFAQs, generateAirlineAirportFAQs } from '@/lib/faqGenerators';
import { getTerminalPhones } from '@/lib/queries';

/**
 * Webhook endpoint to fetch full rendered page data
 * Used by blog admin site (blogs-eight-red.vercel.app) to fetch page data
 * 
 * GET /api/webhooks/page-data?type=airline&slug=ai
 * GET /api/webhooks/page-data?type=airline&slug=dl/atl (airline-airport page)
 * GET /api/webhooks/page-data?type=airport&slug=lga
 * GET /api/webhooks/page-data?type=route&slug=del-bom
 * GET /api/webhooks/page-data?type=airline-route&slug=dl/jfk-atl
 * GET /api/webhooks/page-data?type=flight-airport&slug=jfk
 * GET /api/webhooks/page-data?type=flight-route&slug=jfk-atl
 */
// Handle OPTIONS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const allowedOrigins = [
    'https://blogs-eight-red.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  const isAllowedReferer = referer && allowedOrigins.some(allowed => referer.includes(allowed));
  const isAdminDomain = isAllowedOrigin || isAllowedReferer;

  const headers = new Headers();
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  headers.set('Access-Control-Max-Age', '86400');

  if (isAdminDomain && origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  } else if (isAdminDomain) {
    headers.set('Access-Control-Allow-Origin', 'https://blogs-eight-red.vercel.app');
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return new NextResponse(null, {
    status: 200,
    headers,
  });
}

export async function GET(request: NextRequest) {
  // CORS configuration - Allow requests from admin domain
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const allowedOrigins = [
    'https://blogs-eight-red.vercel.app',
    'http://localhost:3000', // for local development
    'http://localhost:3001', // for local development (alternative port)
  ];

  // Check if request is from allowed origin
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  const isAllowedReferer = referer && allowedOrigins.some(allowed => referer.includes(allowed));
  const isAdminDomain = isAllowedOrigin || isAllowedReferer;

  // Build CORS headers
  const headers = new Headers();
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  headers.set('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours

  if (isAdminDomain && origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  } else if (isAdminDomain) {
    // Fallback if no origin header but referer matches
    headers.set('Access-Control-Allow-Origin', 'https://blogs-eight-red.vercel.app');
    headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    // For webhook endpoints, be more permissive with CORS
    // This helps bypass Vercel security checkpoint issues
    if (origin) {
      headers.set('Access-Control-Allow-Origin', origin);
    } else {
      // If no origin, allow all (for server-to-server calls)
      headers.set('Access-Control-Allow-Origin', '*');
    }
  }

  // Helper function to add CORS headers to any response
  const addCorsHeaders = (response: NextResponse): NextResponse => {
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    return response;
  };

  try {
    const { searchParams } = new URL(request.url);
    const pageType = searchParams.get('type');
    let slug = searchParams.get('slug');

    if (!pageType || !slug) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Missing required parameters: type and slug' },
          { status: 400 }
        )
      );
    }

    // Decode URL-encoded slug (handles %2F for forward slashes)
    slug = decodeURIComponent(slug);

    let pageData: any = {};

    switch (pageType) {
      case 'airline': {
        // Check if slug contains '/' - this indicates an airline-airport page (e.g., "dl/atl")
        if (slug.includes('/')) {
          const parts = slug.split('/');
          if (parts.length !== 2) {
            return addCorsHeaders(
              NextResponse.json({ error: 'Invalid airline-airport slug format' }, { status: 400 })
            );
          }

          const code = parts[0].toUpperCase();
          const iata = parts[1].toUpperCase();

          // Validate it's a 3-letter IATA code
          if (!/^[A-Z]{3}$/.test(iata)) {
            return addCorsHeaders(
              NextResponse.json({ error: 'Invalid airport IATA code' }, { status: 400 })
            );
          }

          const airline = await getAirline(code);
          if (!airline) {
            return addCorsHeaders(
              NextResponse.json({ error: 'Airline not found' }, { status: 404 })
            );
          }

          const airport = await getAirportSummary(iata);
          if (!airport) {
            return addCorsHeaders(
              NextResponse.json({ error: 'Airport not found' }, { status: 404 })
            );
          }

          // Get airline flights from/to airport
          const airlineIataCode = airline.iata || airline.code || code;
          const flightsFrom = await getAirlineFlightsFromAirport(airlineIataCode, iata);
          const flightsTo = await getAirlineFlightsToAirport(airlineIataCode, iata);
          const routesFrom = await getRoutesFromAirport(iata);
          const routesTo = await getRoutesToAirport(iata);
          const airportDisplay = await formatAirportName(iata, airport);
          const editorialSlug = `airlines/${code.toLowerCase()}/${iata.toLowerCase()}`;
          const editorialPage = await getEditorialPage(editorialSlug);
          const useOldModel = await shouldUseOldModel(editorialSlug);

          // Get destinations and origins (filtered by airline flights)
          const destinationsMap = new Map();
          const destinationIatas = Array.from(new Set(routesFrom.map(r => r.destination_iata)));
          const destinationAirports = await Promise.all(
            destinationIatas.slice(0, 50).map(dest => getAirportSummary(dest))
          );

          routesFrom.forEach(route => {
            const airlineFlightsToDest = flightsFrom.filter(f => f.destination_iata === route.destination_iata);
            if (airlineFlightsToDest.length > 0) {
              const destAirport = destinationAirports.find(a => a?.iata_from === route.destination_iata);
              destinationsMap.set(route.destination_iata, {
                iata: route.destination_iata,
                city: route.destination_city || destAirport?.city,
                flights_per_day: `${airlineFlightsToDest.length} flight${airlineFlightsToDest.length !== 1 ? 's' : ''}`,
              });
            }
          });
          const destinations = Array.from(destinationsMap.values());

          const originsMap = new Map();
          const uniqueOrigins = Array.from(new Set(routesTo.map(r => r.origin_iata)));
          const originAirports = await Promise.all(
            uniqueOrigins.slice(0, 50).map(origin => getAirportSummary(origin))
          );

          routesTo.forEach(route => {
            const airlineFlightsFromOrigin = flightsTo.filter(f => f.origin_iata === route.origin_iata);
            if (airlineFlightsFromOrigin.length > 0 && !originsMap.has(route.origin_iata)) {
              const originAirport = originAirports.find(a => a?.iata_from === route.origin_iata);
              originsMap.set(route.origin_iata, {
                iata: route.origin_iata,
                city: originAirport?.city || route.origin_iata,
                flights_per_day: `${airlineFlightsFromOrigin.length} flight${airlineFlightsFromOrigin.length !== 1 ? 's' : ''}`,
              });
            }
          });
          const origins = Array.from(originsMap.values());

          // Generate FAQs for airline-airport page
          const terminalPhones = await getTerminalPhones(iata, airlineIataCode);
          const destinationsWithDisplay = destinations.map(d => ({
            ...d,
            display: `${d.city || ''} (${d.iata})`,
          }));
          const originsWithDisplay = origins.map(o => ({
            ...o,
            display: `${o.city || ''} (${o.iata})`,
          }));
          const faqs = await generateAirlineAirportFAQs(
            airline,
            airport,
            flightsFrom,
            flightsTo,
            destinationsWithDisplay,
            originsWithDisplay,
            terminalPhones,
            airportDisplay
          );

          pageData = {
            type: 'airline-airport',
            slug: editorialSlug,
            airline,
            airport,
            airportDisplay,
            faqs,
            editorialPage,
            useOldModel,
          };
        } else {
          // Regular airline page
          const code = slug.toUpperCase();
          const airline = await getAirline(code);
          if (!airline) {
            return addCorsHeaders(
              NextResponse.json({ error: 'Airline not found' }, { status: 404 })
            );
          }

          const routes = await getAirlineRoutes(code);
          const editorialSlug = `airlines/${code.toLowerCase()}`;
          const editorialPage = await getEditorialPage(editorialSlug);
          const useOldModel = await shouldUseOldModel(editorialSlug);

          // Calculate countries served
          const destinationIatas = Array.from(new Set(routes.map(r => r.destination_iata)));
          const destinationAirports = await Promise.all(
            destinationIatas.slice(0, 100).map(dest => getAirportSummary(dest))
          );
          const countriesServed = new Set(
            destinationAirports.map(a => a?.country).filter(Boolean)
          );
          const countryCount = countriesServed.size || 1;

          // Calculate hub count
          const hubCount = airline.hubs && airline.hubs.length > 0 
            ? airline.hubs.length 
            : 1;

          // Generate FAQs for airline page
          const faqs = generateAirlineFAQs(airline, routes, code);

          pageData = {
            type: 'airline',
            slug: editorialSlug,
            airline,
            faqs,
            editorialPage,
            useOldModel,
          };
        }
        break;
      }

      case 'airport': {
        const iata = slug.toUpperCase();
        const airport = await getAirportSummary(iata);
        if (!airport) {
          return addCorsHeaders(
            NextResponse.json({ error: 'Airport not found' }, { status: 404 })
          );
        }

        const routesFrom = await getRoutesFromAirport(iata);
        const departures = await getDepartures(iata, 100);
        const arrivals = await getArrivals(iata, 100);
        const airportDisplay = await formatAirportName(iata, airport);
        const editorialSlug = `airports/${iata.toLowerCase()}`;
        const editorialPage = await getEditorialPage(editorialSlug);
        const useOldModel = await shouldUseOldModel(editorialSlug);

        // Generate FAQs for airport page
        const faqs = await generateAirportFAQs(airport, departures, arrivals, routesFrom.length);

        pageData = {
          type: 'airport',
          slug: editorialSlug,
          airport,
          airportDisplay,
          faqs,
          editorialPage,
          useOldModel,
        };
        break;
      }

      case 'route':
      case 'flight-route': {
        const routeParts = slug.split('-');
        if (routeParts.length !== 2) {
          return addCorsHeaders(
            NextResponse.json({ error: 'Invalid route slug format' }, { status: 400 })
          );
        }

        const origin = routeParts[0].toUpperCase();
        const destination = routeParts[1].toUpperCase();
        const route = await getRoute(origin, destination);
        const routeWithMetadata = await getRouteWithMetadata(origin, destination);
        const destinationData = await getDestinationData(origin, destination);
        const originAirport = await getAirportSummary(origin);
        const destinationAirport = await getAirportSummary(destination);
        const flights = await getFlightsByRoute(origin, destination);
        const editorialSlug = `flights/${slug}`;
        const editorialPage = await getEditorialPage(editorialSlug);
        const useOldModel = await shouldUseOldModel(editorialSlug);

        const originDisplay = await formatAirportName(origin, originAirport);
        const destinationDisplay = await formatAirportName(destination, destinationAirport);

        // Generate FAQs for route page
        const routeMetadata = routeWithMetadata ? {
          distance: routeWithMetadata.distance_km,
          averageDuration: route?.average_duration || route?.typical_duration,
        } : {};
        const distance = routeMetadata.distance;
        const averageDuration = routeMetadata.averageDuration;
        const operatingAirlines = Array.from(new Set(flights.map(f => f.airline_name).filter(Boolean)));
        const airlineCodes = Array.from(new Set(flights.map(f => f.airline_iata).filter(Boolean)));
        const airlines = (await Promise.all(
          airlineCodes.slice(0, 10).map(code => getAirline(code))
        )).filter((airline): airline is NonNullable<typeof airline> => airline !== null);
        const faqs = await generateRouteFAQs(
          flights,
          route,
          origin,
          destination,
          originAirport,
          destinationAirport,
          airlines,
          distance,
          averageDuration,
          route?.cheapest_months
        );

        pageData = {
          type: pageType === 'flight-route' ? 'flight-route' : 'route',
          slug: editorialSlug,
          originDisplay,
          destinationDisplay,
          faqs,
          editorialPage,
          useOldModel,
        };
        break;
      }

      case 'flight-airport': {
        const iata = slug.toUpperCase();
        const airport = await getAirportSummary(iata);
        if (!airport) {
          return addCorsHeaders(
            NextResponse.json({ error: 'Airport not found' }, { status: 404 })
          );
        }

        const departures = await getFlightsFromAirport(iata);
        const arrivals = await getFlightsToAirport(iata);
        const routesFrom = await getRoutesFromAirport(iata);
        const routesTo = await getRoutesToAirport(iata);
        
        // Get city from routes
        const cityFromRoute = routesTo.length > 0 ? routesTo[0].destination_city : null;
        const airportDisplay = await formatAirportName(iata, airport, cityFromRoute);
        const editorialSlug = `flights/${iata.toLowerCase()}`;
        const editorialPage = await getEditorialPage(editorialSlug);
        const useOldModel = await shouldUseOldModel(editorialSlug);

        // Generate FAQs for flight-airport page
        const faqs = await generateAirportFAQs(airport, departures, arrivals, routesFrom.length);

        pageData = {
          type: 'flight-airport',
          slug: editorialSlug,
          airport,
          airportDisplay,
          faqs,
          editorialPage,
          useOldModel,
        };
        break;
      }

      case 'airline-route': {
        // Handle both encoded (%2F) and unencoded (/) slashes
        const normalizedSlug = slug.replace(/%2F/g, '/');
        const parts = normalizedSlug.split('/');
        if (parts.length !== 2) {
          return addCorsHeaders(
            NextResponse.json({ 
              error: 'Invalid airline-route slug format', 
              received: slug,
              normalized: normalizedSlug,
              parts: parts 
            }, { status: 400 })
          );
        }

        const code = parts[0].toUpperCase();
        const routeSlug = parts[1];
        const routeParts = routeSlug.split('-');
        
        if (routeParts.length !== 2) {
          return addCorsHeaders(
            NextResponse.json({ error: 'Invalid route format' }, { status: 400 })
          );
        }

        const origin = routeParts[0].toUpperCase();
        const destination = routeParts[1].toUpperCase();
        const airline = await getAirline(code);
        if (!airline) {
          return addCorsHeaders(
            NextResponse.json({ error: 'Airline not found' }, { status: 404 })
          );
        }

        const route = await getRoute(origin, destination);
        const originAirport = await getAirportSummary(origin);
        const destinationAirport = await getAirportSummary(destination);
        const allFlights = await getFlightsByRoute(origin, destination);
        const flights = allFlights.filter(f => 
          f.airline_iata?.toUpperCase() === code.toUpperCase()
        );
        const editorialSlug = `airlines/${code.toLowerCase()}/${routeSlug}`;
        const editorialPage = await getEditorialPage(editorialSlug);
        const useOldModel = await shouldUseOldModel(editorialSlug);

        const originDisplay = await formatAirportName(origin, originAirport);
        const destinationDisplay = await formatAirportName(destination, destinationAirport);

        // Generate FAQs for airline-route page
        const routeWithMetadata = await getRouteWithMetadata(origin, destination);
        const routeMetadata = routeWithMetadata ? {
          distance: routeWithMetadata.distance_km,
          averageDuration: route?.average_duration || route?.typical_duration,
        } : {};
        const distance = routeMetadata.distance;
        const averageDuration = routeMetadata.averageDuration;
        const cheapestMonth = route?.cheapest_months;
        const flightsPerWeek = route?.flights_per_day ? Math.round(parseFloat(route.flights_per_day) * 7) : undefined;
        const originTerminalPhones = await getTerminalPhones(origin, airline.iata || airline.code || code);
        const destinationTerminalPhones = await getTerminalPhones(destination, airline.iata || airline.code || code);
        const faqs = await generateAirlineRouteFAQs(
          airline,
          flights,
          allFlights,
          origin,
          destination,
          originAirport,
          destinationAirport,
          route,
          distance,
          averageDuration,
          cheapestMonth,
          flightsPerWeek,
          undefined, // averagePrice
          originTerminalPhones,
          destinationTerminalPhones
        );

        pageData = {
          type: 'airline-route',
          slug: editorialSlug,
          airline,
          originDisplay,
          destinationDisplay,
          faqs,
          editorialPage,
          useOldModel,
        };
        break;
      }

      default:
        return addCorsHeaders(
          NextResponse.json(
            { error: `Invalid page type: ${pageType}. Valid types: airline, airline-airport, airport, route, airline-route, flight-airport, flight-route` },
            { status: 400 }
          )
        );
    }

    // Extract only headings, paragraphs, and FAQs (exclude flights, weather, prices, etc.)
    const contentOnly = extractContentOnly(pageData, pageType);

    const response = NextResponse.json({
      success: true,
      data: contentOnly,
    });

    // Add CORS headers to response
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error fetching page data:', error);
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    console.error('Request URL:', request.url);
    console.error('Page Type:', searchParams.get('type'));
    console.error('Slug:', searchParams.get('slug'));
    
    return addCorsHeaders(
      NextResponse.json(
        { 
          error: 'Internal server error', 
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      )
    );
  }
}

/**
 * Extract only headings, paragraphs, and FAQs from page data
 * Excludes flights, weather, prices, booking trends, etc.
 * Prioritizes content from pages_editorial collection if available
 */
function extractContentOnly(pageData: any, pageType: string): any {
  // Get manualContent and FAQs from content object (new structure) or legacy fields
  const manualContent = pageData.editorialPage?.content?.manualContent || pageData.editorialPage?.manualContent;
  const editorialFAQs = pageData.editorialPage?.content?.faqs || pageData.editorialPage?.faqs;

  const content: any = {
    type: pageData.type || pageType,
    slug: pageData.slug,
    headings: [],
    paragraphs: [],
    faqs: [],
    editorialPage: pageData.editorialPage ? {
      manualContent: manualContent,
    } : null,
  };

  // If editorial page has headings, paragraphs, or FAQs, use those first
  if (pageData.editorialPage) {
    // Check new content structure first
    if (pageData.editorialPage.content?.headings) {
      const headings = pageData.editorialPage.content.headings;
      // Convert h1, h2, h3 arrays to unified format
      if (headings.h1 && Array.isArray(headings.h1)) {
        content.headings.push(...headings.h1.map((text: string) => ({ level: 1, text })));
      }
      if (headings.h2 && Array.isArray(headings.h2)) {
        content.headings.push(...headings.h2.map((text: string) => ({ level: 2, text })));
      }
      if (headings.h3 && Array.isArray(headings.h3)) {
        content.headings.push(...headings.h3.map((text: string) => ({ level: 3, text })));
      }
    }
    // Fallback to legacy headings format
    if (pageData.editorialPage.headings && Array.isArray(pageData.editorialPage.headings)) {
      content.headings = pageData.editorialPage.headings;
    }
    
    if (pageData.editorialPage.content?.paragraphs && Array.isArray(pageData.editorialPage.content.paragraphs)) {
      content.paragraphs = pageData.editorialPage.content.paragraphs;
    } else if (pageData.editorialPage.paragraphs && Array.isArray(pageData.editorialPage.paragraphs)) {
      content.paragraphs = pageData.editorialPage.paragraphs;
    }
    
    if (editorialFAQs && Array.isArray(editorialFAQs)) {
      content.faqs = editorialFAQs;
    }
  }

  // If no editorial content, generate from page data
  if (content.headings.length === 0) {
    if (pageData.airline && pageData.airportDisplay) {
      // Airline-airport page
      content.headings.push({
        level: 1,
        text: `${pageData.airline.name} Flights to ${pageData.airportDisplay}`,
      });
    } else if (pageData.airline) {
      // Airline page
      content.headings.push({
        level: 1,
        text: pageData.airline.name,
      });
    }

    if (pageData.airportDisplay && !pageData.airline) {
      // Airport page
      content.headings.push({
        level: 1,
        text: pageData.airportDisplay || `${pageData.airport?.name || ''} (${pageData.airport?.iata || ''})`,
      });
    }

    if (pageData.originDisplay && pageData.destinationDisplay) {
      // Route page
      content.headings.push({
        level: 1,
        text: `Flights from ${pageData.originDisplay} to ${pageData.destinationDisplay}`,
      });
    }
  }

  if (content.paragraphs.length === 0) {
    if (pageData.airline && pageData.airportDisplay) {
      content.paragraphs.push(
        `${pageData.airline.name} operates scheduled flights to ${pageData.airportDisplay} with connections from multiple domestic and international cities.`
      );
    } else if (pageData.airline) {
      content.paragraphs.push(
        `${pageData.airline.name} operates scheduled passenger flights.`
      );
    }

    if (pageData.airportDisplay && !pageData.airline && pageData.airport) {
      content.paragraphs.push(
        `${pageData.airportDisplay} primarily handles ${pageData.airport.is_domestic ? 'domestic' : 'domestic and international'} flights.`
      );
    }

    if (pageData.originDisplay && pageData.destinationDisplay) {
      content.paragraphs.push(
        `Flights operate between ${pageData.originDisplay} and ${pageData.destinationDisplay}.`
      );
    }
  }

  // Add FAQ section heading if FAQs exist
  if ((content.faqs.length > 0 || (pageData.faqs && pageData.faqs.length > 0)) && 
      !content.headings.some((h: any) => h.text === 'Frequently Asked Questions')) {
    content.headings.push({
      level: 2,
      text: 'Frequently Asked Questions',
    });
  }

  // If no FAQs from editorial, use generated FAQs
  if (content.faqs.length === 0 && pageData.faqs && Array.isArray(pageData.faqs)) {
    content.faqs = pageData.faqs;
  }

  return content;
}

// Route segment config - mark as public API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
