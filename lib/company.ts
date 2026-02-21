/**
 * Company information constants
 */

export const COMPANY_INFO = {
  name: 'Triposia',
  website: 'https://triposia.com',
  email: 'info@triposia.com',
  phone: {
    display: process.env.NEXT_PUBLIC_PHONE_DISPLAY || '+1-(877) 684-5230',
    tel: process.env.NEXT_PUBLIC_PHONE_TEL || '+18776845230',
  },
  address: {
    street: '1401 21st Street Suite R',
    city: 'Sacramento',
    state: 'CA',
    zip: '95811',
    full: '1401 21st Street Suite R, Sacramento, CA 95811',
  },
  social: {
    facebook: 'https://www.facebook.com/airlinesmap/',
    instagram: 'https://www.instagram.com/triposia_official/',
    youtube: 'https://www.youtube.com/@triposia',
    dailymotion: 'https://www.dailymotion.com/triposia.com',
  },
} as const;

/**
 * Get the site URL, using environment variable if set, otherwise defaulting to company website
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || COMPANY_INFO.website;
}

