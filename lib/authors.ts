/**
 * Author management utilities for MongoDB authors collection
 * These are the experts who can answer FAQ questions
 */

import { getDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

export interface Author {
  _id?: ObjectId;
  name: string;
  email?: string;
  slug?: string;
  bio?: string;
  profile_image?: string; // Profile image path
  designation?: string; // Job title (e.g., "Travel Writer", "Content Writer")
  role?: 'ADMIN' | 'AUTHOR'; // Role in the system
  is_active?: boolean; // Whether they're currently active
  expertise_topics?: string[]; // Areas of expertise
  current_company?: string;
  education?: string;
  previous_experience?: string;
  social_links?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    [key: string]: any;
  };
  created_at?: Date | string;
  password_hash?: string; // Hashed password if they have login access
  userId?: string; // Link to users collection if they have an account
  [key: string]: any; // Allow additional fields
}

/**
 * Find all active experts/authors
 */
export async function getAllAuthors(): Promise<Author[]> {
  try {
    const db = await getDatabase();
    const authors = await db.collection<Author>('authors')
      .find({ is_active: { $ne: false } }) // Include if is_active is true or undefined
      .sort({ name: 1 })
      .toArray();
    
    return authors;
  } catch (error) {
    console.error('Error fetching authors:', error);
    return [];
  }
}

/**
 * Find all experts (active authors - all authors with role AUTHOR or ADMIN are considered experts)
 */
export async function getAllExperts(): Promise<Author[]> {
  try {
    const db = await getDatabase();
    const experts = await db.collection<Author>('authors')
      .find({ 
        is_active: { $ne: false },
        role: { $in: ['AUTHOR', 'ADMIN'] }
      })
      .sort({ name: 1 })
      .toArray();
    
    return experts;
  } catch (error) {
    console.error('Error fetching experts:', error);
    return [];
  }
}

/**
 * Find author by ID
 */
export async function findAuthorById(id: string): Promise<Author | null> {
  try {
    const db = await getDatabase();
    const author = await db.collection<Author>('authors').findOne({ 
      _id: new ObjectId(id) 
    });
    return author;
  } catch (error) {
    console.error('Error finding author by ID:', error);
    return null;
  }
}

/**
 * Find author by email
 */
export async function findAuthorByEmail(email: string): Promise<Author | null> {
  try {
    const db = await getDatabase();
    const author = await db.collection<Author>('authors').findOne({ 
      email: email.toLowerCase().trim()
    });
    return author;
  } catch (error) {
    console.error('Error finding author by email:', error);
    return null;
  }
}

/**
 * Find author by userId (link to users collection)
 */
export async function findAuthorByUserId(userId: string): Promise<Author | null> {
  try {
    const db = await getDatabase();
    const author = await db.collection<Author>('authors').findOne({ 
      userId: userId
    });
    return author;
  } catch (error) {
    console.error('Error finding author by userId:', error);
    return null;
  }
}

/**
 * Check if a user is an expert/author
 */
export async function isUserExpert(userId: string): Promise<boolean> {
  try {
    const author = await findAuthorByUserId(userId);
    return author !== null && 
           author.is_active !== false && 
           (author.role === 'AUTHOR' || author.role === 'ADMIN');
  } catch (error) {
    console.error('Error checking if user is expert:', error);
    return false;
  }
}

/**
 * Check if an email belongs to an expert/author
 */
export async function isEmailExpert(email: string): Promise<boolean> {
  try {
    const author = await findAuthorByEmail(email);
    return author !== null && 
           author.is_active !== false && 
           (author.role === 'AUTHOR' || author.role === 'ADMIN');
  } catch (error) {
    console.error('Error checking if email is expert:', error);
    return false;
  }
}
