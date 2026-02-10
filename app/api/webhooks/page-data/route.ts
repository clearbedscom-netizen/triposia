import { NextRequest, NextResponse } from 'next/server';
import { getAirline, getAirlineRoutes } from '@/lib/queries';
import { getAirportSummary, getRoutesFromAirport, getDepartures, getArrivals } from '@/lib/queries';
import { getRoute, getFlightsByRoute } from '@/lib/queries';
import { getEditorialPage, shouldUseOldModel } from '@/lib/editorialPages';
import { formatAirportName } from '@/lib/formatting';

/**
 * Webhook endpoint to fetch full rendered page data
 * Used by admin site (admintriposia.vercel.app) to fetch page data
 * 
 * GET /api/webhooks/page-data?type=airline&slug=ai
 * GET /api/webhooks/page-data?type=airport&slug=lga
 * GET /api/webhooks/page-data?type=route&slug=del-bom
 * GET /api/webhooks/page-data?type=airline-route&slug=dl/jfk-atl
 */
export async function GET(request: NextRequest) {
  // Allow CORS for admin domain
  const origin = request.headers.get('origin');
  const isAdminDomain = origin?.includes('admintriposia.vercel.app') || 
                        request.headers.get('referer')?.includes('admintriposia.vercel.app');

  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (isAdminDomain) {
    corsHeaders['Access-Control-Allow-Origin'] = origin || 'https://admintriposia.vercel.app';
    corsHeaders['Access-Control-Allow-Credentials'] = 'true';
  }

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const pageType = searchParams.get('type');
    let slug = searchParams.get('slug');

    if (!pageType || !slug) {
      return NextResponse.json(
        { error: 'Missing required parameters: type and slug' },
        { status: 400 }
      );
    }

    // Decode URL-encoded slug (handles %2F for forward slashes)
    slug = decodeURIComponent(slug);

    let pageData: any = {};

    switch (pageType) {
      case 'airline': {
        const code = slug.toUpperCase();
        const airline = await getAirline(code);
        if (!airline) {
          return NextResponse.json({ error: 'Airline not found' }, { status: 404 });
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

        pageData = {
          type: 'airline',
          slug: editorialSlug,
          airline,
          routes,
          editorialPage,
          useOldModel,
          countryCount,
          hubCount,
          totalRoutes: routes.length,
        };
        break;
      }

      case 'airport': {
        const iata = slug.toUpperCase();
        const airport = await getAirportSummary(iata);
        if (!airport) {
          return NextResponse.json({ error: 'Airport not found' }, { status: 404 });
        }

        const routesFrom = await getRoutesFromAirport(iata);
        const departures = await getDepartures(iata, 100);
        const arrivals = await getArrivals(iata, 100);
        const airportDisplay = await formatAirportName(iata, airport);
        const editorialSlug = `airports/${iata.toLowerCase()}`;
        const editorialPage = await getEditorialPage(editorialSlug);
        const useOldModel = await shouldUseOldModel(editorialSlug);

        // Get airlines
        const airlineCodes = Array.from(new Set(departures.map(f => f.airline_iata).filter(Boolean)));
        const airlines = await Promise.all(
          airlineCodes.slice(0, 20).map(code => getAirline(code))
        );

        pageData = {
          type: 'airport',
          slug: editorialSlug,
          airport,
          routesFrom,
          departures,
          arrivals,
          airportDisplay,
          airlines: airlines.filter(Boolean),
          editorialPage,
          useOldModel,
        };
        break;
      }

      case 'route': {
        const routeParts = slug.split('-');
        if (routeParts.length !== 2) {
          return NextResponse.json({ error: 'Invalid route slug format' }, { status: 400 });
        }

        const origin = routeParts[0].toUpperCase();
        const destination = routeParts[1].toUpperCase();
        const route = await getRoute(origin, destination);
        const originAirport = await getAirportSummary(origin);
        const destinationAirport = await getAirportSummary(destination);
        const flights = await getFlightsByRoute(origin, destination);
        const editorialSlug = `flights/${slug}`;
        const editorialPage = await getEditorialPage(editorialSlug);
        const useOldModel = await shouldUseOldModel(editorialSlug);

        const originDisplay = await formatAirportName(origin, originAirport);
        const destinationDisplay = await formatAirportName(destination, destinationAirport);

        // Get operating airlines
        const airlineCodes = Array.from(new Set(flights.map(f => f.airline_iata).filter(Boolean)));
        const operatingAirlines = await Promise.all(
          airlineCodes.slice(0, 20).map(code => getAirline(code))
        );

        pageData = {
          type: 'route',
          slug: editorialSlug,
          route,
          origin,
          destination,
          originAirport,
          destinationAirport,
          originDisplay,
          destinationDisplay,
          flights,
          operatingAirlines: operatingAirlines.filter(Boolean),
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
          return NextResponse.json({ 
            error: 'Invalid airline-route slug format', 
            received: slug,
            normalized: normalizedSlug,
            parts: parts 
          }, { status: 400 });
        }

        const code = parts[0].toUpperCase();
        const routeSlug = parts[1];
        const routeParts = routeSlug.split('-');
        
        if (routeParts.length !== 2) {
          return NextResponse.json({ error: 'Invalid route format' }, { status: 400 });
        }

        const origin = routeParts[0].toUpperCase();
        const destination = routeParts[1].toUpperCase();
        const airline = await getAirline(code);
        if (!airline) {
          return NextResponse.json({ error: 'Airline not found' }, { status: 404 });
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

        pageData = {
          type: 'airline-route',
          slug: editorialSlug,
          airline,
          route,
          origin,
          destination,
          originAirport,
          destinationAirport,
          originDisplay,
          destinationDisplay,
          flights,
          allFlights,
          editorialPage,
          useOldModel,
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: `Invalid page type: ${pageType}. Valid types: airline, airport, route, airline-route` },
          { status: 400 }
        );
    }

    const response = NextResponse.json({
      success: true,
      data: pageData,
    });

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error: any) {
    console.error('Error fetching page data:', error);
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    console.error('Request URL:', request.url);
    console.error('Page Type:', searchParams.get('type'));
    console.error('Slug:', searchParams.get('slug'));
    const errorResponse = NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );

    // Add CORS headers to error response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });

    return errorResponse;
  }
}
