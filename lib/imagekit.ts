const IMAGEKIT_BASE_URL = 'https://ik.imagekit.io/clearmystay/askfares';

/**
 * Get airline logo URL from ImageKit
 */
export function getAirlineLogoUrl(airlineCode: string): string {
  return `${IMAGEKIT_BASE_URL}/airlines/${airlineCode.toUpperCase()}.webp`;
}

/**
 * Get airport image URL from ImageKit
 */
export function getAirportImageUrl(iata: string): string {
  return `${IMAGEKIT_BASE_URL}/airports/${iata.toUpperCase()}.webp`;
}

