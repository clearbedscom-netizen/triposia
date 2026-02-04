import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { markAnswerAsHelpful } from '@/lib/faqs';

/**
 * POST /api/faqs/[id]/answers/[answerId]/helpful - Toggle helpful status for an answer
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

    const success = await markAnswerAsHelpful(
      params.id,
      params.answerId,
      session.user.id || ''
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update helpful status' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Helpful status updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating helpful status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
