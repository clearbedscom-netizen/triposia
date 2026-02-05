import { Box, Typography, Paper, Divider } from '@mui/material';
import { findFAQsByPage } from '@/lib/faqs';
import type { FAQ } from '@/lib/faqs';

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
            faq.answers.find((a) => a.isExpertAnswer) ||
            faq.answers
              .sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0))[0] ||
            faq.answers[0];

          if (!bestAnswer) return null;

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
              <Typography
                variant="body1"
                component="p"
                sx={{ mb: 2, color: 'text.secondary', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}
                itemProp="text"
              >
                {bestAnswer.content}
              </Typography>

                {bestAnswer.isExpertAnswer && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: 1,
                        fontWeight: 600,
                      }}
                    >
                      Expert Answer
                    </Typography>
                    {bestAnswer.userName && (
                      <Typography variant="caption" color="text.secondary">
                        by {bestAnswer.userName}
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
