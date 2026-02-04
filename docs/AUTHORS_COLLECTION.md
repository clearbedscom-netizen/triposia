# Authors Collection - Expert System

## Overview

The `authors` collection in MongoDB contains information about experts who can answer FAQ questions. These experts are travel writers, content creators, and administrators who provide authoritative answers to user questions.

## Collection Structure

### Fields

- **`_id`** (ObjectId): Unique identifier
- **`name`** (string): Author's full name
- **`email`** (string): Email address (used to match with user accounts)
- **`slug`** (string): URL-friendly identifier
- **`bio`** (string): Author biography
- **`role`** (string): Either `'AUTHOR'` or `'ADMIN'`
- **`is_active`** (boolean): Whether the author is currently active
- **`designation`** (string): Job title (e.g., "Travel Writer", "Content Writer")
- **`expertise_topics`** (array): Array of expertise areas (e.g., ["Travel Writing", "Aviation"])
- **`profile_image`** (string): Path to profile image
- **`current_company`** (string): Current company/organization
- **`education`** (string): Educational background
- **`previous_experience`** (string): Previous work experience
- **`social_links`** (object): Social media links
  - `linkedin`: LinkedIn profile URL
  - `twitter`: Twitter profile URL
  - `website`: Personal website URL
- **`created_at`** (Date): Creation timestamp
- **`password_hash`** (string): Hashed password if author has login access
- **`userId`** (string): Optional link to users collection

## Expert Status

An author is considered an **expert** if:
1. `is_active` is not `false` (i.e., `true` or `undefined`)
2. `role` is either `'AUTHOR'` or `'ADMIN'`

## Integration with FAQ System

### How It Works

1. **User Authentication**: When a user signs in, the system checks if their email matches an author in the `authors` collection.

2. **Expert Verification**: The system verifies expert status by:
   - Checking if `userId` matches the logged-in user's ID
   - Checking if `email` matches the logged-in user's email
   - Verifying `is_active !== false` and `role` is `'AUTHOR'` or `'ADMIN'`

3. **Expert Answers**: When an expert answers a question:
   - The answer is marked with `isExpertAnswer: true`
   - The author's name and profile image from the collection are used
   - The answer displays with an "Expert" badge

### API Endpoints

- **GET `/api/authors`**: Get all authors
  - Query param `expertsOnly=true`: Only return experts
  
- **GET `/api/authors/check-expert`**: Check if current user is an expert
  - Query param `userId`: Optional user ID to check

## Adding New Experts

To add a new expert to the system:

1. **Add to Authors Collection**:
   ```javascript
   db.authors.insertOne({
     name: "Expert Name",
     email: "expert@example.com",
     slug: "expert-name",
     role: "AUTHOR",
     is_active: true,
     designation: "Travel Expert",
     expertise_topics: ["Travel", "Aviation"],
     bio: "Expert biography...",
     created_at: new Date()
   });
   ```

2. **Link to User Account** (Optional):
   - If the expert has a user account, add `userId` field linking to the users collection
   - Or ensure the `email` field matches their user account email

3. **Verify Expert Status**:
   - Run the check-expert API endpoint to verify
   - Or use the script: `node scripts/read-authors-collection.js`

## Current Experts

Based on the collection analysis, there are currently **9 active authors**:

1. Admin User (ADMIN)
2. Test Author (AUTHOR)
3. Helen Ochyra (AUTHOR) - Travel Writer
4. Kathy Condon (AUTHOR) - Travel Writer & Author
5. Punit Amalhotra (AUTHOR) - Travel Content Writer
6. Robin McKelvie (AUTHOR) - Travel Writer & Broadcaster
7. Maitri Shah (AUTHOR) - Content Writer
8. Stella Shon (AUTHOR) - Travel Writer
9. Kiersten Rich (AUTHOR) - Content Writer

All authors are active and can provide expert answers to FAQ questions.

## Scripts

### Read Authors Collection
```bash
node scripts/read-authors-collection.js
```

This script displays:
- Total count of authors
- All fields in the collection
- Details of each author
- Statistics (experts, active, with email, etc.)

## Best Practices

1. **Keep Authors Active**: Set `is_active: true` for all active experts
2. **Use Consistent Roles**: Use `'AUTHOR'` for content creators and `'ADMIN'` for administrators
3. **Link User Accounts**: Add `userId` field to link authors with user accounts for seamless authentication
4. **Maintain Expertise Topics**: Keep `expertise_topics` updated to help match questions with the right experts
5. **Profile Images**: Use `profile_image` field to display expert avatars in answers
