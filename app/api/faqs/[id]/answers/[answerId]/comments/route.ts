import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { addCommentToAnswer, findFAQById } from '@/lib/faqs';
import { findUserById } from '@/lib/users';

/**
 * POST /api/faqs/[id]/answers/[answerId]/comments - Add a comment to an answer
 * Body: { content }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; answerId: string } }
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
    const { content } = body;

    // Validation
    if (!content || content.trim().length < 5) {
      return NextResponse.json(
        { error: 'Comment must be at least 5 characters long' },
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

    // Check if answer exists
    const answer = faq.answers.find(a => a._id?.toString() === params.answerId);
    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found' },
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

    // Add comment
    const updatedFAQ = await addCommentToAnswer(params.id, params.answerId, {
      userId: session.user.id || '',
      userName: user.name,
      userImage: user.image || undefined,
      content: content.trim(),
    });

    if (!updatedFAQ) {
      return NextResponse.json(
        { error: 'Failed to add comment' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Comment added successfully', faq: updatedFAQ },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
