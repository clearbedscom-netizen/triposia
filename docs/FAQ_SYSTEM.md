# Q&A System Implementation

## Overview
A comprehensive Q&A system has been implemented that allows users to ask questions on any page, with admin/expert answers and user comments. The system includes reCAPTCHA protection, user authentication, and visual highlighting for unanswered questions.

## Features

### 1. User Questions
- Users can ask questions on any page (flight routes, airline routes, airline airports, airports, airlines)
- Questions require authentication (sign in or register)
- reCAPTCHA verification to prevent spam
- Questions are stored in MongoDB `faqs` collection

### 2. Admin/Expert Answers
- Admins and experts can provide answers to questions
- Expert answers are marked with a verified badge
- Answers can be marked as helpful by users

### 3. User Comments
- Users can comment on answers
- Comments are nested under answers
- Comments require authentication

### 4. Visual Highlighting
- Unanswered questions are highlighted with a warning border and background
- "Unanswered" chip badge displayed on unanswered questions
- Highlighting is removed once an expert answer is provided

### 5. Helpful Voting
- Users can mark questions and answers as helpful
- Helpful counts are displayed
- Users can toggle their helpful vote

## Database Schema

### FAQs Collection
```typescript
{
  _id: ObjectId,
  userId: string,           // User who asked
  userName: string,
  userImage?: string,
  question: string,
  pageType: 'flight-route' | 'airline-route' | 'airline-airport' | 'airport' | 'airline' | 'general',
  pageSlug: string,         // e.g., "del-bom", "dl/jfk", "jfk"
  pageUrl: string,          // Full URL path
  answers: FAQAnswer[],
  createdAt: Date,
  updatedAt: Date,
  isAnswered: boolean,      // true if has expert answer
  isHighlighted: boolean,  // true if unanswered
  viewCount?: number,
  helpfulCount?: number,
  helpfulUsers?: string[]
}
```

### FAQAnswer
```typescript
{
  _id: ObjectId,
  userId: string,
  userName: string,
  userImage?: string,
  content: string,
  isExpertAnswer: boolean,
  createdAt: Date,
  updatedAt?: Date,
  comments: FAQComment[],
  helpfulCount?: number,
  helpfulUsers?: string[]
}
```

### FAQComment
```typescript
{
  _id: ObjectId,
  userId: string,
  userName: string,
  userImage?: string,
  content: string,
  createdAt: Date,
  updatedAt?: Date
}
```

## API Routes

### GET /api/faqs
Query parameters:
- `pageType`: Type of page (required)
- `pageSlug`: Page identifier (required)
- `limit`: Number of FAQs to return (default: 50)
- `sortBy`: Sort order - 'newest', 'oldest', 'most-answered', 'most-helpful' (default: 'newest')
- `includeUnanswered`: Include unanswered questions (default: true)

### POST /api/faqs
Body:
- `question`: Question text (required, min 10 chars)
- `pageType`: Type of page (required)
- `pageSlug`: Page identifier (required)
- `pageUrl`: Full URL path (required)
- `recaptchaToken`: reCAPTCHA token (required)

### POST /api/faqs/[id]/answers
Body:
- `content`: Answer text (required, min 10 chars)
- `isExpertAnswer`: Mark as expert answer (admin only)

### POST /api/faqs/[id]/answers/[answerId]/comments
Body:
- `content`: Comment text (required, min 5 chars)

### POST /api/faqs/[id]/helpful
Toggle helpful status for a question

### POST /api/faqs/[id]/answers/[answerId]/helpful
Toggle helpful status for an answer

## Components

### QASection
Main component that displays all questions, answers, and comments for a page.

**Props:**
- `pageType`: Type of page
- `pageSlug`: Page identifier
- `pageUrl`: Full URL path

**Usage:**
```tsx
<QASection
  pageType="flight-route"
  pageSlug="del-bom"
  pageUrl="/flights/del-bom"
/>
```

### QuestionForm
Form component for asking questions. Includes reCAPTCHA and authentication check.

### AnswerForm
Form component for answering questions. Includes expert answer checkbox for admins.

### CommentForm
Form component for commenting on answers.

## Environment Variables

Add these to your `.env.local` file:

```bash
# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here

# Admin Emails (comma-separated) - Optional fallback
# Primary expert verification comes from authors collection
ADMIN_EMAILS=admin@example.com,expert@example.com
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,expert@example.com
```

**Note**: Expert status is primarily determined by the `authors` collection in MongoDB. The `ADMIN_EMAILS` environment variable is only used as a fallback.

## Setup Instructions

1. **Get reCAPTCHA Keys**
   - Go to https://www.google.com/recaptcha/admin
   - Create a new site (reCAPTCHA v2)
   - Copy the Site Key and Secret Key
   - Add them to your environment variables

2. **Set Admin Emails**
   - Add admin/expert email addresses to `ADMIN_EMAILS` and `NEXT_PUBLIC_ADMIN_EMAILS`
   - These users will be able to mark answers as expert answers

3. **Database Indexes**
   Create indexes for better performance:
   ```javascript
   db.faqs.createIndex({ pageType: 1, pageSlug: 1, createdAt: -1 });
   db.faqs.createIndex({ isAnswered: 1, createdAt: -1 });
   db.faqs.createIndex({ userId: 1 });
   ```

## Page Integration

The QASection component has been integrated into:
- `/flights/[route]` - Flight route pages
- `/airlines/[code]/[route]` - Airline route pages
- `/airlines/[code]` - Airline pages
- `/airlines/[code]/[iata]` - Airline airport pages
- `/airports/[iata]` - Airport pages

## User Registration

Users can register in two ways:
1. **Email/Password Registration**: Standard registration form at `/register`
2. **Google OAuth**: Sign in with Google (already configured)

Both methods create users in the `users` collection.

## Admin/Expert Answering

Experts are defined in the MongoDB `authors` collection. An author is considered an expert if:
- `is_active` is not `false`
- `role` is either `'AUTHOR'` or `'ADMIN'`

To answer as an expert:
1. Sign in with an email that matches an author in the `authors` collection
2. Navigate to a page with questions
3. Click "Add an Answer" on any question
4. Check "Mark as Expert Answer" checkbox (only visible if you're an expert)
5. Submit your answer

Expert answers are visually distinguished with:
- Blue border and background
- "Expert" badge with verified icon
- Higher visibility in the answer list
- Author's name and profile image from the authors collection

### Authors Collection Structure

The `authors` collection contains expert information:
- `name`: Author's full name
- `email`: Email address (used to match with user accounts)
- `role`: Either `'AUTHOR'` or `'ADMIN'`
- `is_active`: Boolean indicating if author is active
- `designation`: Job title (e.g., "Travel Writer", "Content Writer")
- `expertise_topics`: Array of expertise areas
- `profile_image`: Profile image path
- `bio`: Author biography
- `userId`: Optional link to users collection

## Unanswered Questions

Unanswered questions are automatically highlighted with:
- Warning-colored border (orange/yellow)
- Warning-colored background
- "Unanswered" chip badge in the top-right corner

This helps admins quickly identify questions that need attention.

## Future Enhancements

Potential improvements:
- Email notifications for unanswered questions
- Admin dashboard for managing FAQs
- Question moderation/approval workflow
- Rich text editor for answers
- Image attachments
- Search functionality
- Question categories/tags
