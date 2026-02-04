import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { addAnswerToFAQ, findFAQById } from '@/lib/faqs';
import { findUserById } from '@/lib/users';
import { isUserExpert, isEmailExpert, findAuthorByUserId, findAuthorByEmail } from '@/lib/authors';

/**
 * POST /api/faqs/[id]/answers - Add an answer to a FAQ
 * Body: { content, isExpertAnswer }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, isExpertAnswer } = body;

    // Validation
    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Answer must be at least 10 characters long' },
        { status: 400 }
      );
    }

    // Check if FAQ exists
    const faq = await findFAQById(params.id);
    if (!faq) {
      return NextResponse.json(
        { error: 'FAQ not found' },
        { status: 404 }
      );
    }

    // Get user details
    const user = await findUserById(session.user.id || '');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is an expert from authors collection
    const isExpert = await isUserExpert(session.user.id || '') || 
                     await isEmailExpert(user.email) ||
                     (process.env.ADMIN_EMAILS?.split(',').includes(user.email) || false);
    
    // Only allow expert answers if user is actually an expert
    const finalIsExpertAnswer = isExpertAnswer === true && isExpert;
    
    // Get author details if user is an expert
    let expertName = user.name;
    let expertImage = user.image;
    if (isExpert) {
      const author = await findAuthorByUserId(session.user.id || '') || 
                     await findAuthorByEmail(user.email);
      if (author) {
        expertName = author.name || user.name;
        expertImage = author.profile_image || user.image;
      }
    }

    // Add answer
    const updatedFAQ = await addAnswerToFAQ(params.id, {
      userId: session.user.id || '',
      userName: finalIsExpertAnswer ? expertName : user.name,
      userImage: finalIsExpertAnswer ? expertImage : (user.image || undefined),
      content: content.trim(),
      isExpertAnswer: finalIsExpertAnswer,
    });

    if (!updatedFAQ) {
      return NextResponse.json(
        { error: 'Failed to add answer' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Answer added successfully', faq: updatedFAQ },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding answer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
