/**
 * FAQ management utilities for MongoDB faqs collection
 */

import { getDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

export interface FAQComment {
  _id?: ObjectId;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Author {
  _id?: string;
  name: string;
  slug?: string;
  bio?: string;
  profile_image?: string;
  designation?: string;
  current_company?: string;
  previous_experience?: string;
  education?: string;
  expertise_topics?: string[];
  social_links?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

export interface FAQAnswer {
  _id?: ObjectId;
  userId: string; // Admin or expert user ID
  userName?: string; // For backward compatibility
  userImage?: string;
  content?: string; // For backward compatibility
  answer?: string; // HTML content (new format)
  author?: Author; // Author object (new format)
  isExpertAnswer?: boolean; // true for admin/expert, false for regular users
  createdAt: Date;
  updatedAt?: Date;
  comments?: FAQComment[];
  helpfulCount?: number; // Number of users who found this helpful
  helpfulUsers?: string[]; // Array of user IDs who marked as helpful
}

export interface FAQ {
  _id?: ObjectId;
  userId: string; // User who asked the question
  userName: string;
  userImage?: string;
  question: string;
  pageType: 'flight-route' | 'airline-route' | 'airline-airport' | 'airport' | 'airline' | 'general';
  pageSlug: string; // e.g., "del-bom", "dl/jfk", "jfk"
  pageUrl: string; // Full URL path
  answers: FAQAnswer[];
  createdAt: Date;
  updatedAt?: Date;
  isAnswered: boolean; // true if has at least one expert answer
  isHighlighted: boolean; // true if unanswered (for highlighting)
  viewCount?: number;
  helpfulCount?: number; // Number of users who found the question helpful
  helpfulUsers?: string[]; // Array of user IDs who marked as helpful
}

/**
 * Create a new FAQ question
 */
export async function createFAQ(faqData: {
  userId: string;
  userName: string;
  userImage?: string;
  question: string;
  pageType: FAQ['pageType'];
  pageSlug: string;
  pageUrl: string;
}): Promise<FAQ | null> {
  try {
    const db = await getDatabase();
    const now = new Date();
    
    const faq: FAQ = {
      ...faqData,
      answers: [],
      createdAt: now,
      updatedAt: now,
      isAnswered: false,
      isHighlighted: true, // Unanswered questions are highlighted
      viewCount: 0,
      helpfulCount: 0,
      helpfulUsers: [],
    };

    const result = await db.collection<FAQ>('faqs').insertOne(faq);
    
    if (result.insertedId) {
      return await findFAQById(result.insertedId.toString());
    }
    
    return null;
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return null;
  }
}

/**
 * Find FAQ by ID
 */
export async function findFAQById(id: string): Promise<FAQ | null> {
  try {
    const db = await getDatabase();
    const faq = await db.collection<FAQ>('faqs').findOne({ _id: new ObjectId(id) });
    return faq;
  } catch (error) {
    console.error('Error finding FAQ by ID:', error);
    return null;
  }
}

/**
 * Find FAQs by page (pageType and pageSlug)
 */
export async function findFAQsByPage(
  pageType: FAQ['pageType'],
  pageSlug: string,
  options?: {
    limit?: number;
    sortBy?: 'newest' | 'oldest' | 'most-answered' | 'most-helpful';
    includeUnanswered?: boolean;
  }
): Promise<FAQ[]> {
  try {
    const db = await getDatabase();
    const limit = options?.limit || 50;
    const sortBy = options?.sortBy || 'newest';
    
    let sort: any = {};
    switch (sortBy) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'most-answered':
        sort = { 'answers': -1, createdAt: -1 }; // Sort by number of answers
        break;
      case 'most-helpful':
        sort = { helpfulCount: -1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
        break;
    }

    const query: any = {
      pageType,
      pageSlug,
    };

    // If includeUnanswered is false, only show answered questions
    if (options?.includeUnanswered === false) {
      query.isAnswered = true;
    }

    const faqs = await db.collection<FAQ>('faqs')
      .find(query)
      .sort(sort)
      .limit(limit)
      .toArray();
    
    return faqs;
  } catch (error) {
    console.error('Error finding FAQs by page:', error);
    return [];
  }
}

/**
 * Add an answer to a FAQ
 */
export async function addAnswerToFAQ(
  faqId: string,
  answerData: {
    userId: string;
    userName: string;
    userImage?: string;
    content: string;
    isExpertAnswer: boolean;
  }
): Promise<FAQ | null> {
  try {
    const db = await getDatabase();
    const now = new Date();
    
    const answer: FAQAnswer = {
      ...answerData,
      comments: [],
      createdAt: now,
      updatedAt: now,
      helpfulCount: 0,
      helpfulUsers: [],
    };

    const result = await db.collection<FAQ>('faqs').findOneAndUpdate(
      { _id: new ObjectId(faqId) },
      {
        $push: { answers: answer },
        $set: {
          isAnswered: answerData.isExpertAnswer ? true : undefined, // Only mark as answered if expert answer
          isHighlighted: false, // Remove highlight when answered
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    );

    // findOneAndUpdate returns ModifyResult which has a value property
    return (result as any)?.value || null;
  } catch (error) {
    console.error('Error adding answer to FAQ:', error);
    return null;
  }
}

/**
 * Add a comment to an answer
 */
export async function addCommentToAnswer(
  faqId: string,
  answerId: string,
  commentData: {
    userId: string;
    userName: string;
    userImage?: string;
    content: string;
  }
): Promise<FAQ | null> {
  try {
    const db = await getDatabase();
    const now = new Date();
    
    const comment: FAQComment = {
      ...commentData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<FAQ>('faqs').findOneAndUpdate(
      {
        _id: new ObjectId(faqId),
        'answers._id': new ObjectId(answerId),
      },
      {
        $push: {
          'answers.$.comments': comment,
        },
        $set: {
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    );

    // findOneAndUpdate returns ModifyResult which has a value property
    return (result as any)?.value || null;
  } catch (error) {
    console.error('Error adding comment to answer:', error);
    return null;
  }
}

/**
 * Mark FAQ as helpful
 */
export async function markFAQAsHelpful(faqId: string, userId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const faq = await findFAQById(faqId);
    
    if (!faq) {
      return false;
    }

    const helpfulUsers = faq.helpfulUsers || [];
    const isAlreadyHelpful = helpfulUsers.includes(userId);

    if (isAlreadyHelpful) {
      // Remove helpful mark
      await db.collection<FAQ>('faqs').updateOne(
        { _id: new ObjectId(faqId) },
        {
          $pull: { helpfulUsers: userId },
          $inc: { helpfulCount: -1 },
          $set: { updatedAt: new Date() },
        }
      );
    } else {
      // Add helpful mark
      await db.collection<FAQ>('faqs').updateOne(
        { _id: new ObjectId(faqId) },
        {
          $addToSet: { helpfulUsers: userId },
          $inc: { helpfulCount: 1 },
          $set: { updatedAt: new Date() },
        }
      );
    }

    return true;
  } catch (error) {
    console.error('Error marking FAQ as helpful:', error);
    return false;
  }
}

/**
 * Mark answer as helpful
 */
export async function markAnswerAsHelpful(
  faqId: string,
  answerId: string,
  userId: string
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const faq = await findFAQById(faqId);
    
    if (!faq) {
      return false;
    }

    const answer = faq.answers.find(a => a._id?.toString() === answerId);
    if (!answer) {
      return false;
    }

    const helpfulUsers = answer.helpfulUsers || [];
    const isAlreadyHelpful = helpfulUsers.includes(userId);

    if (isAlreadyHelpful) {
      // Remove helpful mark
      await db.collection<FAQ>('faqs').updateOne(
        {
          _id: new ObjectId(faqId),
          'answers._id': new ObjectId(answerId),
        },
        {
          $pull: { 'answers.$.helpfulUsers': userId },
          $inc: { 'answers.$.helpfulCount': -1 },
          $set: { updatedAt: new Date() },
        }
      );
    } else {
      // Add helpful mark
      await db.collection<FAQ>('faqs').updateOne(
        {
          _id: new ObjectId(faqId),
          'answers._id': new ObjectId(answerId),
        },
        {
          $addToSet: { 'answers.$.helpfulUsers': userId },
          $inc: { 'answers.$.helpfulCount': 1 },
          $set: { updatedAt: new Date() },
        }
      );
    }

    return true;
  } catch (error) {
    console.error('Error marking answer as helpful:', error);
    return false;
  }
}

/**
 * Increment FAQ view count
 */
export async function incrementFAQViewCount(faqId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.collection<FAQ>('faqs').updateOne(
      { _id: new ObjectId(faqId) },
      {
        $inc: { viewCount: 1 },
      }
    );
    return true;
  } catch (error) {
    console.error('Error incrementing FAQ view count:', error);
    return false;
  }
}

/**
 * Get unanswered FAQs (for admin dashboard)
 */
export async function getUnansweredFAQs(limit: number = 50): Promise<FAQ[]> {
  try {
    const db = await getDatabase();
    const faqs = await db.collection<FAQ>('faqs')
      .find({ isAnswered: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    return faqs;
  } catch (error) {
    console.error('Error getting unanswered FAQs:', error);
    return [];
  }
}
