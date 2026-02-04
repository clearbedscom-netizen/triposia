import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { createFAQ, findFAQsByPage, type FAQ } from '@/lib/faqs';

/**
 * GET /api/faqs - Get FAQs for a specific page
 * Query params: pageType, pageSlug, limit, sortBy, includeUnanswered
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageType = searchParams.get('pageType') as FAQ['pageType'] | null;
    const pageSlug = searchParams.get('pageSlug');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const sortBy = searchParams.get('sortBy') as 'newest' | 'oldest' | 'most-answered' | 'most-helpful' | null;
    const includeUnanswered = searchParams.get('includeUnanswered') !== 'false';

    if (!pageType || !pageSlug) {
      return NextResponse.json(
        { error: 'pageType and pageSlug are required' },
        { status: 400 }
      );
    }

    const faqs = await findFAQsByPage(pageType, pageSlug, {
      limit,
      sortBy: sortBy || 'newest',
      includeUnanswered,
    });

    return NextResponse.json({ faqs }, { status: 200 });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/faqs - Create a new FAQ question
 * Body: { question, pageType, pageSlug, pageUrl, recaptchaToken }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { question, pageType, pageSlug, pageUrl, recaptchaToken } = body;

    // Validation
    if (!question || !pageType || !pageSlug || !pageUrl) {
      return NextResponse.json(
        { error: 'Question, pageType, pageSlug, and pageUrl are required' },
        { status: 400 }
      );
    }

    if (question.trim().length < 10) {
      return NextResponse.json(
        { error: 'Question must be at least 10 characters long' },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA
    if (!recaptchaToken) {
      return NextResponse.json(
        { error: 'reCAPTCHA verification required' },
        { status: 400 }
      );
    }

    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (recaptchaSecret) {
      const recaptchaResponse = await fetch(
        `https://www.google.com/recaptcha/api/siteverify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `secret=${recaptchaSecret}&response=${recaptchaToken}`,
        }
      );

      const recaptchaData = await recaptchaResponse.json();
      if (!recaptchaData.success) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed' },
          { status: 400 }
        );
      }
    }

    // Create FAQ
    const faq = await createFAQ({
      userId: session.user.id || '',
      userName: session.user.name || 'Anonymous',
      userImage: session.user.image || undefined,
      question: question.trim(),
      pageType: pageType as FAQ['pageType'],
      pageSlug,
      pageUrl,
    });

    if (!faq) {
      return NextResponse.json(
        { error: 'Failed to create FAQ' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Question submitted successfully', faq },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
