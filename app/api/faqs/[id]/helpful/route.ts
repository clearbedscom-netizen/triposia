import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { markFAQAsHelpful } from '@/lib/faqs';

/**
 * POST /api/faqs/[id]/helpful - Toggle helpful status for a FAQ
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

    const success = await markFAQAsHelpful(params.id, session.user.id || '');

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
