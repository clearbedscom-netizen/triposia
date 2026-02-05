import { Box, Typography, Paper, Divider, Chip } from '@mui/material';
import { findFAQsByPage } from '@/lib/faqs';
import type { FAQ } from '@/lib/faqs';
import { stripHtml } from '@/lib/utils/html';

interface FAQServerSectionProps {
  pageType: FAQ['pageType'];
  pageSlug: string;
}

/**
 * Server-side FAQ component that renders FAQs in HTML for SEO
 * This ensures FAQs are visible to search engines in the initial HTML
 */
export default async function FAQServerSection({
  pageType,
  pageSlug,
}: FAQServerSectionProps) {
  // Fetch only answered FAQs for SEO (questions with at least one answer)
  const faqs = await findFAQsByPage(pageType, pageSlug, {
    limit: 20,
    sortBy: 'most-helpful',
    includeUnanswered: false, // Only show answered questions for SEO
  });

  // Filter to only FAQs with answers
  const answeredFAQs = faqs.filter(
    (faq) =>
      faq.isAnswered &&
      faq.answers &&
      faq.answers.length > 0
  );

  if (answeredFAQs.length === 0) {
    return null;
  }

  return (
    <Box component="section" sx={{ mt: 6, mb: 4 }}>
      <Typography
        variant="h4"
        component="h2"
        sx={{ mb: 3, fontWeight: 600 }}
        id="faqs"
      >
        Frequently Asked Questions
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {answeredFAQs.map((faq) => {
          // Get the best answer (expert answer first, then most helpful, then first)
          const bestAnswer =
            faq.answers.find((a) => a.isExpertAnswer || a.author) ||
            faq.answers
              .sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0))[0] ||
            faq.answers[0];

          if (!bestAnswer) return null;

          // Get answer content (support both old and new format)
          const answerContent = bestAnswer.answer || bestAnswer.content || '';
          const answerText = stripHtml(answerContent);
          
          // Get author information
          const authorName = bestAnswer.author?.name || bestAnswer.userName || 'Expert';
          const authorBio = bestAnswer.author?.bio;
          const authorDesignation = bestAnswer.author?.designation;
          const isExpert = bestAnswer.isExpertAnswer || !!bestAnswer.author;

          return (
            <Paper
              key={faq._id?.toString() || faq.question}
              component="article"
              sx={{ p: 3 }}
              itemScope
              itemType="https://schema.org/Question"
            >
              <Typography
                variant="h5"
                component="h3"
                sx={{ mb: 2, fontWeight: 600 }}
                itemProp="name"
              >
                {faq.question}
              </Typography>

              <Box
                itemScope
                itemType="https://schema.org/Answer"
                sx={{ mt: 2 }}
              >
                {/* Answer content with HTML support */}
                <Box
                  component="div"
                  sx={{ 
                    mb: 2, 
                    color: 'text.secondary', 
                    lineHeight: 1.8,
                    '& p': { mb: 1.5 },
                    '& strong, & b': { fontWeight: 600 },
                    '& em, & i': { fontStyle: 'italic' },
                    '& ul, & ol': { pl: 3, mb: 1.5 },
                    '& li': { mb: 0.5 },
                  }}
                  itemProp="text"
                  dangerouslySetInnerHTML={{ __html: answerContent }}
                />

                {/* Author information for SEO */}
                {isExpert && (
                  <Box 
                    sx={{ mt: 2 }}
                    itemProp="author"
                    itemScope
                    itemType="https://schema.org/Person"
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label="Expert Answer"
                        size="small"
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" itemProp="name">
                        by {authorName}
                      </Typography>
                      {authorDesignation && (
                        <Typography variant="caption" color="text.secondary">
                          • {authorDesignation}
                        </Typography>
                      )}
                    </Box>
                    {authorBio && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ display: 'block', mt: 0.5 }}
                        itemProp="description"
                      >
                        {authorBio}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              {faq.answers.length > 1 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 2, display: 'block' }}
                >
                  {faq.answers.length} answer{faq.answers.length !== 1 ? 's' : ''}
                </Typography>
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
