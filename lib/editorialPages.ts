import { getDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

export interface EditorialPage {
  _id?: ObjectId;
  slug?: string;
  url?: string; // Alternative to slug
  pageType?: 'airline' | 'airport' | 'route' | 'airline-route' | 'flight-airport' | 'flight-route';
  title?: string;
  content?: {
    headings?: {
      h1?: string[];
      h2?: string[];
      h3?: string[];
    };
    faqs?: Array<{ question: string; answer: string }>;
    manualContent?: string; // HTML content to display above FAQ sections
    paragraphs?: string[];
    images?: string[];
    links?: string[];
  };
  // Legacy fields for backward compatibility
  overview?: string;
  description?: string;
  manualContent?: string; // HTML content to display above FAQ sections (legacy)
  headings?: Array<{ level: number; text: string }>; // Headings from editorial content (legacy)
  paragraphs?: string[]; // Paragraphs from editorial content (legacy)
  faqs?: Array<{ question: string; answer: string }>; // FAQs from editorial content (legacy)
  metadata?: {
    title?: string;
    description?: string;
    focusKeywords?: string;
  };
  meta?: {
    title?: string;
    description?: string;
    focusKeywords?: string;
  };
  sections?: {
    [key: string]: any;
  };
  useOldModel?: boolean; // Flag to use old content model
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Get editorial page data by slug
 * Returns null if page doesn't exist in pages_editorial collection
 * Supports both slug and url fields for lookup
 */
export async function getEditorialPage(slug: string): Promise<EditorialPage | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<EditorialPage>('pages_editorial');
    
    // Try to find by slug first, then by url
    let page = await collection.findOne({ slug });
    if (!page) {
      // Try to find by url field (e.g., "https://triposia.com/flights/atl-lax")
      const urlPattern = slug.startsWith('http') ? slug : `https://triposia.com/${slug}`;
      page = await collection.findOne({ url: urlPattern });
    }
    if (!page) {
      // Try to find by url field with just the slug part
      page = await collection.findOne({ url: { $regex: `/${slug}$`, $options: 'i' } });
    }
    
    return page || null;
  } catch (error) {
    console.error('Error fetching editorial page:', error);
    return null;
  }
}

/**
 * Check if a page should use the old model (if it exists in pages_editorial)
 */
export async function shouldUseOldModel(slug: string): Promise<boolean> {
  const page = await getEditorialPage(slug);
  return page !== null && (page.useOldModel !== false); // Default to true if page exists
}
