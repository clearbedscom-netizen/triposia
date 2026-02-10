/**
 * Data-Driven Content Insights
 * 
 * Provides contextual micro-explanations that:
 * - Explain WHY data exists
 * - Support decision-making
 * - Reference real data points
 * - Are conditional (only render if justified)
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

export interface RouteInsights {
  whyDurationVaries?: string;
  whyCheapestMonth?: string;
  whyAirlinesDominance?: string;
  bestTimeOfDay?: string;
  seasonalDemand?: string;
}

export interface AirportInsights {
  whyConnections?: string;
  peakHoursNote?: string;
  terminalUsage?: string;
  groundTransport?: string;
}

export interface AirlineInsights {
  routeNetworkFocus?: string;
  operationalStrengths?: string;
  baggageClarity?: string;
}

/**
 * Generate route insights (conditional, data-driven)
 */
export function generateRouteInsights(data: {
  flights: any[];
  route: any;
  averageDuration?: string;
  distance?: string;
  airlines: string[];
  cheapestMonths?: string[];
  busiestHours?: string[];
}): RouteInsights {
  const insights: RouteInsights = {};

  // Why duration varies - only if we have duration data and multiple flights
  if (data.averageDuration && data.flights.length > 1) {
    insights.whyDurationVaries = `Average flight duration is ${data.averageDuration}.`;
  }

  // Why a month is cheapest - only if price data exists
  if (data.cheapestMonths && data.cheapestMonths.length > 0) {
    const cheapest = data.cheapestMonths[0];
    insights.whyCheapestMonth = `${cheapest} typically offers lower prices.`;
  }

  // Why certain airlines dominate - only if clear dominance exists
  if (data.airlines.length > 0 && data.flights.length > 5) {
    const uniqueAirlines = new Set(data.flights.map((f: any) => f.airline_iata)).size;
    if (uniqueAirlines <= 2) {
      insights.whyAirlinesDominance = `This route is primarily served by ${data.airlines.slice(0, 2).join(' and ')}.`;
    }
  }

  // Best time of day to fly - only if we have hour data
  if (data.busiestHours && data.busiestHours.length > 0) {
    insights.bestTimeOfDay = `Peak departure times are ${data.busiestHours.join(', ')}.`;
  }

  // Seasonal demand - only if we have meaningful seasonality data
  if (data.cheapestMonths && data.cheapestMonths.length >= 3) {
    insights.seasonalDemand = `Demand varies seasonally.`;
  }

  return insights;
}

/**
 * Generate airport insights (conditional, data-driven)
 */
export function generateAirportInsights(data: {
  airport: any;
  routesCount: number;
  departureCount: number;
  arrivalCount: number;
  peakDepartureHours?: string[];
  terminals?: any[];
  connectionFriendly?: boolean;
}): AirportInsights {
  const insights: AirportInsights = {};

  // Why connections - only if airport is connection-friendly
  if (data.connectionFriendly && data.routesCount > 20) {
    insights.whyConnections = `This airport serves as a connection hub with ${data.routesCount} destinations.`;
  }

  // Peak hours note - only if we have peak hour data
  if (data.peakDepartureHours && data.peakDepartureHours.length > 0) {
    insights.peakHoursNote = `Busiest departure hours are ${data.peakDepartureHours.slice(0, 3).join(', ')}, when most flights operate.`;
  }

  // Terminal usage - only if multiple terminals exist
  if (data.terminals && data.terminals.length > 1) {
    const terminalNames = data.terminals.map((t: any) => t.name).join(', ');
    insights.terminalUsage = `This airport uses ${data.terminals.length} terminals (${terminalNames}) to organize flights by airline and destination.`;
  }

  // Ground transport - only if we have relevant data (would need POI/transport data)
  // Skip for now - would require transport data

  return insights;
}

/**
 * Generate airline insights (conditional, data-driven)
 */
export function generateAirlineInsights(data: {
  airline: any;
  routesCount: number;
  hubAirports?: string[];
  fleet?: any[];
}): AirlineInsights {
  const insights: AirlineInsights = {};

  // Route network focus - only if significant route count
  if (data.routesCount > 10) {
    const hubInfo = data.hubAirports && data.hubAirports.length > 0 ? ` with hubs at ${data.hubAirports.join(', ')}` : '';
    insights.routeNetworkFocus = `This airline operates ${data.routesCount} routes${hubInfo}.`;
  }

  // Operational strengths - only if fleet data exists
  if (data.fleet && data.fleet.length > 0) {
    const fleetTypes = data.fleet.map((f: any) => f.type).filter(Boolean).slice(0, 3).join(', ');
    insights.operationalStrengths = `Fleet includes ${fleetTypes}.`;
  }

  // Baggage clarity - only if airline has specific baggage info
  // Would need baggage policy data - skip for now

  return insights;
}

/**
 * Check if insights should be rendered
 * Only render if at least 2 insights exist (avoid thin content)
 */
export function shouldRenderInsights(insights: RouteInsights | AirportInsights | AirlineInsights): boolean {
  const insightCount = Object.values(insights).filter(v => v !== undefined && v.length > 0).length;
  return insightCount >= 2; // Require at least 2 insights
}

