/**
 * Utility functions for categorizing routes by region
 */

interface Route {
  iata: string;
  city: string;
  display: string;
  flights_per_day: string;
  flights_per_week?: number;
  distance_km?: number;
  average_duration?: string;
  seasonal?: boolean;
  reliability?: 'Very Stable' | 'Moderate' | 'Seasonal' | 'Limited';
  route_growth?: 'growing' | 'stable' | 'declining';
  country?: string;
  is_domestic?: boolean;
}

export interface RegionGroup {
  name: string;
  routes: Route[];
  count: number;
}

/**
 * Helper function to categorize routes by region
 */
export function categorizeByRegion(
  routes: Route[],
  originCountry?: string
): RegionGroup[] {
  const groups: Map<string, Route[]> = new Map();

  if (!routes || routes.length === 0) {
    return [];
  }

  routes.forEach((route) => {
    if (!route) return;
    
    let region = 'Other';
    
    if (route.is_domestic && originCountry) {
      region = 'Domestic';
    } else if (route.country) {
      // Categorize by country/region
      const country = route.country.toLowerCase();
      
      // Europe
      if (['united kingdom', 'france', 'germany', 'italy', 'spain', 'netherlands', 'belgium', 
           'switzerland', 'austria', 'portugal', 'greece', 'ireland', 'denmark', 'sweden', 
           'norway', 'finland', 'poland', 'czech republic', 'hungary', 'romania', 'bulgaria',
           'croatia', 'serbia', 'slovakia', 'slovenia'].includes(country)) {
        region = 'Europe';
      }
      // Latin America
      else if (['mexico', 'brazil', 'argentina', 'chile', 'colombia', 'peru', 'venezuela',
                'ecuador', 'guatemala', 'costa rica', 'panama', 'dominican republic', 'cuba',
                'jamaica', 'bahamas', 'trinidad', 'barbados'].includes(country)) {
        region = 'Latin America';
      }
      // Asia
      else if (['china', 'japan', 'south korea', 'india', 'thailand', 'singapore', 'malaysia',
                'indonesia', 'philippines', 'vietnam', 'hong kong', 'taiwan', 'uae', 'saudi arabia',
                'qatar', 'israel', 'turkey'].includes(country)) {
        region = 'Asia';
      }
      // North America (excluding domestic)
      else if (['canada', 'united states'].includes(country) && !route.is_domestic) {
        region = 'North America';
      }
    }

    if (!groups.has(region)) {
      groups.set(region, []);
    }
    groups.get(region)!.push(route);
  });

  // Convert to array and sort
  const result: RegionGroup[] = Array.from(groups.entries())
    .map(([name, routes]) => ({
      name,
      routes: routes.filter(r => r).sort((a, b) => {
        const aFlights = typeof a.flights_per_day === 'string' 
          ? parseFloat(a.flights_per_day.match(/(\d+(?:\.\d+)?)/)?.[1] || '0')
          : 0;
        const bFlights = typeof b.flights_per_day === 'string'
          ? parseFloat(b.flights_per_day.match(/(\d+(?:\.\d+)?)/)?.[1] || '0')
          : 0;
        return bFlights - aFlights;
      }),
      count: routes.length,
    }))
    .sort((a, b) => {
      // Order: Domestic, Europe, Latin America, Asia, North America, Other
      const order = ['Domestic', 'Europe', 'Latin America', 'Asia', 'North America', 'Other'];
      return order.indexOf(a.name) - order.indexOf(b.name);
    });

  return result;
}
