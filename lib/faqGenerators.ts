import { Flight, Route, AirportSummary, Airline, TerminalPhone, getAirportSummary } from './queries';
import { getFlightTimeRange, getEarliestFlight, getLastFlight, formatDistance, getTerminalForAirline } from './routeUtils';
import { formatAirportName } from './formatting';

/**
 * Generate FAQs for flight route pages
 * 
 * Content Generation Guidelines:
 * - Use ONLY Meta LLaMA models if AI generation is required (no OpenAI GPT)
 * - Model must operate in DATA-SUMMARIZATION MODE
 * - Never invent text beyond existing factual fields
 * - No paraphrasing of competitor content
 * - No hallucinated advice or guarantees
 * - No generic explanatory paragraphs
 * - No conversational AI tone
 * - No marketing adjectives (best, cheapest, great option)
 * - No filler phrases (in conclusion, overall, etc.)
 * - No repetitive sentence structures
 */
export interface DestinationData {
  rainfall?: number[];
  temperature?: number[];
  cheapest_day?: string;
  cheapest_month?: string;
  average_fare?: number;
}

/**
 * Generate limited, factual FAQs for route pages (5-7 questions max)
 * Only uses allowed questions from database fields
 */
export async function generateRouteFAQs(
  flights: Flight[],
  route: Route | null,
  origin: string,
  destination: string,
  originAirport: AirportSummary | null,
  destinationAirport: AirportSummary | null,
  operatingAirlines: Airline[],
  distance?: string,
  averageDuration?: string,
  cheapestMonth?: string,
  flightsPerWeek?: string | number,
  averagePrice?: number,
  destinationData?: DestinationData | null
): Promise<Array<{ question: string; answer: string }>> {
  const faqs: Array<{ question: string; answer: string }> = [];
  const originDisplay = await formatAirportName(origin, originAirport);
  const destinationDisplay = await formatAirportName(destination, destinationAirport);

  // 1. Do flights operate between {FROM} and {TO}?
  if (flights.length > 0) {
    faqs.push({
      question: `Do flights operate between ${origin} and ${destination}?`,
      answer: `Yes. ${flights.length} direct flight${flights.length !== 1 ? 's' : ''} operate${flights.length === 1 ? 's' : ''} between ${originDisplay} and ${destinationDisplay}.`,
    });
  }

  // 2. Which airlines operate this route?
  if (operatingAirlines.length > 0) {
    const airlineNames = operatingAirlines.map(a => a.name).slice(0, 5);
    faqs.push({
      question: `Which airlines operate this route?`,
      answer: `${operatingAirlines.length} airline${operatingAirlines.length !== 1 ? 's' : ''} ${operatingAirlines.length === 1 ? 'operates' : 'operate'} this route: ${airlineNames.join(', ')}${operatingAirlines.length > 5 ? `, and ${operatingAirlines.length - 5} more` : ''}.`,
    });
  }

  // 3. How many flights operate daily?
  if (route?.flights_per_day) {
    faqs.push({
      question: `How many flights operate daily?`,
      answer: `${route.flights_per_day} flight${route.flights_per_day !== '1' ? 's' : ''} operate${route.flights_per_day === '1' ? 's' : ''} daily on this route.`,
    });
  } else if (flights.length > 0) {
    faqs.push({
      question: `How many flights operate daily?`,
      answer: `${flights.length} flight${flights.length !== 1 ? 's' : ''} operate${flights.length === 1 ? 's' : ''} daily on this route.`,
    });
  }

  // 4. What is the average flight duration?
  if (averageDuration && averageDuration !== 'Data not available') {
    faqs.push({
      question: `What is the average flight duration?`,
      answer: `The average flight duration is ${averageDuration}.`,
    });
  }

  // 5. Is this route operated year-round?
  // Check if route has consistent flight data (simplified check)
  if (flights.length > 0 && route) {
    faqs.push({
      question: `Is this route operated year-round?`,
      answer: `This route operates with ${route.flights_per_day || flights.length} daily flight${Number(route.flights_per_day || flights.length) !== 1 ? 's' : ''}.`,
    });
  }

  // Limit to 5-7 FAQs
  return faqs.slice(0, 7);
}

/**
 * Generate FAQs for airport pages
 */
export async function generateAirportFAQs(
  airport: AirportSummary,
  departures: Flight[],
  arrivals: Flight[],
  routesCount: number
): Promise<Array<{ question: string; answer: string }>> {
  const faqs: Array<{ question: string; answer: string }> = [];
  const airportDisplay = await formatAirportName(airport.iata_from, airport);

  // Daily departures
  if (airport.departure_count > 0) {
    faqs.push({
      question: `How many flights depart from ${airportDisplay} daily?`,
      answer: `Approximately ${airport.departure_count} flight${airport.departure_count !== 1 ? 's' : ''} depart from ${airportDisplay} daily.`,
    });
  }

  // Daily arrivals
  if (airport.arrival_count > 0) {
    faqs.push({
      question: `How many flights arrive at ${airportDisplay} daily?`,
      answer: `Approximately ${airport.arrival_count} flight${airport.arrival_count !== 1 ? 's' : ''} arrive at ${airportDisplay} daily.`,
    });
  }

  // Destinations
  if (airport.destinations_count > 0) {
    faqs.push({
      question: `How many destinations does ${airportDisplay} serve?`,
      answer: `${airportDisplay} serves ${airport.destinations_count} destination${airport.destinations_count !== 1 ? 's' : ''}.`,
    });
  }

  // Airlines operating
  const airlines = Array.from(new Set([
    ...departures.map(f => f.airline_name).filter(Boolean),
    ...arrivals.map(f => f.airline_name).filter(Boolean),
  ]));
  if (airlines.length > 0) {
    faqs.push({
      question: `Which airlines operate from ${airportDisplay}?`,
      answer: `${airlines.length} airline${airlines.length !== 1 ? 's' : ''} ${airlines.length === 1 ? 'operates' : 'operate'} from ${airportDisplay}: ${airlines.slice(0, 5).join(', ')}${airlines.length > 5 ? `, and ${airlines.length - 5} more` : ''}.`,
    });
  }

  // Domestic vs International split
  if (airport.domestic_count !== undefined && airport.international_count !== undefined) {
    const total = (airport.domestic_count || 0) + (airport.international_count || 0);
    if (total > 0) {
      faqs.push({
        question: `What is the domestic vs international flight split at ${airportDisplay}?`,
        answer: `${airportDisplay} has ${airport.domestic_count || 0} domestic route${airport.domestic_count !== 1 ? 's' : ''} and ${airport.international_count || 0} international route${airport.international_count !== 1 ? 's' : ''}.`,
      });
    }
  }

  // International flights question (only if there are international destinations)
  if (airport.international_count !== undefined && airport.international_count > 0) {
    faqs.push({
      question: `Does ${airportDisplay} offer international flights?`,
      answer: `${airportDisplay} offers international flights to ${airport.international_count} international destination${airport.international_count !== 1 ? 's' : ''}.`,
    });
  }

  // Peak departure hours
  if (airport.peak_departure_hours && airport.peak_departure_hours.length > 0) {
    faqs.push({
      question: `What are the peak departure hours at ${airportDisplay}?`,
      answer: `Peak departure hours at ${airportDisplay} are ${airport.peak_departure_hours.slice(0, 3).join(', ')}.`,
    });
  }

  // Connection friendliness
  if (airport.connection_friendly !== undefined) {
    faqs.push({
      question: `Is ${airportDisplay} connection-friendly?`,
      answer: `${airportDisplay} is ${airport.connection_friendly ? 'connection-friendly' : 'not primarily designed for connections'}.`,
    });
  }

  // Limit to 5-7 FAQs for operational focus
  return faqs.slice(0, 7);
}

/**
 * Generate FAQs for airline airport pages
 */
export async function generateAirlineAirportFAQs(
  airline: Airline,
  airport: AirportSummary,
  flightsFrom: Flight[],
  flightsTo: Flight[],
  destinations: Array<{ iata: string; display?: string; city?: string; is_domestic?: boolean; country?: string }>,
  origins: Array<{ iata: string; display?: string; city?: string; is_domestic?: boolean; country?: string }>,
  terminalPhones?: TerminalPhone[],
  airportDisplayOverride?: string
): Promise<Array<{ question: string; answer: string }>> {
  const faqs: Array<{ question: string; answer: string }> = [];
  // Use provided airportDisplay if available, otherwise format it
  const airportDisplay = airportDisplayOverride || await formatAirportName(airport.iata_from, airport);
  const airlineName = airline.name || 'Airline';

  // Daily departures
  if (flightsFrom.length > 0) {
    faqs.push({
      question: `How many ${airlineName} flights depart from ${airportDisplay} daily?`,
      answer: `${airlineName} operates ${flightsFrom.length} departure${flightsFrom.length !== 1 ? 's' : ''} from ${airportDisplay} daily.`,
    });
  }

  // Daily arrivals
  if (flightsTo.length > 0) {
    faqs.push({
      question: `How many ${airlineName} flights arrive at ${airportDisplay} daily?`,
      answer: `${airlineName} operates ${flightsTo.length} arrival${flightsTo.length !== 1 ? 's' : ''} at ${airportDisplay} daily.`,
    });
  }

  // Destinations
  if (destinations.length > 0) {
    // Format destination names - ensure we always use formatted display names
    const destinationNames = await Promise.all(
      destinations.slice(0, 5).map(async (d) => {
        if (d.display) {
          return d.display;
        }
        // If display is not set, format it now
        const destAirport = await getAirportSummary(d.iata);
        return await formatAirportName(d.iata, destAirport, d.city);
      })
    );
    faqs.push({
      question: `How many destinations does ${airlineName} serve from ${airportDisplay}?`,
      answer: `${airlineName} serves ${destinations.length} destination${destinations.length !== 1 ? 's' : ''} from ${airportDisplay}: ${destinationNames.join(', ')}${destinations.length > 5 ? `, and ${destinations.length - 5} more` : ''}.`,
    });
  }

  // International flights question (only if there are international destinations)
  const internationalDestinations = destinations.filter(d => {
    // Check if destination is international (is_domestic === false)
    return d.is_domestic === false;
  });
  
  if (internationalDestinations.length > 0) {
    const airlineShortName = airline.short_name || airline.name || 'the airline';
    const domesticDestinations = destinations.filter(d => d.is_domestic === true).length;
    faqs.push({
      question: `Does ${airlineShortName} offer international flights from ${airportDisplay}?`,
      answer: `Yes, ${airlineName} offers international flights from ${airportDisplay} to ${internationalDestinations.length} international destination${internationalDestinations.length !== 1 ? 's' : ''}. ${airlineName} operates ${domesticDestinations} domestic and ${internationalDestinations.length} international route${internationalDestinations.length !== 1 ? 's' : ''} from ${airportDisplay}.`,
    });
  }

  // Origins
  if (origins.length > 0) {
    // Format origin names - ensure we always use formatted display names
    const originNames = await Promise.all(
      origins.slice(0, 5).map(async (o) => {
        if (o.display) {
          return o.display;
        }
        // If display is not set, format it now
        const origAirport = await getAirportSummary(o.iata);
        return await formatAirportName(o.iata, origAirport, o.city);
      })
    );
    faqs.push({
      question: `How many origins does ${airlineName} receive flights from to ${airportDisplay}?`,
      answer: `${airlineName} receives flights from ${origins.length} origin${origins.length !== 1 ? 's' : ''} to ${airportDisplay}: ${originNames.join(', ')}${origins.length > 5 ? `, and ${origins.length - 5} more` : ''}.`,
    });
  }

  // Aircraft types
  const aircraftTypes = Array.from(new Set([
    ...flightsFrom.map(f => f.aircraft).filter(Boolean),
    ...flightsTo.map(f => f.aircraft).filter(Boolean),
  ]));
  if (aircraftTypes.length > 0) {
    faqs.push({
      question: `What aircraft types does ${airlineName} use at ${airportDisplay}?`,
      answer: `${airlineName} uses ${aircraftTypes.slice(0, 5).join(', ')}${aircraftTypes.length > 5 ? ` and ${aircraftTypes.length - 5} more aircraft type${aircraftTypes.length - 5 !== 1 ? 's' : ''}` : ''} at ${airportDisplay}.`,
    });
  }

  // Terminal information
  if (airport.terminals && airport.terminals.length > 0) {
    const terminal = getTerminalForAirline(airport.terminals, airline.iata || airline.code);
    if (terminal) {
      const terminalPhone = terminalPhones?.find(tp => 
        tp.terminal_name === terminal && 
        (tp.airline_code?.toUpperCase() === (airline.iata || airline.code)?.toUpperCase() || !tp.airline_code)
      );
      
      let terminalAnswer = `${airlineName} operates from Terminal ${terminal} at ${airportDisplay}.`;
      if (terminalPhone?.phone_number) {
        terminalAnswer += ` Terminal ${terminal} phone: ${terminalPhone.phone_number}.`;
      }
      if (terminalPhone?.help_desk_phone) {
        terminalAnswer += ` Help desk: ${terminalPhone.help_desk_phone}${terminalPhone.help_desk_hours ? ` (${terminalPhone.help_desk_hours})` : ''}.`;
      }
      if (terminalPhone?.terminal_location) {
        terminalAnswer += ` Terminal location: ${terminalPhone.terminal_location}.`;
      }
      
      faqs.push({
        question: `Which terminal does ${airlineName} use at ${airportDisplay}?`,
        answer: terminalAnswer,
      });
    }
  }

  // Terminal phone numbers
  if (terminalPhones && terminalPhones.length > 0) {
    const terminalPhonesWithNumbers = terminalPhones.filter(tp => tp.phone_number && tp.terminal_name);
    if (terminalPhonesWithNumbers.length > 0) {
      const terminalPhone = terminalPhonesWithNumbers.find(tp => 
        tp.airline_code?.toUpperCase() === (airline.iata || airline.code)?.toUpperCase() || !tp.airline_code
      ) || terminalPhonesWithNumbers[0];
      
      if (terminalPhone) {
        faqs.push({
          question: `What is the ${airlineName} terminal phone number at ${airportDisplay}?`,
          answer: `The ${airlineName} terminal phone number at ${airportDisplay} is ${terminalPhone.phone_number}${terminalPhone.terminal_name ? ` (Terminal ${terminalPhone.terminal_name})` : ''}.`,
        });
      }
    }
  }

  // Terminal location information
  if (terminalPhones && terminalPhones.length > 0) {
    const terminalWithLocation = terminalPhones.find(tp => 
      tp.terminal_location && 
      (tp.airline_code?.toUpperCase() === (airline.iata || airline.code)?.toUpperCase() || !tp.airline_code)
    );
    if (terminalWithLocation) {
      faqs.push({
        question: `Where is the ${airlineName} terminal located at ${airportDisplay}?`,
        answer: `The ${airlineName} terminal at ${airportDisplay} is located at ${terminalWithLocation.terminal_location}${terminalWithLocation.terminal_name ? ` (Terminal ${terminalWithLocation.terminal_name})` : ''}.`,
      });
    }
  }

  // Airport help desk information
  if (terminalPhones && terminalPhones.length > 0) {
    const helpDesk = terminalPhones.find(tp => tp.help_desk_phone);
    if (helpDesk) {
      faqs.push({
        question: `What is the ${airportDisplay} help desk phone number?`,
        answer: `The ${airportDisplay} help desk phone number is ${helpDesk.help_desk_phone}${helpDesk.help_desk_hours ? ` (Hours: ${helpDesk.help_desk_hours})` : ''}.`,
      });
    }
  }

  // Earliest and latest departures
  const earliestDeparture = getEarliestFlight(flightsFrom);
  const lastDeparture = getLastFlight(flightsFrom);
  if (earliestDeparture && lastDeparture) {
    faqs.push({
      question: `What are the earliest and latest ${airlineName} departure times from ${airportDisplay}?`,
      answer: `The earliest ${airlineName} flight departs at ${earliestDeparture} and the latest departs at ${lastDeparture}.`,
    });
  }

  // Earliest and latest arrivals
  const earliestArrival = getEarliestFlight(flightsTo);
  const lastArrival = getLastFlight(flightsTo);
  if (earliestArrival && lastArrival) {
    faqs.push({
      question: `What are the earliest and latest ${airlineName} arrival times at ${airportDisplay}?`,
      answer: `The earliest ${airlineName} flight arrives at ${earliestArrival} and the latest arrives at ${lastArrival}.`,
    });
  }

  // Airline codes
  faqs.push({
    question: `What is the airline code for ${airlineName}?`,
    answer: `The airline code for ${airlineName} is ${airline.iata || airline.code || 'N/A'}${airline.iata && airline.code && airline.iata !== airline.code ? ` (IATA: ${airline.iata}, Code: ${airline.code})` : ''}${airline.icao ? ` (ICAO: ${airline.icao})` : ''}.`,
  });

  // Limit to 5-7 FAQs for operational focus
  return faqs.slice(0, 7);
}

/**
 * Generate FAQs for airline pages
 */
export function generateAirlineFAQs(
  airline: Airline,
  routes: Route[],
  code: string
): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];

  // Destinations
  if (routes.length > 0) {
    faqs.push({
      question: `How many destinations does ${airline.name} serve?`,
      answer: `${airline.name} operates flights to ${routes.length} destination${routes.length !== 1 ? 's' : ''}${airline.country ? ` from ${airline.country}` : ''}.`,
    });
  }

  // Airline codes
  faqs.push({
    question: `What is the airline code for ${airline.name}?`,
    answer: `The airline code for ${airline.name} is ${code}${airline.iata ? ` (IATA: ${airline.iata})` : ''}${airline.icao ? ` (ICAO: ${airline.icao})` : ''}.`,
  });

  // Baggage allowance
  if (airline.baggage_allowance_domestic || airline.baggage_allowance_international) {
    faqs.push({
      question: `What is the baggage allowance for ${airline.name}?`,
      answer: `${airline.name}'s baggage allowance is ${airline.baggage_allowance_domestic || 'varies'} for domestic flights${airline.baggage_allowance_international ? ` and ${airline.baggage_allowance_international} for international flights` : ''}.`,
    });
  }

  // Cancellation flexibility
  if (airline.cancellation_flexibility) {
    faqs.push({
      question: `What is ${airline.name}'s cancellation policy?`,
      answer: `${airline.name} offers ${airline.cancellation_flexibility}.`,
    });
  }

  // Fleet overview
  if (airline.fleet_overview && airline.fleet_overview.length > 0) {
    const fleetDesc = airline.fleet_overview.map(f => `${f.count} ${f.type}`).join(', ');
    faqs.push({
      question: `What aircraft types does ${airline.name} operate?`,
      answer: `${airline.name}'s fleet includes ${fleetDesc}.`,
    });
  }

  // Reliability score
  if (airline.reliability_score) {
    faqs.push({
      question: `What is ${airline.name}'s reliability score?`,
      answer: `${airline.name} has a reliability score of ${airline.reliability_score}/10.`,
    });
  }

  // Country/region
  if (airline.country) {
    faqs.push({
      question: `Where is ${airline.name} based?`,
      answer: `${airline.name} is based in ${airline.country}.`,
    });
  }

  // Limit to 5-7 FAQs for operational focus
  return faqs.slice(0, 7);
}

/**
 * Generate FAQs for airline route pages with terminal and phone information
 */
export async function generateAirlineRouteFAQs(
  airline: Airline,
  flights: Flight[],
  allFlights: Flight[],
  origin: string,
  destination: string,
  originAirport: AirportSummary | null,
  destinationAirport: AirportSummary | null,
  route: Route | null,
  distance?: string,
  averageDuration?: string,
  cheapestMonth?: string,
  flightsPerWeek?: string | number,
  averagePrice?: number,
  originTerminalPhones?: TerminalPhone[],
  destinationTerminalPhones?: TerminalPhone[]
): Promise<Array<{ question: string; answer: string }>> {
  const faqs: Array<{ question: string; answer: string }> = [];
  const originDisplay = await formatAirportName(origin, originAirport);
  const destinationDisplay = await formatAirportName(destination, destinationAirport);

  // Number of flights
  faqs.push({
    question: `How many ${airline.name} flights operate from ${originDisplay} to ${destinationDisplay}?`,
    answer: `${airline.name} operates ${flights.length} flight${flights.length !== 1 ? 's' : ''} from ${originDisplay} to ${destinationDisplay}.`,
  });

  // Destination city
  const destinationCity = route?.destination_city || destinationAirport?.city;
  if (destinationCity) {
    faqs.push({
      question: `What city does ${destinationDisplay} airport serve?`,
      answer: `${destinationDisplay} airport serves ${destinationCity}${destinationAirport?.country ? `, ${destinationAirport.country}` : ''}.`,
    });
  }

  // Flight duration
  if (averageDuration && averageDuration !== 'Data not available') {
    faqs.push({
      question: `How long is the ${airline.name} flight from ${originDisplay} to ${destinationDisplay}?`,
      answer: `The flight duration is approximately ${averageDuration}.`,
    });
  }

  // Distance
  if (distance) {
    faqs.push({
      question: `What is the distance from ${originDisplay} to ${destinationDisplay}?`,
      answer: `The distance is ${distance}.`,
    });
  }

  // Aircraft types
  const aircraftTypes = Array.from(new Set(flights.map(f => f.aircraft).filter(Boolean)));
  if (aircraftTypes.length > 0) {
    faqs.push({
      question: `What aircraft does ${airline.name} use on this route?`,
      answer: `${airline.name} uses ${aircraftTypes.slice(0, 3).join(', ')}${aircraftTypes.length > 3 ? ` and ${aircraftTypes.length - 3} more aircraft type${aircraftTypes.length - 3 !== 1 ? 's' : ''}` : ''} on this route.`,
    });
  }

  // Other airlines
  if (allFlights.length > flights.length) {
    const otherAirlines = Array.from(new Set(
      allFlights
        .filter(f => f.airline_iata?.toUpperCase() !== airline.iata?.toUpperCase() && f.airline_iata?.toUpperCase() !== airline.code?.toUpperCase())
        .map(f => f.airline_name)
        .filter(Boolean)
    ));
    if (otherAirlines.length > 0) {
      faqs.push({
        question: `Which other airlines operate on this route?`,
        answer: `${otherAirlines.length} other airline${otherAirlines.length !== 1 ? 's' : ''} ${otherAirlines.length === 1 ? 'operates' : 'operate'} on this route: ${otherAirlines.slice(0, 3).join(', ')}${otherAirlines.length > 3 ? ` and ${otherAirlines.length - 3} more` : ''}.`,
      });
    }
  }

  // Earliest and latest flights
  const earliestFlight = getEarliestFlight(flights);
  const lastFlight = getLastFlight(flights);
  if (earliestFlight && lastFlight && earliestFlight !== lastFlight) {
    faqs.push({
      question: `What are the earliest and latest ${airline.name} flight departure times?`,
      answer: `The earliest ${airline.name} flight departs at ${earliestFlight} and the latest departs at ${lastFlight}.`,
    });
  }

  // Terminal information for departure (using new schema with fallback)
  const originTerminalData = originTerminalPhones?.find(tp => 
    (tp.airline_code?.toUpperCase() === (airline.iata || airline.code)?.toUpperCase() || 
     tp.airline_iata?.toUpperCase() === (airline.iata || airline.code)?.toUpperCase() || 
     !tp.airline_code && !tp.airline_iata)
  );
  
  const departureTerminal = originTerminalData?.departure_terminal || 
    (originAirport?.terminals && originAirport.terminals.length > 0 
      ? getTerminalForAirline(originAirport.terminals, airline.iata || airline.code)
      : null) ||
    originTerminalData?.terminal_name;
  
  if (departureTerminal) {
    // Phone fallback: terminal_phone -> phone_number -> airlines_phone -> airport_phone
    const phone = originTerminalData?.terminal_phone || 
                  originTerminalData?.phone_number || 
                  originTerminalData?.airlines_phone || 
                  originTerminalData?.airport_phone;
    
    let terminalAnswer = `${airline.name} flights from ${originDisplay} depart from Terminal ${departureTerminal}.`;
    if (phone) {
      terminalAnswer += ` Terminal ${departureTerminal} phone: ${phone}.`;
    }
    if (originTerminalData?.help_desk_phone) {
      terminalAnswer += ` Help desk: ${originTerminalData.help_desk_phone}${originTerminalData.help_desk_hours ? ` (${originTerminalData.help_desk_hours})` : ''}.`;
    }
    if (originTerminalData?.terminal_location) {
      terminalAnswer += ` Terminal location: ${originTerminalData.terminal_location}.`;
    }
    if (originTerminalData?.counter_office) {
      terminalAnswer += ` Counter office: ${originTerminalData.counter_office}.`;
    }
    
    faqs.push({
      question: `Which terminal does ${airline.name} use at ${originDisplay}?`,
      answer: terminalAnswer,
    });
  }

  // Departure terminal phone number (with fallback)
  if (originTerminalPhones && originTerminalPhones.length > 0) {
    const terminalPhone = originTerminalPhones.find(tp => 
      (tp.airline_code?.toUpperCase() === (airline.iata || airline.code)?.toUpperCase() || 
       tp.airline_iata?.toUpperCase() === (airline.iata || airline.code)?.toUpperCase() || 
       !tp.airline_code && !tp.airline_iata) &&
      (tp.terminal_phone || tp.phone_number || tp.airlines_phone || tp.airport_phone) &&
      (tp.departure_terminal || tp.terminal_name)
    );
    if (terminalPhone) {
      const phone = terminalPhone.terminal_phone || terminalPhone.phone_number || terminalPhone.airlines_phone || terminalPhone.airport_phone;
      const terminal = terminalPhone.departure_terminal || terminalPhone.terminal_name;
      faqs.push({
        question: `What is the ${airline.name} terminal phone number at ${originDisplay}?`,
        answer: `The ${airline.name} terminal phone number at ${originDisplay} is ${phone}${terminal ? ` (Terminal ${terminal})` : ''}.`,
      });
    }
  }

  // Terminal information for arrival (using new schema with fallback)
  const destTerminalData = destinationTerminalPhones?.find(tp => 
    (tp.airline_code?.toUpperCase() === (airline.iata || airline.code)?.toUpperCase() || 
     tp.airline_iata?.toUpperCase() === (airline.iata || airline.code)?.toUpperCase() || 
     !tp.airline_code && !tp.airline_iata)
  );
  
  const arrivalTerminal = destTerminalData?.arrival_terminal || 
    (destinationAirport?.terminals && destinationAirport.terminals.length > 0 
      ? getTerminalForAirline(destinationAirport.terminals, airline.iata || airline.code)
      : null) ||
    destTerminalData?.terminal_name;
  
  if (arrivalTerminal) {
    // Phone fallback: terminal_phone -> phone_number -> airlines_phone -> airport_phone
    const phone = destTerminalData?.terminal_phone || 
                  destTerminalData?.phone_number || 
                  destTerminalData?.airlines_phone || 
                  destTerminalData?.airport_phone;
    
    let terminalAnswer = `${airline.name} flights to ${destinationDisplay} arrive at Terminal ${arrivalTerminal}.`;
    if (phone) {
      terminalAnswer += ` Terminal ${arrivalTerminal} phone: ${phone}.`;
    }
    if (destTerminalData?.help_desk_phone) {
      terminalAnswer += ` Help desk: ${destTerminalData.help_desk_phone}${destTerminalData.help_desk_hours ? ` (${destTerminalData.help_desk_hours})` : ''}.`;
    }
    if (destTerminalData?.terminal_location) {
      terminalAnswer += ` Terminal location: ${destTerminalData.terminal_location}.`;
    }
    if (destTerminalData?.counter_office) {
      terminalAnswer += ` Counter office: ${destTerminalData.counter_office}.`;
    }
    
    faqs.push({
      question: `Which terminal does ${airline.name} use at ${destinationDisplay}?`,
      answer: terminalAnswer,
    });
  }

  // Arrival terminal phone number (with fallback)
  if (destinationTerminalPhones && destinationTerminalPhones.length > 0) {
    const terminalPhone = destinationTerminalPhones.find(tp => 
      (tp.airline_code?.toUpperCase() === (airline.iata || airline.code)?.toUpperCase() || 
       tp.airline_iata?.toUpperCase() === (airline.iata || airline.code)?.toUpperCase() || 
       !tp.airline_code && !tp.airline_iata) &&
      (tp.terminal_phone || tp.phone_number || tp.airlines_phone || tp.airport_phone) &&
      (tp.arrival_terminal || tp.terminal_name)
    );
    if (terminalPhone) {
      const phone = terminalPhone.terminal_phone || terminalPhone.phone_number || terminalPhone.airlines_phone || terminalPhone.airport_phone;
      const terminal = terminalPhone.arrival_terminal || terminalPhone.terminal_name;
      faqs.push({
        question: `What is the ${airline.name} terminal phone number at ${destinationDisplay}?`,
        answer: `The ${airline.name} terminal phone number at ${destinationDisplay} is ${phone}${terminal ? ` (Terminal ${terminal})` : ''}.`,
      });
    }
  }

  // Airport help desk information
  if (originTerminalPhones && originTerminalPhones.length > 0) {
    const helpDesk = originTerminalPhones.find(tp => tp.help_desk_phone);
    if (helpDesk) {
      faqs.push({
        question: `What is the ${originDisplay} help desk phone number?`,
        answer: `The ${originDisplay} help desk phone number is ${helpDesk.help_desk_phone}${helpDesk.help_desk_hours ? ` (Hours: ${helpDesk.help_desk_hours})` : ''}.`,
      });
    }
  }

  if (destinationTerminalPhones && destinationTerminalPhones.length > 0) {
    const helpDesk = destinationTerminalPhones.find(tp => tp.help_desk_phone);
    if (helpDesk) {
      faqs.push({
        question: `What is the ${destinationDisplay} help desk phone number?`,
        answer: `The ${destinationDisplay} help desk phone number is ${helpDesk.help_desk_phone}${helpDesk.help_desk_hours ? ` (Hours: ${helpDesk.help_desk_hours})` : ''}.`,
      });
    }
  }

  // Cheapest month
  if (cheapestMonth) {
    faqs.push({
      question: `What is the cheapest month to fly ${airline.name} from ${originDisplay} to ${destinationDisplay}?`,
      answer: `${cheapestMonth} is typically the cheapest month to fly ${airline.name} on this route.`,
    });
  }

  // Average price
  if (averagePrice) {
    faqs.push({
      question: `What is the average price for a ${airline.name} flight from ${originDisplay} to ${destinationDisplay}?`,
      answer: `The average price for a round-trip ${airline.name} flight on this route is approximately $${averagePrice}.`,
    });
  }

  // Flights per week
  if (flightsPerWeek) {
    faqs.push({
      question: `How many ${airline.name} flights operate per week on this route?`,
      answer: `${airline.name} operates approximately ${flightsPerWeek} flight${Number(flightsPerWeek) !== 1 ? 's' : ''} per week from ${originDisplay} to ${destinationDisplay}.`,
    });
  }

  // Limit to 5-7 FAQs for operational focus
  return faqs.slice(0, 7);
}

