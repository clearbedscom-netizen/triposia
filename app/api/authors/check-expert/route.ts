import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { isUserExpert, isEmailExpert } from '@/lib/authors';
import { findUserById } from '@/lib/users';

/**
 * GET /api/authors/check-expert - Check if current user is an expert
 * Query params: userId (optional, uses session if not provided)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    let isExpert = false;
    
    if (userId) {
      // Check by userId
      isExpert = await isUserExpert(userId);
    } else {
      // Check by session
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        isExpert = await isUserExpert(session.user.id);
        
        // Also check by email if userId check fails
        if (!isExpert && session.user.email) {
          isExpert = await isEmailExpert(session.user.email);
        }
      }
    }
    
    return NextResponse.json({ isExpert }, { status: 200 });
  } catch (error) {
    console.error('Error checking expert status:', error);
    return NextResponse.json(
      { error: 'Internal server error', isExpert: false },
      { status: 500 }
    );
  }
}
