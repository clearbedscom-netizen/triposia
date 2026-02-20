import { Metadata } from 'next';
import { COMPANY_INFO, getSiteUrl } from './company';

export interface SeoConfig {
  title: string;
  description: string;
  canonical?: string;
  noindex?: boolean;
  structuredData?: Record<string, any>;
  image?: string;
  type?: 'website' | 'article';
  keywords?: string[];
}

import { optimizeTitle, optimizeDescription } from './metadata-utils';
import { currentLanguageConfig } from './i18n';

export function generateMetadata(config: SeoConfig): Metadata {
  const siteUrl = getSiteUrl();
  const canonicalUrl = config.canonical ? `${siteUrl}${config.canonical}` : siteUrl;
  const ogImage = config.image || `${siteUrl}/og-image.png`;

  // Optimize title and description for Bing/Yandex SEO
  const optimizedTitle = optimizeTitle(config.title);
  const optimizedDescription = optimizeDescription(config.description);

  const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: optimizedTitle,
    description: optimizedDescription,
    keywords: config.keywords || ['flights', 'airports', 'airlines', 'flight schedules', 'flight information'],
    authors: [{ name: COMPANY_INFO.name }],
    creator: COMPANY_INFO.name,
    publisher: COMPANY_INFO.name,
    robots: {
      index: !config.noindex,
      follow: !config.noindex,
      googleBot: {
        index: !config.noindex,
        follow: !config.noindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: optimizedTitle,
      description: optimizedDescription,
      url: canonicalUrl,
      siteName: COMPANY_INFO.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: config.title,
          type: 'image/png',
        },
      ],
      locale: currentLanguageConfig.locale,
      type: config.type || 'website',
      emails: [COMPANY_INFO.email],
    },
    twitter: {
      card: 'summary_large_image',
      title: optimizedTitle,
      description: optimizedDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        [`${currentLanguageConfig.code}-${currentLanguageConfig.locale.split('_')[1]}`]: canonicalUrl,
      },
    },
    other: {
      'content-language': currentLanguageConfig.locale,
      'og:email': COMPANY_INFO.email,
      'article:author': COMPANY_INFO.name,
    },
  };

  return metadata;
}

/**
 * Generate Organization schema with social media handles
 */
export function generateOrganizationSchema() {
  const socialLinks = [
    COMPANY_INFO.social.facebook,
    COMPANY_INFO.social.instagram,
    COMPANY_INFO.social.youtube,
    COMPANY_INFO.social.dailymotion,
  ].filter(Boolean); // Remove any undefined/null values

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: COMPANY_INFO.name,
    url: COMPANY_INFO.website,
    logo: `${getSiteUrl()}/logo.png`,
    email: COMPANY_INFO.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY_INFO.address.street,
      addressLocality: COMPANY_INFO.address.city,
      addressRegion: COMPANY_INFO.address.state,
      postalCode: COMPANY_INFO.address.zip,
      addressCountry: 'US',
    },
    sameAs: socialLinks,
  };
}

export function generateBreadcrumbList(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateAirportSchema(iata: string, name: string, city?: string, country?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Airport',
    iataCode: iata,
    name: name,
    ...(city && { address: { '@type': 'PostalAddress', addressLocality: city, ...(country && { addressCountry: country }) } }),
  };
}

export function generateFlightRouteSchema(
  origin: string,
  destination: string,
  originCity: string,
  destinationCity: string,
  flightsPerDay?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Flight',
    departureAirport: {
      '@type': 'Airport',
      iataCode: origin,
      name: `${originCity} Airport`,
    },
    arrivalAirport: {
      '@type': 'Airport',
      iataCode: destination,
      name: `${destinationCity} Airport`,
    },
    ...(flightsPerDay && { description: `Daily flights: ${flightsPerDay}` }),
  };
}

export function generateFlightListingSchema(
  flights: Array<{
    flight_number?: string;
    airline_name?: string;
    origin_iata?: string;
    destination_iata?: string;
    departure_time?: string;
    arrival_time?: string;
    aircraft?: string;
  }>,
  origin: string,
  destination: string,
  originCity: string,
  destinationCity: string
) {
  // Filter out flights with missing required data
  const validFlights = flights.filter(
    f => f.flight_number && f.airline_name && f.origin_iata && f.destination_iata && f.departure_time && f.arrival_time
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Flights from ${originCity} (${origin}) to ${destinationCity} (${destination})`,
    description: `List of ${validFlights.length} flights from ${originCity} to ${destinationCity}`,
    numberOfItems: validFlights.length,
    itemListElement: validFlights.map((flight, index) => ({
      '@type': 'ListItem',
      position: index + 1,
        item: {
          '@type': 'Flight',
          flightNumber: flight.flight_number!,
          provider: {
            '@type': 'Airline',
            name: flight.airline_name!,
          },
          departureAirport: {
            '@type': 'Airport',
            iataCode: flight.origin_iata!,
            name: `${originCity} Airport`,
          },
          arrivalAirport: {
            '@type': 'Airport',
            iataCode: flight.destination_iata!,
            name: `${destinationCity} Airport`,
          },
          departureTime: flight.departure_time!,
          arrivalTime: flight.arrival_time!,
          ...(flight.aircraft && { aircraft: flight.aircraft }),
        },
    })),
  };
}

export function generatePriceCalendarSchema(
  monthlyPrices: Array<{ month: string; price: number }>,
  origin: string,
  destination: string,
  originCity: string,
  destinationCity: string,
  averagePrice?: number
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Monthly flight prices from ${originCity} (${origin}) to ${destinationCity} (${destination})`,
    description: `Average flight prices by month for round-trip flights from ${originCity} to ${destinationCity}`,
    numberOfItems: monthlyPrices.length,
    ...(averagePrice && {
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 0,
          item: {
            '@type': 'PriceSpecification',
            price: averagePrice,
            priceCurrency: 'USD',
            name: `Average flight price from ${originCity} to ${destinationCity}`,
          },
        },
        ...monthlyPrices.map((mp, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          item: {
            '@type': 'PriceSpecification',
            price: mp.price,
            priceCurrency: 'USD',
            name: `${mp.month} flight prices from ${originCity} to ${destinationCity}`,
            description: `Average flight price in ${mp.month} for round-trip flights`,
          },
        })),
      ],
    }),
  };
}

export function generateFlightScheduleSchema(
  flights: Array<{
    flight_number?: string;
    airline_name?: string;
    origin_iata?: string;
    destination_iata?: string;
    departure_time?: string;
    arrival_time?: string;
  }>,
  origin: string,
  destination: string,
  originCity: string,
  destinationCity: string
) {
  const validFlights = flights.filter(
    f => f.flight_number && f.airline_name && f.origin_iata && f.destination_iata && f.departure_time && f.arrival_time
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Flight schedule from ${originCity} (${origin}) to ${destinationCity} (${destination})`,
    description: `Daily flight schedule with ${validFlights.length} flights`,
    numberOfItems: validFlights.length,
    itemListElement: validFlights.map((flight, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Flight',
        flightNumber: flight.flight_number!,
        provider: {
          '@type': 'Airline',
          name: flight.airline_name!,
        },
        departureAirport: {
          '@type': 'Airport',
          iataCode: flight.origin_iata!,
          name: `${originCity} Airport`,
        },
        arrivalAirport: {
          '@type': 'Airport',
          iataCode: flight.destination_iata!,
          name: `${destinationCity} Airport`,
        },
        departureTime: flight.departure_time!,
        arrivalTime: flight.arrival_time!,
      },
    })),
  };
}

export function generateAirlineSchema(
  code: string,
  name: string,
  country?: string,
  website?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: name,
    identifier: code,
    ...(country && { address: { '@type': 'PostalAddress', addressCountry: country } }),
    ...(website && { url: website }),
  };
}

export function generateFAQPageSchema(
  faqs: Array<{ question: string; answer: string }>,
  name?: string
) {
  if (faqs.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
    ...(name && { name }),
  };
}

/**
 * Generate LocalBusiness schema for airline terminal/contact information
 */
export function generateAirlineLocalBusinessSchema(
  airlineName: string,
  airlineCode: string,
  airportName: string,
  airportIata: string,
  terminal?: string,
  phone?: string,
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  },
  website?: string
) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${airlineName} - ${airportName}${terminal ? ` Terminal ${terminal}` : ''}`,
    description: `${airlineName} customer service and terminal information at ${airportName}`,
  };

  if (phone) {
    schema.telephone = phone;
  }

  if (address) {
    schema.address = {
      '@type': 'PostalAddress',
      ...(address.streetAddress && { streetAddress: address.streetAddress }),
      ...(address.addressLocality && { addressLocality: address.addressLocality }),
      ...(address.addressRegion && { addressRegion: address.addressRegion }),
      ...(address.postalCode && { postalCode: address.postalCode }),
      ...(address.addressCountry && { addressCountry: address.addressCountry }),
    };
  } else if (airportName) {
    // Fallback to airport name as location
    schema.address = {
      '@type': 'PostalAddress',
      addressLocality: airportName,
    };
  }

  if (terminal) {
    schema.location = {
      '@type': 'Place',
      name: `${airlineName} Terminal ${terminal}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: airportName,
      },
    };
  }

  if (website) {
    schema.url = website;
  }

  schema.areaServed = {
    '@type': 'City',
    name: airportName,
  };

  return schema;
}

/**
 * Generate flight listing schema for airport departures
 */
export function generateAirportDeparturesListingSchema(
  flights: Array<{
    flight_number?: string;
    airline_name?: string;
    origin_iata?: string;
    destination_iata?: string;
    departure_time?: string;
    arrival_time?: string;
    aircraft?: string;
  }>,
  airportIata: string,
  airportDisplay: string
) {
  const validFlights = flights.filter(
    f => f.flight_number && f.airline_name && f.origin_iata && f.destination_iata && f.departure_time && f.arrival_time
  );

  if (validFlights.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Flights departing from ${airportDisplay}`,
    description: `List of ${validFlights.length} flights departing from ${airportDisplay}`,
    numberOfItems: validFlights.length,
    itemListElement: validFlights.map((flight, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Flight',
        flightNumber: flight.flight_number!,
        provider: {
          '@type': 'Airline',
          name: flight.airline_name!,
        },
        departureAirport: {
          '@type': 'Airport',
          iataCode: flight.origin_iata!,
          name: airportDisplay,
        },
        arrivalAirport: {
          '@type': 'Airport',
          iataCode: flight.destination_iata!,
        },
        departureTime: flight.departure_time!,
        arrivalTime: flight.arrival_time!,
        ...(flight.aircraft && { aircraft: flight.aircraft }),
      },
    })),
  };
}

/**
 * Generate flight schedule schema for airport departures
 */
export function generateAirportDeparturesScheduleSchema(
  flights: Array<{
    flight_number?: string;
    airline_name?: string;
    origin_iata?: string;
    destination_iata?: string;
    departure_time?: string;
    arrival_time?: string;
  }>,
  airportIata: string,
  airportDisplay: string
) {
  const validFlights = flights.filter(
    f => f.flight_number && f.airline_name && f.origin_iata && f.destination_iata && f.departure_time && f.arrival_time
  );

  if (validFlights.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Flight schedule - Departures from ${airportDisplay}`,
    description: `Daily flight schedule with ${validFlights.length} departures from ${airportDisplay}`,
    numberOfItems: validFlights.length,
    itemListElement: validFlights.map((flight, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Flight',
        flightNumber: flight.flight_number!,
        provider: {
          '@type': 'Airline',
          name: flight.airline_name!,
        },
        departureAirport: {
          '@type': 'Airport',
          iataCode: flight.origin_iata!,
          name: airportDisplay,
        },
        arrivalAirport: {
          '@type': 'Airport',
          iataCode: flight.destination_iata!,
        },
        departureTime: flight.departure_time!,
        arrivalTime: flight.arrival_time!,
      },
    })),
  };
}

/**
 * Generate flight listing schema for airport arrivals
 */
export function generateAirportArrivalsListingSchema(
  flights: Array<{
    flight_number?: string;
    airline_name?: string;
    origin_iata?: string;
    destination_iata?: string;
    departure_time?: string;
    arrival_time?: string;
    aircraft?: string;
  }>,
  airportIata: string,
  airportDisplay: string
) {
  const validFlights = flights.filter(
    f => f.flight_number && f.airline_name && f.origin_iata && f.destination_iata && f.departure_time && f.arrival_time
  );

  if (validFlights.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Flights arriving at ${airportDisplay}`,
    description: `List of ${validFlights.length} flights arriving at ${airportDisplay}`,
    numberOfItems: validFlights.length,
    itemListElement: validFlights.map((flight, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Flight',
        flightNumber: flight.flight_number!,
        provider: {
          '@type': 'Airline',
          name: flight.airline_name!,
        },
        departureAirport: {
          '@type': 'Airport',
          iataCode: flight.origin_iata!,
        },
        arrivalAirport: {
          '@type': 'Airport',
          iataCode: flight.destination_iata!,
          name: airportDisplay,
        },
        departureTime: flight.departure_time!,
        arrivalTime: flight.arrival_time!,
        ...(flight.aircraft && { aircraft: flight.aircraft }),
      },
    })),
  };
}

/**
 * Generate flight schedule schema for airport arrivals
 */
export function generateAirportArrivalsScheduleSchema(
  flights: Array<{
    flight_number?: string;
    airline_name?: string;
    origin_iata?: string;
    destination_iata?: string;
    departure_time?: string;
    arrival_time?: string;
  }>,
  airportIata: string,
  airportDisplay: string
) {
  const validFlights = flights.filter(
    f => f.flight_number && f.airline_name && f.origin_iata && f.destination_iata && f.departure_time && f.arrival_time
  );

  if (validFlights.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Flight schedule - Arrivals at ${airportDisplay}`,
    description: `Daily flight schedule with ${validFlights.length} arrivals at ${airportDisplay}`,
    numberOfItems: validFlights.length,
    itemListElement: validFlights.map((flight, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Flight',
        flightNumber: flight.flight_number!,
        provider: {
          '@type': 'Airline',
          name: flight.airline_name!,
        },
        departureAirport: {
          '@type': 'Airport',
          iataCode: flight.origin_iata!,
        },
        arrivalAirport: {
          '@type': 'Airport',
          iataCode: flight.destination_iata!,
          name: airportDisplay,
        },
        departureTime: flight.departure_time!,
        arrivalTime: flight.arrival_time!,
      },
    })),
  };
}

/**
 * Generate combined flights list schema for airport page (all flights: departures + arrivals)
 */
export function generateAirportFlightsListSchema(
  departures: Array<{
    flight_number?: string;
    airline_name?: string;
    airline_iata?: string;
    origin_iata?: string;
    destination_iata?: string;
    departure_time?: string;
    arrival_time?: string;
    aircraft?: string;
  }>,
  arrivals: Array<{
    flight_number?: string;
    airline_name?: string;
    airline_iata?: string;
    origin_iata?: string;
    destination_iata?: string;
    departure_time?: string;
    arrival_time?: string;
    aircraft?: string;
  }>,
  airportIata: string,
  airportDisplay: string
) {
  // Create a Set of departure flight IDs for quick lookup
  const departureIds = new Set(
    departures
      .filter(f => f.flight_number && f.origin_iata && f.destination_iata)
      .map(f => `${f.flight_number}-${f.origin_iata}-${f.destination_iata}`)
  );
  
  // Combine all flights with metadata about whether they're departures or arrivals
  const allFlights = [
    ...departures.map(f => ({ ...f, isDeparture: true })),
    ...arrivals.map(f => ({ ...f, isDeparture: false })),
  ];
  
  const validFlights = allFlights.filter(
    f => f.flight_number && f.airline_name && f.origin_iata && f.destination_iata && f.departure_time && f.arrival_time
  );

  if (validFlights.length === 0) {
    return null;
  }

  const validDepartures = departures.filter(
    f => f.flight_number && f.airline_name && f.origin_iata && f.destination_iata && f.departure_time && f.arrival_time
  );
  const validArrivals = arrivals.filter(
    f => f.flight_number && f.airline_name && f.origin_iata && f.destination_iata && f.departure_time && f.arrival_time
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `All flights at ${airportDisplay}`,
    description: `Complete list of ${validFlights.length} flights (${validDepartures.length} departures and ${validArrivals.length} arrivals) at ${airportDisplay}`,
    numberOfItems: validFlights.length,
    itemListElement: validFlights.map((flight, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Flight',
        flightNumber: flight.flight_number!,
        provider: {
          '@type': 'Airline',
          name: flight.airline_name!,
          ...(flight.airline_iata && { iataCode: flight.airline_iata }),
        },
        departureAirport: {
          '@type': 'Airport',
          iataCode: flight.origin_iata!,
          ...((flight as any).isDeparture && { name: airportDisplay }),
        },
        arrivalAirport: {
          '@type': 'Airport',
          iataCode: flight.destination_iata!,
          ...(!(flight as any).isDeparture && { name: airportDisplay }),
        },
        departureTime: flight.departure_time!,
        arrivalTime: flight.arrival_time!,
        ...(flight.aircraft && { aircraft: flight.aircraft }),
      },
    })),
  };
}

/**
 * Generate airline schedule schema grouped by airline for airport page
 */
export function generateAirlineScheduleSchema(
  flights: Array<{
    flight_number?: string;
    airline_name?: string;
    airline_iata?: string;
    origin_iata?: string;
    destination_iata?: string;
    departure_time?: string;
    arrival_time?: string;
  }>,
  airportIata: string,
  airportDisplay: string,
  isDeparture: boolean = true
) {
  const validFlights = flights.filter(
    f => f.flight_number && f.airline_name && f.origin_iata && f.destination_iata && f.departure_time && f.arrival_time
  );

  if (validFlights.length === 0) {
    return null;
  }

  // Group flights by airline
  const flightsByAirline = new Map<string, typeof validFlights>();
  validFlights.forEach(flight => {
    const airlineKey = flight.airline_name || 'Unknown';
    if (!flightsByAirline.has(airlineKey)) {
      flightsByAirline.set(airlineKey, []);
    }
    flightsByAirline.get(airlineKey)!.push(flight);
  });

  // Create schedule entries for each airline
  const scheduleEntries = Array.from(flightsByAirline.entries()).map(([airlineName, airlineFlights]) => ({
    '@type': 'Schedule',
    name: `${airlineName} ${isDeparture ? 'departures' : 'arrivals'} from ${airportDisplay}`,
    description: `Daily ${isDeparture ? 'departure' : 'arrival'} schedule for ${airlineName} at ${airportDisplay}`,
    scheduleTimezone: 'UTC',
    event: airlineFlights.map(flight => ({
      '@type': 'Flight',
      flightNumber: flight.flight_number!,
      provider: {
        '@type': 'Airline',
        name: flight.airline_name!,
        ...(flight.airline_iata && { iataCode: flight.airline_iata }),
      },
      departureAirport: {
        '@type': 'Airport',
        iataCode: flight.origin_iata!,
        ...(isDeparture && { name: airportDisplay }),
      },
      arrivalAirport: {
        '@type': 'Airport',
        iataCode: flight.destination_iata!,
        ...(!isDeparture && { name: airportDisplay }),
      },
      departureTime: flight.departure_time!,
      arrivalTime: flight.arrival_time!,
    })),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Airline schedules ${isDeparture ? 'from' : 'to'} ${airportDisplay}`,
    description: `Flight schedules grouped by airline ${isDeparture ? 'departing from' : 'arriving at'} ${airportDisplay}`,
    numberOfItems: flightsByAirline.size,
    itemListElement: scheduleEntries.map((schedule, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: schedule,
    })),
  };
}

/**
 * Generate airline flight listing schema for airline route pages
 */
export function generateAirlineFlightListingSchema(
  flights: Array<{
    flight_number?: string;
    airline_name?: string;
    airline_iata?: string;
    origin_iata?: string;
    destination_iata?: string;
    departure_time?: string;
    arrival_time?: string;
    aircraft?: string;
  }>,
  airlineName: string,
  airlineCode: string,
  origin: string,
  destination: string,
  originDisplay: string,
  destinationDisplay: string
) {
  const validFlights = flights.filter(
    f => f.flight_number && f.airline_name && f.origin_iata && f.destination_iata && f.departure_time && f.arrival_time
  );

  if (validFlights.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${airlineName} flights from ${originDisplay} to ${destinationDisplay}`,
    description: `List of ${validFlights.length} ${airlineName} flights from ${originDisplay} to ${destinationDisplay}`,
    numberOfItems: validFlights.length,
    itemListElement: validFlights.map((flight, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Flight',
        flightNumber: flight.flight_number!,
        provider: {
          '@type': 'Airline',
          name: flight.airline_name!,
          ...(flight.airline_iata && { iataCode: flight.airline_iata }),
        },
        departureAirport: {
          '@type': 'Airport',
          iataCode: flight.origin_iata!,
          name: originDisplay,
        },
        arrivalAirport: {
          '@type': 'Airport',
          iataCode: flight.destination_iata!,
          name: destinationDisplay,
        },
        departureTime: flight.departure_time!,
        arrivalTime: flight.arrival_time!,
        ...(flight.aircraft && { aircraft: flight.aircraft }),
      },
    })),
  };
}

/**
 * Generate airline schedule schema for airline route pages
 */
export function generateAirlineRouteScheduleSchema(
  flights: Array<{
    flight_number?: string;
    airline_name?: string;
    airline_iata?: string;
    origin_iata?: string;
    destination_iata?: string;
    departure_time?: string;
    arrival_time?: string;
  }>,
  airlineName: string,
  origin: string,
  destination: string,
  originDisplay: string,
  destinationDisplay: string
) {
  const validFlights = flights.filter(
    f => f.flight_number && f.airline_name && f.origin_iata && f.destination_iata && f.departure_time && f.arrival_time
  );

  if (validFlights.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${airlineName} flight schedule from ${originDisplay} to ${destinationDisplay}`,
    description: `Daily ${airlineName} flight schedule with ${validFlights.length} flights from ${originDisplay} to ${destinationDisplay}`,
    numberOfItems: validFlights.length,
    itemListElement: validFlights.map((flight, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Flight',
        flightNumber: flight.flight_number!,
        provider: {
          '@type': 'Airline',
          name: flight.airline_name!,
          ...(flight.airline_iata && { iataCode: flight.airline_iata }),
        },
        departureAirport: {
          '@type': 'Airport',
          iataCode: flight.origin_iata!,
          name: originDisplay,
        },
        arrivalAirport: {
          '@type': 'Airport',
          iataCode: flight.destination_iata!,
          name: destinationDisplay,
        },
        departureTime: flight.departure_time!,
        arrivalTime: flight.arrival_time!,
      },
    })),
  };
}

/**
 * Generate Person schema for authors with full details
 */
export function generatePersonSchema({
  name,
  url,
  image,
  description,
  jobTitle,
  sameAs,
  email,
  worksFor,
}: {
  name: string;
  url?: string;
  image?: string;
  description?: string;
  jobTitle?: string;
  sameAs?: string[];
  email?: string;
  worksFor?: {
    '@type'?: string;
    name: string;
    url?: string;
  };
}) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    ...(url && { url }),
    ...(image && {
      image: {
        '@type': 'ImageObject',
        url: image,
      },
    }),
    ...(description && { description }),
    ...(jobTitle && { jobTitle }),
    ...(email && { email }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
    ...(worksFor && {
      worksFor: {
        '@type': worksFor['@type'] || 'Organization',
        name: worksFor.name,
        ...(worksFor.url && { url: worksFor.url }),
      },
    }),
  };
  
  return schema;
}

/**
 * Generate BlogPosting schema (more specific than Article for blogs)
 */
export function generateBlogPostingSchema({
  title,
  description,
  publishedTime,
  modifiedTime,
  image,
  authorName,
  authorUrl,
  authorImage,
  authorBio,
  authorJobTitle,
  authorEmail,
  authorSameAs,
  url,
  category,
  keywords,
  wordCount,
  readingTime,
  mainEntityOfPage,
}: {
  title: string;
  description: string;
  publishedTime: string;
  modifiedTime?: string;
  image?: string;
  authorName: string;
  authorUrl?: string;
  authorImage?: string;
  authorBio?: string;
  authorJobTitle?: string;
  authorEmail?: string;
  authorSameAs?: string[];
  url: string;
  category?: string;
  keywords?: string[];
  wordCount?: number;
  readingTime?: number;
  mainEntityOfPage?: string;
}) {
  const siteUrl = getSiteUrl();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    author: {
      '@type': 'Person',
      name: authorName,
      ...(authorUrl && { url: authorUrl }),
      ...(authorImage && {
        image: {
          '@type': 'ImageObject',
          url: authorImage,
        },
      }),
      ...(authorBio && { description: authorBio }),
      ...(authorJobTitle && { jobTitle: authorJobTitle }),
      ...(authorEmail && { email: authorEmail }),
      ...(authorSameAs && authorSameAs.length > 0 && { sameAs: authorSameAs }),
      worksFor: {
        '@type': 'Organization',
        name: COMPANY_INFO.name,
        url: COMPANY_INFO.website,
      },
    },
    publisher: {
      '@type': 'Organization',
      name: COMPANY_INFO.name,
      url: COMPANY_INFO.website,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
        width: 600,
        height: 60,
      },
      sameAs: [
        // Add social media links if available in COMPANY_INFO
      ],
    },
    datePublished: publishedTime,
    ...(modifiedTime && { dateModified: modifiedTime }),
    ...(image && {
      image: typeof image === 'string' ? {
        '@type': 'ImageObject',
        url: image,
        contentUrl: image,
        width: 1200,
        height: 630,
        encodingFormat: image.match(/\.(jpg|jpeg)$/i) ? 'image/jpeg' : 
                       image.match(/\.png$/i) ? 'image/png' :
                       image.match(/\.webp$/i) ? 'image/webp' :
                       image.match(/\.gif$/i) ? 'image/gif' : 'image/jpeg',
        caption: title,
      } : image, // If image is already an object (from generateImageSchema), use it as-is
    }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': mainEntityOfPage || url,
    },
    ...(category && {
      articleSection: category,
    }),
    ...(keywords && keywords.length > 0 && {
      keywords: keywords.join(', '),
    }),
    ...(wordCount && {
      wordCount,
    }),
    ...(readingTime && {
      timeRequired: `PT${readingTime}M`,
    }),
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    url,
  };
}

/**
 * Generate WebPage schema for blog posts
 */
export function generateWebPageSchema({
  name,
  description,
  url,
  image,
  datePublished,
  dateModified,
  author,
  breadcrumb,
}: {
  name: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  breadcrumb?: Array<{ name: string; url: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
    ...(image && {
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: image,
      },
      image: {
        '@type': 'ImageObject',
        url: image,
      },
    }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    ...(author && {
      author: {
        '@type': 'Person',
        name: author,
      },
    }),
    ...(breadcrumb && breadcrumb.length > 0 && {
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumb.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      },
    }),
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: COMPANY_INFO.name,
      url: getSiteUrl(),
    },
  };
}

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Generate VideoObject schema for YouTube videos (optimized for Google Discover and Bing Discover)
 */
export function generateVideoObjectSchema({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
  contentUrl,
  embedUrl,
  publisherName,
  publisherLogo,
}: {
  name: string;
  description: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  duration?: string; // ISO 8601 duration format (e.g., "PT5M30S")
  contentUrl: string; // YouTube video URL
  embedUrl?: string; // YouTube embed URL
  publisherName?: string;
  publisherLogo?: string;
}) {
  const siteUrl = getSiteUrl();
  
  // Extract video ID for embed URL if not provided
  const videoId = extractYouTubeVideoId(contentUrl);
  const embedUrlFinal = embedUrl || (videoId ? `https://www.youtube.com/embed/${videoId}` : undefined);
  const thumbnailUrlFinal = thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : undefined);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    thumbnailUrl: thumbnailUrlFinal || `${siteUrl}/og-image.png`,
    uploadDate: uploadDate || new Date().toISOString(),
    ...(duration && { duration }),
    contentUrl,
    embedUrl: embedUrlFinal,
    publisher: {
      '@type': 'Organization',
      name: publisherName || COMPANY_INFO.name,
      logo: {
        '@type': 'ImageObject',
        url: publisherLogo || `${siteUrl}/logo.png`,
        width: 600,
        height: 60,
      },
    },
    // Additional properties for better SEO and Discover optimization
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    // For Google Discover and Bing Discover
    potentialAction: {
      '@type': 'WatchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: contentUrl,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
    },
    // Additional properties for better visibility
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'WatchAction' },
    },
    // Video quality indicators
    videoQuality: 'HD',
    // For better indexing
    mainEntity: {
      '@type': 'WebPage',
      '@id': contentUrl,
    },
  };
}

/**
 * Generate ItemList schema for blog listing pages
 */
export function generateBlogListSchema({
  name,
  description,
  items,
  url,
}: {
  name: string;
  description: string;
  items: Array<{
    name: string;
    url: string;
    description?: string;
    image?: string;
    datePublished?: string;
  }>;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    url,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'BlogPosting',
        name: item.name,
        url: item.url,
        ...(item.description && { description: item.description }),
        ...(item.image && {
          image: {
            '@type': 'ImageObject',
            url: item.image,
          },
        }),
        ...(item.datePublished && { datePublished: item.datePublished }),
      },
    })),
  };
}

/**
 * Generate CollectionPage schema for blog category/archive pages
 */
export function generateCollectionPageSchema({
  name,
  description,
  url,
  image,
  itemList,
}: {
  name: string;
  description: string;
  url: string;
  image?: string;
  itemList?: Array<{ name: string; url: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    ...(image && {
      image: {
        '@type': 'ImageObject',
        url: image,
      },
    }),
    ...(itemList && itemList.length > 0 && {
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: itemList.length,
        itemListElement: itemList.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'BlogPosting',
            name: item.name,
            url: item.url,
          },
        })),
      },
    }),
    isPartOf: {
      '@type': 'WebSite',
      name: COMPANY_INFO.name,
      url: getSiteUrl(),
    },
  };
}

/**
 * Generate Category schema for blog categories
 */
export function generateCategorySchema({
  name,
  description,
  url,
  numberOfItems,
}: {
  name: string;
  description?: string;
  url: string;
  numberOfItems?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description: description || `Blog posts in the ${name} category`,
    url,
    ...(numberOfItems !== undefined && {
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems,
        name: `${name} Posts`,
      },
    }),
    isPartOf: {
      '@type': 'WebSite',
      name: COMPANY_INFO.name,
      url: getSiteUrl(),
    },
  };
}

export function formatRouteSlug(origin: string, destination: string): string {
  return `${origin.toLowerCase()}-${destination.toLowerCase()}`;
}

/**
 * Generate ItemList schema for routes from an airport
 */
export function generateRouteListSchema(
  routes: Array<{
    origin_iata: string;
    destination_iata: string;
    destination_city: string;
    flights_per_day: string;
  }>,
  airportIata: string,
  airportDisplay: string
) {
  if (routes.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Routes from ${airportDisplay}`,
    description: `List of ${routes.length} flight routes from ${airportDisplay}`,
    numberOfItems: routes.length,
    itemListElement: routes.map((route, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'FlightRoute',
        origin: {
          '@type': 'Airport',
          iataCode: route.origin_iata,
          name: airportDisplay,
        },
        destination: {
          '@type': 'Airport',
          iataCode: route.destination_iata,
          name: route.destination_city || `${route.destination_iata} Airport`,
        },
        frequency: route.flights_per_day,
        url: `https://triposia.com/flights/${route.origin_iata.toLowerCase()}-${route.destination_iata.toLowerCase()}`,
      },
    })),
  };
}

export function parseRouteSlug(slug: string): { origin: string; destination: string } | null {
  const parts = slug.split('-');
  if (parts.length >= 2) {
    // For IATA codes (3 letters), routes are typically "del-bom"
    // If both parts are 3 characters, treat as IATA codes
    if (parts.length === 2 && parts[0].length === 3 && parts[1].length === 3) {
      return {
        origin: parts[0].toUpperCase(),
        destination: parts[1].toUpperCase(),
      };
    }
    // For longer routes, assume last part is destination, rest is origin
    const destination = parts[parts.length - 1].toUpperCase();
    const origin = parts.slice(0, -1).join('-').toUpperCase();
    return { origin, destination };
  }
  return null;
}

