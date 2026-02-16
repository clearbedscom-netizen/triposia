import { getDatabase } from './mongodb';
import { Db, ObjectId } from 'mongodb';
import { getCache, setCache, CacheKeys, CacheTTL } from './redis';

export interface AirportSummary {
  _id?: ObjectId;
  iata_from: string;
  destinations_count: number;
  departure_count: number;
  arrival_count: number;
  domestic_count?: number;
  international_count?: number;
  peak_departure_hours?: string[];
  major_hub_airlines?: string[];
  connection_friendly?: boolean;
  terminals?: Array<{ name: string; airlines: string[] }>;
  reliability?: 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited';
  lat?: number;
  lng?: number;
  city?: string;
  country?: string;
  name?: string; // Airport name (used when city has multiple airports)
  displayName?: string; // Pre-formatted display name (e.g., "Chicago (ORD)")
}

export interface Route {
  _id?: ObjectId;
  origin_iata: string;
  destination_iata: string;
  destination_city: string;
  flights_per_day: string;
  has_flight_data: boolean;
  average_duration?: string;
  aircraft_types?: string[];
  jet_vs_turboprop?: { jet: number; turboprop: number };
  reliability?: 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited';
  best_time_to_fly?: string;
  busiest_hours?: string;
  cheapest_months?: string;
  is_domestic?: boolean;
  typical_duration?: string;
}

export interface DeepRoute {
  _id?: ObjectId;
  origin_iata: string;
  destination_iata: string;
  flight_data: {
    metadata?: any;
    price_month_data?: any;
    airlines_weekly_data?: any;
    monthly_data?: any;
  };
}

export interface Flight {
  _id?: ObjectId;
  flight_number: string;
  airline_iata: string;
  airline_name: string;
  origin_iata: string;
  destination_iata: string;
  aircraft?: string;
  departure_time?: string;
  arrival_time?: string;
  duration?: string;
  aircraft_type?: 'Jet' | 'Turboprop';
  seat_capacity?: number;
}

export interface Airline {
  _id?: ObjectId;
  code: string;
  name: string;
  short_name?: string;
  iata?: string;
  icao?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  zipcode?: string;
  website?: string;
  phone?: string;
  is_passenger?: boolean;
  is_cargo?: boolean;
  is_scheduled?: boolean;
  domestic?: boolean;
  total_aircrafts?: number;
  fleet_size?: number;
  average_fleet_age?: number;
  accidents_last_5y?: number;
  crashes_last_5y?: number;
  baggage_allowance_domestic?: string;
  baggage_allowance_international?: string;
  baggage?: string;
  cancellation_flexibility?: string;
  check_in?: string;
  class_count?: number;
  classes?: string[];
  fleet_overview?: Array<{ type: string; count: number }>;
  reliability_score?: number;
  punctuality_summary?: string;
  review_sentiment?: string;
  found?: number;
  hubs?: string[];
  overview?: string;
  rating_skytrax_reviews?: number;
  rating_skytrax_stars?: number;
  rating_tripadvisor?: number;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  tripadvisor_url?: string;
  wikipedia_url?: string;
}

// Airport Queries
export async function getAirportSummary(iata: string): Promise<AirportSummary | null> {
  const cacheKey = CacheKeys.airportSummary(iata);
  
  // Try cache first
  try {
    const cached = await getCache<AirportSummary>(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (error) {
    console.error('Redis cache error in getAirportSummary:', error);
    // Continue to database query
  }
  
  try {
    const db = await getDatabase();
    const collection = db.collection<any>('airports');
    const airport = await collection.findOne({ iata_from: iata.toUpperCase() });
    if (!airport) return null;
  
  // If city is missing, try to get it from airportfinal collection
  let city = airport.city;
  let country = airport.country;
  let name = airport.name || airport.airport_name;
  
  if (!city) {
    const airportFinalCollection = db.collection<any>('airportfinal');
    const airportFinal = await airportFinalCollection.findOne({ iata: iata.toUpperCase() });
    if (airportFinal) {
      city = airportFinal.city || city;
      country = airportFinal.country || country;
      name = airportFinal.name || airportFinal.airport_name || name;
    }
  }
  
    const result: AirportSummary = {
      _id: airport._id,
      iata_from: airport.iata_from,
      destinations_count: airport.destinations_count || 0,
      departure_count: airport.departure_count || 0,
      arrival_count: airport.arrival_count || 0,
      lat: airport.lat,
      lng: airport.lng,
      city: city,
      country: country,
      name: name, // Airport name field
      domestic_count: airport.domestic_count,
      international_count: airport.international_count,
      peak_departure_hours: airport.peak_departure_hours,
      major_hub_airlines: airport.major_hub_airlines,
      connection_friendly: airport.connection_friendly,
      terminals: airport.terminals,
      reliability: airport.reliability,
    };
    
    // Cache the result
    try {
      await setCache(cacheKey, result, CacheTTL.airport);
    } catch (error) {
      console.error('Redis cache set error in getAirportSummary:', error);
      // Continue - caching failure shouldn't break the request
    }
    
    return result;
  } catch (error) {
    console.error('Database error in getAirportSummary:', error);
    // Return null instead of crashing
    return null;
  }
}

export interface AirportDetails {
  iata: string;
  name?: string;
  city?: string;
  country?: string;
  state?: string;
  timezone?: string;
  elevation?: number;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  facilities?: string[] | string;
  parking?: string;
  ground_transportation?: string;
  nearby_hotels?: string;
  airport_code?: string;
  icao?: string;
  [key: string]: any; // Allow other fields from airportfinal
}

export async function getAirportDetails(iata: string): Promise<AirportDetails | null> {
  const cacheKey = CacheKeys.airportDetails(iata);
  
  // Try cache first
  const cached = await getCache<AirportDetails>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const db = await getDatabase();
  const collection = db.collection<any>('airportfinal');
  const airport = await collection.findOne({ iata: iata.toUpperCase() });
  if (!airport) return null;
  
  const result: AirportDetails = {
    iata: airport.iata,
    name: airport.name || airport.airport_name,
    city: airport.city,
    country: airport.country,
    state: airport.state || airport.province || airport.region,
    timezone: airport.timezone || airport.time_zone,
    elevation: airport.elevation || airport.elevation_ft,
    website: airport.website || airport.url,
    phone: airport.phone || airport.phone_number || airport.contact_phone,
    email: airport.email || airport.contact_email,
    address: airport.address || airport.location,
    description: airport.description || airport.about || airport.info,
    facilities: airport.facilities || airport.amenities || airport.services,
    parking: airport.parking || airport.parking_info,
    ground_transportation: airport.ground_transportation || airport.transportation || airport.transport,
    nearby_hotels: airport.nearby_hotels || airport.hotels,
    airport_code: airport.airport_code,
    icao: airport.icao,
    ...airport, // Include all other fields
  };
  
  // Cache the result
  await setCache(cacheKey, result, CacheTTL.airport);
  
  return result;
}

export async function getAllAirports(): Promise<AirportSummary[]> {
  const cacheKey = CacheKeys.allAirports();
  
  // Try cache first
  try {
    const cached = await getCache<AirportSummary[]>(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (error) {
    console.error('Redis cache error in getAllAirports:', error);
    // Continue to database query
  }
  
  try {
    const db = await getDatabase();
  const collection = db.collection<any>('airports');
  const airports = await collection.find({}).toArray();
  
  // Batch fetch all airportfinal data at once
  const iataCodes = airports.map(a => a.iata_from).filter(Boolean);
  const airportFinalCollection = db.collection<any>('airportfinal');
  const airportFinals = await airportFinalCollection
    .find({ iata: { $in: iataCodes } })
    .toArray();
  
  // Create lookup map
  const airportFinalMap = new Map(airportFinals.map(a => [a.iata, a]));
  
  // Batch check for multiple airports per city
  const cityAirportCounts = new Map<string, number>();
  airports.forEach(airport => {
    const final = airportFinalMap.get(airport.iata_from);
    const city = airport.city || final?.city;
    const country = airport.country || final?.country;
    if (city && country) {
      const key = `${city}|${country}`;
      cityAirportCounts.set(key, (cityAirportCounts.get(key) || 0) + 1);
    }
  });
  
  // Merge data efficiently and compute displayName
  const airportsWithCountry = airports.map((airport) => {
    let country = airport.country;
    let city = airport.city;
    let name = airport.name || airport.airport_name;
    
    const airportFinal = airportFinalMap.get(airport.iata_from);
    if (airportFinal) {
      country = country || airportFinal.country;
      city = city || airportFinal.city;
      name = name || airportFinal.airport_name || airportFinal.name;
    }
    
    // Format display name synchronously
    let displayName = airport.iata_from;
    if (city) {
      const key = `${city}|${country || ''}`;
      const multipleAirports = (cityAirportCounts.get(key) || 0) > 1;
      if (multipleAirports && name) {
        displayName = `${name} (${airport.iata_from})`;
      } else {
        displayName = `${city} (${airport.iata_from})`;
      }
    }
    
    return {
      _id: airport._id,
      iata_from: airport.iata_from,
      destinations_count: airport.destinations_count || 0,
      departure_count: airport.departure_count || 0,
      arrival_count: airport.arrival_count || 0,
      country: country,
      city: city,
      name: name,
      displayName: displayName,
    };
  });
  
    // Cache the result
    try {
      await setCache(cacheKey, airportsWithCountry, CacheTTL.allAirports);
    } catch (error) {
      console.error('Redis cache set error in getAllAirports:', error);
    }
    
    return airportsWithCountry;
  } catch (error) {
    console.error('Database error in getAllAirports:', error);
    // Return empty array instead of crashing
    return [];
  }
}

export async function getAirportsByCountry(): Promise<Record<string, AirportSummary[]>> {
  const cacheKey = CacheKeys.airportsByCountry();
  
  // Try cache first
  const cached = await getCache<Record<string, AirportSummary[]>>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const db = await getDatabase();
  const collection = db.collection<any>('airports');
  // Only fetch active airports to improve performance
  const airports = await collection.find({
    $or: [
      { departure_count: { $gt: 0 } },
      { arrival_count: { $gt: 0 } }
    ]
  }).limit(2000).toArray(); // Limit to 2000 airports to prevent timeout
  
  // Batch fetch all airportfinal data at once
  const iataCodes = airports.map(a => a.iata_from).filter(Boolean);
  const airportFinalCollection = db.collection<any>('airportfinal');
  const airportFinals = await airportFinalCollection
    .find({ iata: { $in: iataCodes } })
    .toArray();
  
  // Create lookup map
  const airportFinalMap = new Map(airportFinals.map(a => [a.iata, a]));
  
  // Batch check for multiple airports per city
  const cityCountryPairs = new Set<string>();
  airports.forEach(airport => {
    const final = airportFinalMap.get(airport.iata_from);
    const city = airport.city || final?.city;
    const country = airport.country || final?.country;
    if (city && country) {
      cityCountryPairs.add(`${city}|${country}`);
    }
  });
  
  // Count airports per city-country pair
  const cityAirportCounts = new Map<string, number>();
  airports.forEach(airport => {
    const final = airportFinalMap.get(airport.iata_from);
    const city = airport.city || final?.city;
    const country = airport.country || final?.country;
    if (city && country) {
      const key = `${city}|${country}`;
      cityAirportCounts.set(key, (cityAirportCounts.get(key) || 0) + 1);
    }
  });
  
  // Merge data and format display names
  const airportsWithData = airports.map((airport) => {
    let country = airport.country;
    let city = airport.city;
    let name = airport.name || airport.airport_name;
    
    const airportFinal = airportFinalMap.get(airport.iata_from);
    if (airportFinal) {
      country = country || airportFinal.country;
      city = city || airportFinal.city;
      name = name || airportFinal.airport_name || airportFinal.name;
    }
    
    // Format display name synchronously
    let displayName = airport.iata_from;
    if (city) {
      const key = `${city}|${country || ''}`;
      const multipleAirports = (cityAirportCounts.get(key) || 0) > 1;
      if (multipleAirports && name) {
        displayName = `${name} (${airport.iata_from})`;
      } else {
        displayName = `${city} (${airport.iata_from})`;
      }
    }
    
    return {
      _id: airport._id,
      iata_from: airport.iata_from,
      destinations_count: airport.destinations_count || 0,
      departure_count: airport.departure_count || 0,
      arrival_count: airport.arrival_count || 0,
      country: country,
      city: city,
      name: name,
      displayName: displayName,
    };
  });
  
  const airportsByCountry: Record<string, AirportSummary[]> = {};
  
  airportsWithData.forEach(airport => {
    const country = airport.country || 'Unknown';
    if (!airportsByCountry[country]) {
      airportsByCountry[country] = [];
    }
    airportsByCountry[country].push(airport);
  });
  
  // Sort airports within each country by departure count
  Object.keys(airportsByCountry).forEach(country => {
    airportsByCountry[country].sort((a, b) => b.departure_count - a.departure_count);
  });
  
  // Cache the result
  await setCache(cacheKey, airportsByCountry, CacheTTL.airportsByCountry);
  
  return airportsByCountry;
}

export async function getRoutesByCountry(): Promise<Record<string, Route[]>> {
  const cacheKey = CacheKeys.routesByCountry();
  
  // Try cache first
  const cached = await getCache<Record<string, Route[]>>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const db = await getDatabase();
  const routesCollection = db.collection<any>('routes');
  const airportsCollection = db.collection<any>('airports');
  const airportFinalCollection = db.collection<any>('airportfinal');
  
  // Limit routes to prevent timeout
  const routes = await routesCollection
    .find({ has_flight_data: true })
    .limit(5000)
    .toArray();
  
  // Get all unique origin IATA codes
  const originIatas = Array.from(new Set(routes.map((r: any) => r.origin_iata)));
  
  // Batch fetch all airports at once
  const airports = await airportsCollection
    .find({ iata_from: { $in: originIatas } })
    .toArray();
  
  // Batch fetch all airportfinal entries at once
  const airportFinals = await airportFinalCollection
    .find({ iata: { $in: originIatas } })
    .toArray();
  
  // Create lookup maps
  const airportMap = new Map(airports.map((a: any) => [a.iata_from, a]));
  const airportFinalMap = new Map(airportFinals.map((a: any) => [a.iata, a]));
  
  const routesByCountry: Record<string, Route[]> = {};
  
  for (const route of routes) {
    // Get origin country from lookup maps
    let originCountry = 'Unknown';
    const originAirport = airportMap.get(route.origin_iata);
    if (originAirport?.country) {
      originCountry = originAirport.country;
    } else {
      const originFinal = airportFinalMap.get(route.origin_iata);
      originCountry = originFinal?.country || 'Unknown';
    }
    
    if (!routesByCountry[originCountry]) {
      routesByCountry[originCountry] = [];
    }
    routesByCountry[originCountry].push({
      _id: route._id,
      origin_iata: route.origin_iata,
      destination_iata: route.destination_iata,
      destination_city: route.destination_city,
      flights_per_day: route.flights_per_day,
      has_flight_data: route.has_flight_data || false,
    });
  }
  
  // Cache the result
  await setCache(cacheKey, routesByCountry, CacheTTL.routesByCountry);
  
  return routesByCountry;
}

// Route Queries
export async function getRoute(origin: string, destination: string): Promise<Route | null> {
  const cacheKey = CacheKeys.route(origin, destination);
  
  // Try cache first
  const cached = await getCache<Route>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const db = await getDatabase();
  const collection = db.collection<any>('routes');
  const route = await collection.findOne({
    origin_iata: origin.toUpperCase(),
    destination_iata: destination.toUpperCase(),
  });
  if (!route) return null;
  
  const result: Route = {
    _id: route._id,
    origin_iata: route.origin_iata,
    destination_iata: route.destination_iata,
    destination_city: route.destination_city,
    flights_per_day: route.flights_per_day,
    has_flight_data: route.has_flight_data || false,
  };
  
  // Cache the result
  await setCache(cacheKey, result, CacheTTL.route);
  
  return result;
}

export async function getRoutesFromAirport(iata: string): Promise<Route[]> {
  const cacheKey = CacheKeys.routesFromAirport(iata);
  
  // Try cache first
  const cached = await getCache<Route[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const db = await getDatabase();
  const collection = db.collection<Route>('routes');
  const result = await collection
    .find({ origin_iata: iata.toUpperCase() })
    .sort({ destination_city: 1 })
    .toArray();
  
  // Cache the result
  await setCache(cacheKey, result, CacheTTL.route);
  
  return result;
}

export async function getRoutesToAirport(iata: string): Promise<Route[]> {
  const cacheKey = CacheKeys.routesToAirport(iata);
  
  // Try cache first
  const cached = await getCache<Route[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const db = await getDatabase();
  const collection = db.collection<Route>('routes');
  const result = await collection
    .find({ destination_iata: iata.toUpperCase() })
    .sort({ destination_city: 1 })
    .toArray();
  
  // Cache the result
  await setCache(cacheKey, result, CacheTTL.route);
  
  return result;
}

export interface DestinationData {
  rainfall?: number[];
  temperature?: number[];
  cheapest_day?: string;
  cheapest_month?: string;
  average_fare?: number;
}

export async function getDeepRoute(origin: string, destination: string): Promise<DeepRoute | null> {
  const cacheKey = CacheKeys.deepRoute(origin, destination);
  
  // Try cache first
  const cached = await getCache<DeepRoute>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const db = await getDatabase();
  const collection = db.collection<any>('destinations');
  const dest = await collection.findOne({
    origin_iata: origin.toUpperCase(),
    destination_iata: destination.toUpperCase(),
  });
  if (!dest) return null;
  
  const result: DeepRoute = {
    _id: dest._id,
    origin_iata: dest.origin_iata,
    destination_iata: dest.destination_iata,
    flight_data: dest.flight_data || {},
  };
  
  // Cache the result
  await setCache(cacheKey, result, CacheTTL.route);
  
  return result;
}

export async function getDestinationData(origin: string, destination: string): Promise<DestinationData | null> {
  const cacheKey = CacheKeys.destinationData(origin, destination);
  
  // Try cache first
  try {
    const cached = await getCache<DestinationData>(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (error) {
    console.error('Redis cache error in getDestinationData:', error);
    // Continue to database query
  }
  
  try {
    const db = await getDatabase();
    const collection = db.collection<any>('destinations');
    const dest = await collection.findOne({
      origin_iata: origin.toUpperCase(),
      destination_iata: destination.toUpperCase(),
    });
    if (!dest) return null;
    
    // Validate and normalize data
    const rainfall = dest.rainfall || dest.rainfall_data;
    const temperature = dest.temperature || dest.temperature_data;
    
    // Ensure arrays are valid (convert null to undefined to match interface)
    const validRainfall = Array.isArray(rainfall) ? rainfall : undefined;
    const validTemperature = Array.isArray(temperature) ? temperature : undefined;
    
    const result: DestinationData = {
      rainfall: validRainfall,
      temperature: validTemperature,
      cheapest_day: dest.cheapest_day,
      cheapest_month: dest.cheapest_month,
      average_fare: dest.average_fare,
    };
    
    // Cache the result (even if null/empty, to avoid repeated queries)
    try {
      await setCache(cacheKey, result, CacheTTL.destination);
    } catch (error) {
      console.error('Redis cache set error in getDestinationData:', error);
    }
    
    return result;
  } catch (error) {
    console.error('Database error in getDestinationData:', error);
    // Return null instead of crashing
    return null;
  }
}

// Enhanced route query with metadata
export async function getRouteWithMetadata(origin: string, destination: string): Promise<any> {
  const db = await getDatabase();
  const destinationsCollection = db.collection<any>('destinations');
  const dest = await destinationsCollection.findOne({
    origin_iata: origin.toUpperCase(),
    destination_iata: destination.toUpperCase(),
  });
  
  if (!dest) {
    // Fallback to routes collection
    const routesCollection = db.collection<any>('routes');
    const route = await routesCollection.findOne({
      origin_iata: origin.toUpperCase(),
      destination_iata: destination.toUpperCase(),
    });
    return route;
  }
  
  return dest;
}

// Flight Queries
export async function getFlightsByRoute(origin: string, destination: string): Promise<Flight[]> {
  const cacheKey = CacheKeys.flightsByRoute(origin, destination);
  
  // Try cache first
  const cached = await getCache<Flight[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const db = await getDatabase();
  const collection = db.collection<any>('departures');
  const flights = await collection
    .find({
      origin_iata: origin.toUpperCase(),
      destination_iata: destination.toUpperCase(),
    })
    .sort({ departure_time: 1 })
    .limit(100)
    .toArray();
  
  const result = flights.map(flight => ({
    _id: flight._id,
    flight_number: flight.flight_number,
    airline_iata: flight.airline_iata,
    airline_name: flight.airline_name,
    origin_iata: flight.origin_iata,
    destination_iata: flight.destination_iata,
    aircraft: flight.aircraft,
    departure_time: flight.departure_time,
    arrival_time: flight.arrival_time,
    duration: flight.duration_minutes ? `${Math.floor(flight.duration_minutes / 60)}h ${flight.duration_minutes % 60}m` : undefined,
  }));
  
  // Cache the result
  await setCache(cacheKey, result, CacheTTL.flights);
  
  return result;
}

export async function getDepartures(iata: string, limit: number = 50): Promise<Flight[]> {
  const db = await getDatabase();
  const collection = db.collection<any>('departures');
  const flights = await collection
    .find({ origin_iata: iata.toUpperCase() })
    .sort({ departure_time: 1 })
    .limit(limit)
    .toArray();
  
  return flights.map(flight => ({
    _id: flight._id,
    flight_number: flight.flight_number,
    airline_iata: flight.airline_iata,
    airline_name: flight.airline_name,
    origin_iata: flight.origin_iata,
    destination_iata: flight.destination_iata,
    aircraft: flight.aircraft,
    departure_time: flight.departure_time,
    arrival_time: flight.arrival_time,
    duration: flight.duration_minutes ? `${Math.floor(flight.duration_minutes / 60)}h ${flight.duration_minutes % 60}m` : undefined,
  }));
}

export async function getArrivals(iata: string, limit: number = 50): Promise<Flight[]> {
  const db = await getDatabase();
  const collection = db.collection<any>('arrivals');
  const flights = await collection
    .find({ origin_iata: iata.toUpperCase() })
    .sort({ arrival_time: 1 })
    .limit(limit)
    .toArray();
  
  return flights.map(flight => ({
    _id: flight._id,
    flight_number: flight.flight_number,
    airline_iata: flight.airline_iata,
    airline_name: flight.airline_name,
    origin_iata: flight.source_iata || flight.departure_airport?.IATA,
    destination_iata: flight.origin_iata,
    aircraft: flight.aircraft,
    departure_time: flight.departure_time,
    arrival_time: flight.arrival_time,
    duration: flight.duration_minutes ? `${Math.floor(flight.duration_minutes / 60)}h ${flight.duration_minutes % 60}m` : undefined,
  }));
}

export async function getFlightsFromAirport(iata: string): Promise<Flight[]> {
  const cacheKey = CacheKeys.departures(iata, 500);
  
  // Try cache first
  const cached = await getCache<Flight[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const db = await getDatabase();
  const collection = db.collection<any>('departures');
  const flights = await collection
    .find({ origin_iata: iata.toUpperCase() })
    .sort({ destination_iata: 1, departure_time: 1 })
    .limit(500)
    .toArray();
  
  const result = flights.map(flight => ({
    _id: flight._id,
    flight_number: flight.flight_number,
    airline_iata: flight.airline_iata,
    airline_name: flight.airline_name,
    origin_iata: flight.origin_iata,
    destination_iata: flight.destination_iata,
    aircraft: flight.aircraft,
    departure_time: flight.departure_time,
    arrival_time: flight.arrival_time,
    duration: flight.duration_minutes ? `${Math.floor(flight.duration_minutes / 60)}h ${flight.duration_minutes % 60}m` : undefined,
  }));
  
  // Cache the result
  await setCache(cacheKey, result, CacheTTL.departures);
  
  return result;
}

export async function getFlightsToAirport(iata: string): Promise<Flight[]> {
  const cacheKey = CacheKeys.arrivals(iata, 500);
  
  // Try cache first
  const cached = await getCache<Flight[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const db = await getDatabase();
  const collection = db.collection<any>('arrivals');
  const flights = await collection
    .find({ origin_iata: iata.toUpperCase() })
    .sort({ source_iata: 1, arrival_time: 1 })
    .limit(500)
    .toArray();
  
  const result = flights.map(flight => ({
    _id: flight._id,
    flight_number: flight.flight_number,
    airline_iata: flight.airline_iata,
    airline_name: flight.airline_name,
    origin_iata: flight.source_iata || flight.departure_airport?.IATA,
    destination_iata: flight.origin_iata,
    aircraft: flight.aircraft,
    departure_time: flight.departure_time,
    arrival_time: flight.arrival_time,
    duration: flight.duration_minutes ? `${Math.floor(flight.duration_minutes / 60)}h ${flight.duration_minutes % 60}m` : undefined,
  }));
  
  // Cache the result
  await setCache(cacheKey, result, CacheTTL.arrivals);
  
  return result;
}

// Airline Queries
export async function getAirline(code: string): Promise<Airline | null> {
  const cacheKey = CacheKeys.airline(code);
  
  // Try cache first
  const cached = await getCache<Airline>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const db = await getDatabase();
  const collection = db.collection<any>('airlines');
  const airline = await collection.findOne({
    $or: [
      { iata: code.toUpperCase() },
      { code: code.toUpperCase() },
      { iata: code.toLowerCase() },
      { code: code.toLowerCase() },
    ],
  });
  if (!airline) return null;
  
  const result: Airline = {
    _id: airline._id,
    code: airline.iata || airline.code || code.toUpperCase(),
    name: airline.name,
    short_name: airline.short_name,
    iata: airline.iata || airline.code,
    icao: airline.icao,
    country: airline.country,
    state: airline.state,
    city: airline.city,
    address: airline.address,
    zipcode: airline.zipcode,
    website: airline.website,
    phone: airline.phone,
    is_passenger: airline.is_passenger,
    is_cargo: airline.is_cargo,
    is_scheduled: airline.is_scheduled,
    domestic: airline.domestic,
    total_aircrafts: airline.total_aircrafts,
    fleet_size: airline.fleet_size,
    average_fleet_age: airline.average_fleet_age,
    accidents_last_5y: airline.accidents_last_5y,
    crashes_last_5y: airline.crashes_last_5y,
    baggage_allowance_domestic: airline.baggage_allowance_domestic,
    baggage_allowance_international: airline.baggage_allowance_international,
    baggage: airline.baggage,
    cancellation_flexibility: airline.cancellation_flexibility,
    check_in: airline.check_in,
    class_count: airline.class_count,
    classes: airline.classes,
    fleet_overview: airline.fleet_overview,
    reliability_score: airline.reliability_score,
    punctuality_summary: airline.punctuality_summary,
    review_sentiment: airline.review_sentiment,
    found: airline.found,
    hubs: airline.hubs,
    overview: airline.overview,
    rating_skytrax_reviews: airline.rating_skytrax_reviews,
    rating_skytrax_stars: airline.rating_skytrax_stars,
    rating_tripadvisor: airline.rating_tripadvisor,
    instagram_url: airline.instagram_url,
    twitter_url: airline.twitter_url,
    youtube_url: airline.youtube_url,
    tripadvisor_url: airline.tripadvisor_url,
    wikipedia_url: airline.wikipedia_url,
  };
  
  // Cache the result
  await setCache(cacheKey, result, CacheTTL.airline);
  
  return result;
}

export async function getTotalCounts() {
  const db = await getDatabase();
  
  const [airportsCount, routesCount, airlinesCount] = await Promise.all([
    db.collection('airports').countDocuments(),
    db.collection('routes').countDocuments(),
    db.collection('airlines').countDocuments(),
  ]);
  
  return {
    airports: airportsCount,
    routes: routesCount,
    airlines: airlinesCount,
  };
}

export interface TopAirline {
  airline_name: string;
  airline_iata: string;
  flightCount: number;
}

export interface TopAirport {
  iata: string;
  name: string;
  city: string;
  departureCount: number;
}

export interface TopAircraft {
  aircraft: string;
  flightCount: number;
}

export interface LongestFlight {
  origin: string;
  destination: string;
  originCity?: string;
  destinationCity?: string;
  duration: string;
  aircraft?: string;
}

export async function getTopAirlinesByDepartures(limit: number = 5): Promise<TopAirline[]> {
  const db = await getDatabase();
  const collection = db.collection<any>('departures');
  
  const pipeline = [
    {
      $group: {
        _id: '$airline_iata',
        airline_name: { $first: '$airline_name' },
        flightCount: { $sum: 1 },
      },
    },
    { $sort: { flightCount: -1 } },
    { $limit: limit },
  ];
  
  const results = await collection.aggregate(pipeline).toArray();
  
  return results.map((item: any) => ({
    airline_name: item.airline_name || item._id,
    airline_iata: item._id,
    flightCount: item.flightCount,
  }));
}

export async function getBusiestAirports(limit: number = 5): Promise<TopAirport[]> {
  const db = await getDatabase();
  const collection = db.collection<any>('airports');
  
  const airports = await collection
    .find({ departure_count: { $exists: true, $gt: 0 } })
    .sort({ departure_count: -1 })
    .limit(limit)
    .toArray();
  
  return airports.map((airport: any) => ({
    iata: airport.iata_from,
    name: airport.name || airport.airport_name || airport.iata_from,
    city: airport.city || '',
    departureCount: airport.departure_count || 0,
  }));
}

export async function getTopAircraftTypes(limit: number = 5): Promise<TopAircraft[]> {
  const db = await getDatabase();
  const collection = db.collection<any>('departures');
  
  const pipeline = [
    {
      $match: {
        aircraft: { $exists: true, $ne: null, $nin: [null, ''] },
      },
    },
    {
      $group: {
        _id: '$aircraft',
        flightCount: { $sum: 1 },
      },
    },
    { $sort: { flightCount: -1 } },
    { $limit: limit },
  ];
  
  const results = await collection.aggregate(pipeline).toArray();
  
  return results.map((item: any) => ({
    aircraft: item._id,
    flightCount: item.flightCount,
  }));
}

export async function getLongestFlight(): Promise<LongestFlight | null> {
  const db = await getDatabase();
  const routesCollection = db.collection<any>('routes');
  const departuresCollection = db.collection<any>('departures');
  
  // Try to find from routes first
  const route = await routesCollection
    .find({
      average_duration: { $exists: true, $ne: null },
    })
    .sort({ average_duration: -1 })
    .limit(1)
    .toArray();
  
  if (route.length > 0) {
    const r = route[0];
    const originAirport = await getAirportSummary(r.origin_iata);
    const destAirport = await getAirportSummary(r.destination_iata);
    
    return {
      origin: r.origin_iata,
      destination: r.destination_iata,
      originCity: originAirport?.city,
      destinationCity: destAirport?.city || r.destination_city,
      duration: r.average_duration || r.typical_duration || '',
      aircraft: undefined,
    };
  }
  
  // Fallback: find from departures with duration_minutes
  const flight = await departuresCollection
    .find({
      duration_minutes: { $exists: true, $ne: null },
    })
    .sort({ duration_minutes: -1 })
    .limit(1)
    .toArray();
  
  if (flight.length > 0) {
    const f = flight[0];
    const hours = Math.floor(f.duration_minutes / 60);
    const minutes = f.duration_minutes % 60;
    const originAirport = await getAirportSummary(f.origin_iata);
    const destAirport = await getAirportSummary(f.destination_iata);
    
    return {
      origin: f.origin_iata,
      destination: f.destination_iata,
      originCity: originAirport?.city,
      destinationCity: destAirport?.city,
      duration: `${hours}h ${minutes}min`,
      aircraft: f.aircraft,
    };
  }
  
  return null;
}

export async function getTotalFlightsToday(): Promise<number> {
  const db = await getDatabase();
  const collection = db.collection<any>('departures');
  return await collection.countDocuments();
}

export async function getAllAirlines(): Promise<Airline[]> {
  const cacheKey = CacheKeys.allAirlines();
  
  // Try cache first
  const cached = await getCache<Airline[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const db = await getDatabase();
  const collection = db.collection<any>('airlines');
  const airlines = await collection.find({}).sort({ name: 1 }).toArray();
  const result = airlines.map(airline => ({
    _id: airline._id,
    code: airline.iata,
    name: airline.name,
    iata: airline.iata,
  }));
  
  // Cache the result
  await setCache(cacheKey, result, CacheTTL.allAirlines);
  
  return result;
}

export async function getAirlineRoutes(airlineCode: string): Promise<Route[]> {
  const cacheKey = CacheKeys.airlineRoutes(airlineCode);
  
  // Try cache first
  const cached = await getCache<Route[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const db = await getDatabase();
  const departuresCollection = db.collection<any>('departures');
  const routesCollection = db.collection<any>('routes');
  
  // Get unique routes from departures
  const flights = await departuresCollection
    .find({ airline_iata: airlineCode.toUpperCase() })
    .limit(1000)
    .toArray();
  
  const uniqueRoutes = new Set<string>();
  flights.forEach((flight) => {
    const routeKey = `${flight.origin_iata}-${flight.destination_iata}`;
    uniqueRoutes.add(routeKey);
  });
  
  // Get route details
  const routes: Route[] = [];
  for (const routeKey of uniqueRoutes) {
    const [origin, destination] = routeKey.split('-');
    const route = await routesCollection.findOne({
      origin_iata: origin,
      destination_iata: destination,
    });
    if (route) {
      routes.push({
        _id: route._id,
        origin_iata: route.origin_iata,
        destination_iata: route.destination_iata,
        destination_city: route.destination_city,
        flights_per_day: route.flights_per_day,
        has_flight_data: route.has_flight_data || false,
      });
    }
  }
  
  const result = routes.sort((a, b) => (a.destination_city || '').localeCompare(b.destination_city || ''));
  
  // Cache the result (6 hours for airline routes)
  await setCache(cacheKey, result, CacheTTL.allAirlines);
  
  return result;
}

export async function getAirlineFlightsFromAirport(
  airlineCode: string,
  iata: string
): Promise<Flight[]> {
  const db = await getDatabase();
  const collection = db.collection<any>('departures');
  const flights = await collection
    .find({
      airline_iata: airlineCode.toUpperCase(),
      origin_iata: iata.toUpperCase(),
    })
    .sort({ destination_iata: 1, departure_time: 1 })
    .limit(200)
    .toArray();
  
  return flights.map(flight => ({
    _id: flight._id,
    flight_number: flight.flight_number,
    airline_iata: flight.airline_iata,
    airline_name: flight.airline_name,
    origin_iata: flight.origin_iata,
    destination_iata: flight.destination_iata,
    aircraft: flight.aircraft,
    departure_time: flight.departure_time,
    arrival_time: flight.arrival_time,
    duration: flight.duration_minutes ? `${Math.floor(flight.duration_minutes / 60)}h ${flight.duration_minutes % 60}m` : undefined,
  }));
}

export async function getAirlineFlightsToAirport(
  airlineCode: string,
  iata: string
): Promise<Flight[]> {
  const db = await getDatabase();
  const collection = db.collection<any>('arrivals');
  const flights = await collection
    .find({
      airline_iata: airlineCode.toUpperCase(),
      origin_iata: iata.toUpperCase(), // In arrivals, origin_iata is the destination airport
    })
    .sort({ source_iata: 1, arrival_time: 1 })
    .limit(200)
    .toArray();
  
  return flights.map(flight => ({
    _id: flight._id,
    flight_number: flight.flight_number,
    airline_iata: flight.airline_iata,
    airline_name: flight.airline_name,
    origin_iata: flight.source_iata || flight.departure_airport?.IATA,
    destination_iata: flight.origin_iata, // In arrivals, origin_iata is actually the destination
    aircraft: flight.aircraft,
    departure_time: flight.departure_time,
    arrival_time: flight.arrival_time,
    duration: flight.duration_minutes ? `${Math.floor(flight.duration_minutes / 60)}h ${flight.duration_minutes % 60}m` : undefined,
  }));
}

export async function getAirlineRouteFlights(
  airlineCode: string,
  origin: string,
  destination: string
): Promise<Flight[]> {
  const db = await getDatabase();
  const collection = db.collection<any>('departures');
  const flights = await collection
    .find({
      airline_iata: airlineCode.toUpperCase(),
      origin_iata: origin.toUpperCase(),
      destination_iata: destination.toUpperCase(),
    })
    .sort({ departure_time: 1 })
    .limit(100)
    .toArray();
  
  return flights.map(flight => ({
    _id: flight._id,
    flight_number: flight.flight_number,
    airline_iata: flight.airline_iata,
    airline_name: flight.airline_name,
    origin_iata: flight.origin_iata,
    destination_iata: flight.destination_iata,
    aircraft: flight.aircraft,
    departure_time: flight.departure_time,
    arrival_time: flight.arrival_time,
    duration: flight.duration_minutes ? `${Math.floor(flight.duration_minutes / 60)}h ${flight.duration_minutes % 60}m` : undefined,
  }));
}

// POI Queries
export interface Poi {
  _id: string;
  name: string;
  type: string;
  airport_iata: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  distance_from_airport_km: number;
  travel_time_minutes?: number;
  description: string;
  image_path: string;
  is_active: boolean;
}

export interface TerminalPhone {
  _id?: ObjectId;
  airport_iata?: string;
  terminal_name?: string;
  airline_code?: string;
  airline_name?: string;
  phone_number?: string;
  help_desk_phone?: string;
  help_desk_hours?: string;
  terminal_location?: string;
  // New schema fields
  airline_iata?: string;
  city_iata?: string;
  departure_terminal?: string;
  arrival_terminal?: string;
  terminal_phone?: string;
  airlines_phone?: string;
  airport_phone?: string;
  counter_office?: string;
  airports_country_code?: string;
}

export async function getTerminalPhones(
  airportIata: string,
  airlineCode?: string
): Promise<TerminalPhone[]> {
  const db = await getDatabase();
  const collection = db.collection<any>('terminal_phones');
  
  // Support both old and new schema
  const query: any = {
    $or: [
      { airport_iata: airportIata.toUpperCase() },
      { city_iata: airportIata.toUpperCase() }
    ]
  };
  
  if (airlineCode) {
    const airlineUpper = airlineCode.toUpperCase();
    const airlineQuery = {
      $or: [
        { airline_code: airlineUpper },
        { airline_iata: airlineUpper },
        { airline_code: { $exists: false } },
        { airline_code: null },
        { airline_code: '' },
        { airline_iata: { $exists: false } },
        { airline_iata: null },
        { airline_iata: '' }
      ]
    };
    query.$and = [airlineQuery];
  }
  
  const terminals = await collection.find(query).toArray();
  
  return terminals.map((terminal: any) => ({
    _id: terminal._id,
    airport_iata: terminal.airport_iata || terminal.city_iata,
    terminal_name: terminal.terminal_name || terminal.departure_terminal || terminal.arrival_terminal,
    airline_code: terminal.airline_code || terminal.airline_iata,
    airline_name: terminal.airline_name,
    phone_number: terminal.phone_number || terminal.terminal_phone,
    help_desk_phone: terminal.help_desk_phone,
    help_desk_hours: terminal.help_desk_hours,
    terminal_location: terminal.terminal_location,
    // New schema fields
    airline_iata: terminal.airline_iata,
    city_iata: terminal.city_iata,
    departure_terminal: terminal.departure_terminal,
    arrival_terminal: terminal.arrival_terminal,
    terminal_phone: terminal.terminal_phone,
    airlines_phone: terminal.airlines_phone,
    airport_phone: terminal.airport_phone,
    counter_office: terminal.counter_office,
    airports_country_code: terminal.airports_country_code,
  }));
}

/**
 * Get terminal information for a specific route (origin + destination + airline)
 */
export async function getTerminalInfoForRoute(
  originIata: string,
  destinationIata: string,
  airlineCode: string
): Promise<{
  origin?: TerminalPhone;
  destination?: TerminalPhone;
} | null> {
  const db = await getDatabase();
  const collection = db.collection<any>('terminal_phones');
  const airlineUpper = airlineCode.toUpperCase();
  
  // Query for origin terminal (departure)
  const originTerminal = await collection.findOne({
    $and: [
      {
        $or: [
          { airport_iata: originIata.toUpperCase() },
          { city_iata: originIata.toUpperCase() }
        ]
      },
      {
        $or: [
          { airline_code: airlineUpper },
          { airline_iata: airlineUpper }
        ]
      }
    ]
  });
  
  // Query for destination terminal (arrival)
  const destinationTerminal = await collection.findOne({
    $and: [
      {
        $or: [
          { airport_iata: destinationIata.toUpperCase() },
          { city_iata: destinationIata.toUpperCase() }
        ]
      },
      {
        $or: [
          { airline_code: airlineUpper },
          { airline_iata: airlineUpper }
        ]
      }
    ]
  });
  
  if (!originTerminal && !destinationTerminal) {
    return null;
  }
  
  const mapTerminal = (terminal: any): TerminalPhone | undefined => {
    if (!terminal) return undefined;
    return {
      _id: terminal._id,
      airport_iata: terminal.airport_iata || terminal.city_iata,
      terminal_name: terminal.terminal_name || terminal.departure_terminal || terminal.arrival_terminal,
      airline_code: terminal.airline_code || terminal.airline_iata,
      airline_name: terminal.airline_name,
      phone_number: terminal.phone_number || terminal.terminal_phone,
      help_desk_phone: terminal.help_desk_phone,
      help_desk_hours: terminal.help_desk_hours,
      terminal_location: terminal.terminal_location,
      airline_iata: terminal.airline_iata,
      city_iata: terminal.city_iata,
      departure_terminal: terminal.departure_terminal,
      arrival_terminal: terminal.arrival_terminal,
      terminal_phone: terminal.terminal_phone,
      airlines_phone: terminal.airlines_phone,
      airport_phone: terminal.airport_phone,
      counter_office: terminal.counter_office,
      airports_country_code: terminal.airports_country_code,
    };
  };
  
  return {
    origin: mapTerminal(originTerminal),
    destination: mapTerminal(destinationTerminal),
  };
}

export async function getPoisByAirport(iata: string, limit: number = 6): Promise<Poi[]> {
  const db = await getDatabase();
  const collection = db.collection<any>('pois');
  const airportsCollection = db.collection<any>('airports');
  
  // Get airport coordinates if available
  const airport = await airportsCollection.findOne({ iata_from: iata.toUpperCase() });
  
  const pois = await collection
    .find({
      airport_iata: iata.toUpperCase(),
      is_active: true,
    })
    .toArray();
  
  // Calculate distance if not present and coordinates are available
  const { calculateDistance, estimateTravelTime } = require('./distance');
  
  const poisWithDistance = pois.map((poi: any) => {
    if (!poi.distance_from_airport_km && poi.lat && poi.lng && airport?.lat && airport?.lng) {
      poi.distance_from_airport_km = calculateDistance(
        airport.lat,
        airport.lng,
        poi.lat,
        poi.lng
      );
    }
    if (!poi.travel_time_minutes && poi.distance_from_airport_km) {
      poi.travel_time_minutes = estimateTravelTime(poi.distance_from_airport_km);
    }
    return poi;
  });
  
  // Sort by distance and limit
  return poisWithDistance
    .sort((a: any, b: any) => (a.distance_from_airport_km || 0) - (b.distance_from_airport_km || 0))
    .slice(0, limit);
}

// Weather data interface and query
export interface WeatherData {
  _id?: ObjectId;
  airport_iata: string;
  months: Array<{
    month: number; // 1-12
    month_name?: string;
    temp: number; // Temperature in Celsius
    rain: number; // Rainfall in mm
    wind: number; // Wind speed in km/h
    humidity: number; // Humidity percentage
  }>;
}

export async function getWeatherByAirport(iata: string): Promise<WeatherData | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<WeatherData>('weather');
    const upperIata = iata.toUpperCase();
    const lowerIata = iata.toLowerCase();
    
    // Try multiple field name variations with different cases
    let weather = await collection.findOne({ airport_iata: upperIata });
    if (!weather) {
      weather = await collection.findOne({ airport_iata: lowerIata });
    }
    if (!weather) {
      weather = await collection.findOne({ iata: upperIata });
    }
    if (!weather) {
      weather = await collection.findOne({ iata: lowerIata });
    }
    if (!weather) {
      weather = await collection.findOne({ airport_code: upperIata });
    }
    if (!weather) {
      weather = await collection.findOne({ airport_code: lowerIata });
    }
    if (!weather) {
      weather = await collection.findOne({ iata_code: upperIata });
    }
    if (!weather) {
      weather = await collection.findOne({ iata_code: lowerIata });
    }
    
    return weather || null;
  } catch (error) {
    console.error(`Error fetching weather for ${iata}:`, error);
    return null;
  }
}

// Booking insights interface and query
export interface BookingInsights {
  _id?: ObjectId;
  airport_iata: string;
  best_booking_window?: string;
  booking_tip?: string;
  peak_travel_months?: string[];
  recommended_months?: string[];
}

export async function getBookingInsightsByAirport(iata: string): Promise<BookingInsights | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<BookingInsights>('booking_insights');
    const upperIata = iata.toUpperCase();
    const lowerIata = iata.toLowerCase();
    
    // Try multiple field name variations with different cases
    let insights = await collection.findOne({ airport_iata: upperIata });
    if (!insights) {
      insights = await collection.findOne({ airport_iata: lowerIata });
    }
    if (!insights) {
      insights = await collection.findOne({ iata: upperIata });
    }
    if (!insights) {
      insights = await collection.findOne({ iata: lowerIata });
    }
    if (!insights) {
      insights = await collection.findOne({ airport_code: upperIata });
    }
    if (!insights) {
      insights = await collection.findOne({ airport_code: lowerIata });
    }
    if (!insights) {
      insights = await collection.findOne({ iata_code: upperIata });
    }
    if (!insights) {
      insights = await collection.findOne({ iata_code: lowerIata });
    }
    
    return insights || null;
  } catch (error) {
    console.error(`Error fetching booking insights for ${iata}:`, error);
    return null;
  }
}

// Flight price trends interface and query
export interface FlightPriceTrends {
  _id?: ObjectId;
  airport_iata: string;
  cheapest_months?: string[];
  expensive_months?: string[];
  price_trend?: string;
}

export async function getPriceTrendsByAirport(iata: string): Promise<FlightPriceTrends | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<FlightPriceTrends>('flight_price_trends');
    const upperIata = iata.toUpperCase();
    const lowerIata = iata.toLowerCase();
    
    // Try multiple field name variations with different cases
    let trends = await collection.findOne({ airport_iata: upperIata });
    if (!trends) {
      trends = await collection.findOne({ airport_iata: lowerIata });
    }
    if (!trends) {
      trends = await collection.findOne({ iata: upperIata });
    }
    if (!trends) {
      trends = await collection.findOne({ iata: lowerIata });
    }
    if (!trends) {
      trends = await collection.findOne({ airport_code: upperIata });
    }
    if (!trends) {
      trends = await collection.findOne({ airport_code: lowerIata });
    }
    if (!trends) {
      trends = await collection.findOne({ iata_code: upperIata });
    }
    if (!trends) {
      trends = await collection.findOne({ iata_code: lowerIata });
    }
    
    return trends || null;
  } catch (error) {
    console.error(`Error fetching price trends for ${iata}:`, error);
    return null;
  }
}

// Airline seasonal insights interface and query
export interface AirlineSeasonalInsights {
  _id?: ObjectId;
  airport_iata: string;
  seasonal_pattern?: {
    best?: string[];
    shoulder?: string[];
    worst?: string[];
    extreme?: string[];
  };
  insight?: string;
}

export async function getAirlineSeasonalInsightsByAirport(iata: string): Promise<AirlineSeasonalInsights | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<AirlineSeasonalInsights>('airline_seasonal_insights');
    const insights = await collection.findOne({ airport_iata: iata.toUpperCase() });
    return insights || null;
  } catch (error) {
    console.error(`Error fetching airline seasonal insights for ${iata}:`, error);
    return null;
  }
}

// Get POIs from apois collection (as specified in requirements)
export async function getApoisByAirport(iata: string, limit: number = 6): Promise<any[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<any>('apois');
    
    const apois = await collection
      .find({
        airport_iata: iata.toUpperCase(),
        is_active: true,
      })
      .sort({ distance_km: 1 }) // Sort by distance_km ASC
      .limit(limit)
      .toArray();
    
    return apois || [];
  } catch (error) {
    console.error(`Error fetching apois for ${iata}:`, error);
    return [];
  }
}

