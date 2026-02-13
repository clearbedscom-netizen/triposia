import { getDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

export interface EditorialPage {
  _id?: ObjectId;
  slug: string;
  pageType: 'airline' | 'airport' | 'route' | 'airline-route';
  title?: string;
  content?: string;
  overview?: string;
  description?: string;
  manualContent?: string; // HTML content to display above FAQ sections
  metadata?: {
    title?: string;
    description?: string;
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
 */
export async function getEditorialPage(slug: string): Promise<EditorialPage | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<EditorialPage>('pages_editorial');
    
    const page = await collection.findOne({ slug });
    
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
