/**
 * Content API client for fetching posts, categories, and authors
 * Base URL: https://admintriposia.vercel.app/api/content
 */

const CONTENT_API_BASE = 'https://admintriposia.vercel.app/api/content';
const DEFAULT_DOMAIN_ID = 2; // Default domain ID, can be overridden via env

interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  content_html?: string;
  author_id?: number;
  category_id?: number;
  status?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  featured_image?: string;
  meta_title?: string;
  meta_description?: string;
  [key: string]: any;
}

interface Category {
  id: number;
  slug: string;
  name: string;
  description?: string;
  [key: string]: any;
}

interface Author {
  id: number;
  slug: string;
  name: string;
  bio?: string;
  avatar?: string;
  [key: string]: any;
}

interface FetchPostsParams {
  domain_id?: number;
  status?: string;
  category_id?: number | string;
  author_id?: number | string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all posts from the Content API
 */
export async function fetchPosts(params: FetchPostsParams = {}): Promise<Post[]> {
  try {
    const domainId = params.domain_id || DEFAULT_DOMAIN_ID;
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.category_id) queryParams.append('category_id', String(params.category_id));
    if (params.author_id) queryParams.append('author_id', String(params.author_id));
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    queryParams.append('domain_id', domainId.toString());

    const url = `${CONTENT_API_BASE}/posts?${queryParams.toString()}`;
    const response = await fetch(url, {
      next: { revalidate: 60 }, // Revalidate every 1 minute for faster image updates
      cache: 'no-store', // Always fetch fresh data to show updated images immediately
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * Fetch a single post by slug
 */
export async function fetchPostBySlug(slug: string, domainId?: number): Promise<Post | null> {
  try {
    const did = domainId || DEFAULT_DOMAIN_ID;
    const url = `${CONTENT_API_BASE}/posts/slug/${slug}?domain_id=${did}`;
    
    const response = await fetch(url, {
      next: { revalidate: 60 }, // Revalidate every 1 minute for faster image updates
      cache: 'no-store', // Always fetch fresh data to show updated images immediately
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch post: ${response.statusText}`);
    }

    const data = await response.json();
    return data || null;
  } catch (error) {
    console.error(`Error fetching post by slug ${slug}:`, error);
    return null;
  }
}

/**
 * Fetch all categories
 */
export async function fetchCategories(domainId?: number): Promise<Category[]> {
  try {
    const did = domainId || DEFAULT_DOMAIN_ID;
    const url = `${CONTENT_API_BASE}/categories?domain_id=${did}`;
    
    const response = await fetch(url, {
      next: { revalidate: 60 }, // Revalidate every 1 minute for faster image updates
      cache: 'no-store', // Always fetch fresh data to show updated images immediately
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetch a category by slug
 */
export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const url = `${CONTENT_API_BASE}/categories/slug/${slug}`;
    
    const response = await fetch(url, {
      next: { revalidate: 60 }, // Revalidate every 1 minute for faster image updates
      cache: 'no-store', // Always fetch fresh data to show updated images immediately
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch category: ${response.statusText}`);
    }

    const data = await response.json();
    // Map _id to id if _id exists and id doesn't
    if (data && data._id && !data.id) {
      data.id = data._id;
    }
    return data || null;
  } catch (error) {
    console.error(`Error fetching category by slug ${slug}:`, error);
    return null;
  }
}

/**
 * Fetch all authors
 */
export async function fetchAuthors(): Promise<Author[]> {
  try {
    const url = `${CONTENT_API_BASE}/authors`;
    
    const response = await fetch(url, {
      next: { revalidate: 60 }, // Revalidate every 1 minute for faster image updates
      cache: 'no-store', // Always fetch fresh data to show updated images immediately
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch authors: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching authors:', error);
    return [];
  }
}

/**
 * Fetch an author by slug
 */
export async function fetchAuthorBySlug(slug: string): Promise<Author | null> {
  try {
    const url = `${CONTENT_API_BASE}/authors/slug/${slug}`;
    
    const response = await fetch(url, {
      next: { revalidate: 60 }, // Revalidate every 1 minute for faster image updates
      cache: 'no-store', // Always fetch fresh data to show updated images immediately
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch author: ${response.statusText}`);
    }

    const data = await response.json();
    return data || null;
  } catch (error) {
    console.error(`Error fetching author by slug ${slug}:`, error);
    return null;
  }
}

/**
 * Fetch an author by ID or slug (fallback)
 */
export async function fetchAuthor(idOrSlug: string | number): Promise<Author | null> {
  try {
    const url = `${CONTENT_API_BASE}/authors/${idOrSlug}`;
    
    const response = await fetch(url, {
      next: { revalidate: 60 }, // Revalidate every 1 minute for faster image updates
      cache: 'no-store', // Always fetch fresh data to show updated images immediately
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch author: ${response.statusText}`);
    }

    const data = await response.json();
    return data || null;
  } catch (error) {
    console.error(`Error fetching author ${idOrSlug}:`, error);
    return null;
  }
}

export type { Post, Category, Author, FetchPostsParams };

