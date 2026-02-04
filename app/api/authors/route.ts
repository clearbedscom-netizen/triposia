import { NextRequest, NextResponse } from 'next/server';
import { getAllAuthors, getAllExperts } from '@/lib/authors';

/**
 * GET /api/authors - Get all authors/experts
 * Query params: expertsOnly (if true, only return experts)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const expertsOnly = searchParams.get('expertsOnly') === 'true';
    
    const authors = expertsOnly ? await getAllExperts() : await getAllAuthors();
    
    return NextResponse.json({ authors }, { status: 200 });
  } catch (error) {
    console.error('Error fetching authors:', error);
    return NextResponse.json(
      { error: 'Internal server error', authors: [] },
      { status: 500 }
    );
  }
}
