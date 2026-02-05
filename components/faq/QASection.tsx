'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Button,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  QuestionAnswer as QuestionAnswerIcon,
  VerifiedUser as VerifiedUserIcon,
  ThumbUp as ThumbUpIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import QuestionForm from './QuestionForm';
import AnswerForm from './AnswerForm';
import CommentForm from './CommentForm';
import type { FAQ, FAQAnswer, FAQComment } from '@/lib/faqs';

interface QASectionProps {
  pageType: 'flight-route' | 'airline-route' | 'airline-airport' | 'airport' | 'airline' | 'general';
  pageSlug: string;
  pageUrl: string;
}

export default function QASection({ pageType, pageSlug, pageUrl }: QASectionProps) {
  const { data: session } = useSession();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [helpfulFAQs, setHelpfulFAQs] = useState<Set<string>>(new Set());
  const [helpfulAnswers, setHelpfulAnswers] = useState<Set<string>>(new Set());

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/faqs?pageType=${pageType}&pageSlug=${pageSlug}&includeUnanswered=true&sortBy=newest`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch FAQs');
      }

      setFaqs(data.faqs || []);
      
      // Initialize helpful states
      if (session?.user?.id) {
        const helpfulFAQsSet = new Set<string>();
        const helpfulAnswersSet = new Set<string>();
        
        data.faqs?.forEach((faq: FAQ) => {
          if (faq.helpfulUsers?.includes(session.user.id || '')) {
            helpfulFAQsSet.add(faq._id?.toString() || '');
          }
          faq.answers?.forEach((answer: FAQAnswer) => {
            if (answer.helpfulUsers?.includes(session.user.id || '')) {
              helpfulAnswersSet.add(`${faq._id}-${answer._id}`);
            }
          });
        });
        
        setHelpfulFAQs(helpfulFAQsSet);
        setHelpfulAnswers(helpfulAnswersSet);
      }
    } catch (err) {
      setError('Failed to load questions. Please try again.');
      console.error('Error fetching FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageType, pageSlug]);

  const handleQuestionSubmitted = () => {
    fetchFAQs();
  };

  const handleAnswerSubmitted = () => {
    fetchFAQs();
  };

  const handleCommentSubmitted = () => {
    fetchFAQs();
  };

  const toggleAnswerExpanded = (faqId: string, answerId: string) => {
    const key = `${faqId}-${answerId}`;
    setExpandedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleCommentsExpanded = (faqId: string, answerId: string) => {
    const key = `${faqId}-${answerId}`;
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleMarkFAQHelpful = async (faqId: string) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/faqs/${faqId}/helpful`, {
        method: 'POST',
      });

      if (response.ok) {
        setHelpfulFAQs((prev) => {
          const next = new Set(prev);
          if (next.has(faqId)) {
            next.delete(faqId);
          } else {
            next.add(faqId);
          }
          return next;
        });
        fetchFAQs(); // Refresh to get updated counts
      }
    } catch (err) {
      console.error('Error marking FAQ as helpful:', err);
    }
  };

  const handleMarkAnswerHelpful = async (faqId: string, answerId: string) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/faqs/${faqId}/answers/${answerId}/helpful`, {
        method: 'POST',
      });

      if (response.ok) {
        const key = `${faqId}-${answerId}`;
        setHelpfulAnswers((prev) => {
          const next = new Set(prev);
          if (next.has(key)) {
            next.delete(key);
          } else {
            next.add(key);
          }
          return next;
        });
        fetchFAQs(); // Refresh to get updated counts
      }
    } catch (err) {
      console.error('Error marking answer as helpful:', err);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <QuestionAnswerIcon color="primary" />
        <Typography variant="h4" component="h2">
          Questions & Answers
        </Typography>
      </Box>

      <QuestionForm
        pageType={pageType}
        pageSlug={pageSlug}
        pageUrl={pageUrl}
        onQuestionSubmitted={handleQuestionSubmitted}
      />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {!loading && faqs.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <QuestionAnswerIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No questions yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Be the first to ask a question about this page!
          </Typography>
        </Paper>
      )}

      {!loading && faqs.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {faqs.map((faq) => {
            const faqId = faq._id?.toString() || '';
            return (
              <Paper
              key={faqId}
              sx={{
                p: 3,
                border: faq.isHighlighted && !faq.isAnswered ? 2 : 1,
                borderColor: faq.isHighlighted && !faq.isAnswered ? 'warning.main' : 'divider',
                bgcolor: faq.isHighlighted && !faq.isAnswered ? 'warning.light' : 'background.paper',
                position: 'relative',
              }}
            >
              {faq.isHighlighted && !faq.isAnswered && (
                <Chip
                  label="Unanswered"
                  color="warning"
                  size="small"
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                />
              )}

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Avatar
                  src={faq.userImage}
                  alt={faq.userName}
                  sx={{ width: 40, height: 40 }}
                >
                  {faq.userName.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {faq.userName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(() => {
                      try {
                        return formatDistanceToNow(new Date(faq.createdAt), { addSuffix: true });
                      } catch {
                        return 'recently';
                      }
                    })()}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                {faq.question}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                <Button
                  size="small"
                  startIcon={<ThumbUpIcon />}
                  onClick={() => handleMarkFAQHelpful(faq._id?.toString() || '')}
                  disabled={!session}
                  color={helpfulFAQs.has(faq._id?.toString() || '') ? 'primary' : 'inherit'}
                  sx={{ textTransform: 'none' }}
                >
                  Helpful ({faq.helpfulCount || 0})
                </Button>
                <Typography variant="caption" color="text.secondary">
                  {faq.answers.length} {faq.answers.length === 1 ? 'answer' : 'answers'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Answers */}
              {faq.answers.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  {faq.answers.map((answer) => (
                    <Box
                      key={answer._id?.toString()}
                      sx={{
                        pl: 2,
                        borderLeft: 2,
                        borderColor: answer.isExpertAnswer ? 'primary.main' : 'divider',
                        bgcolor: answer.isExpertAnswer ? 'primary.light' : 'transparent',
                        borderRadius: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                        <Avatar
                          src={answer.author?.profile_image || answer.userImage}
                          alt={answer.author?.name || answer.userName || 'Expert'}
                          sx={{ width: 32, height: 32 }}
                        >
                          {(answer.author?.name || answer.userName || 'E').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {answer.author?.name || answer.userName || 'Expert'}
                            </Typography>
                            {(answer.isExpertAnswer || answer.author) && (
                              <Chip
                                icon={<VerifiedUserIcon />}
                                label="Expert"
                                size="small"
                                color="primary"
                              />
                            )}
                            {answer.author?.designation && (
                              <Typography variant="caption" color="text.secondary">
                                • {answer.author.designation}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {(() => {
                              try {
                                return formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true });
                              } catch {
                                return 'recently';
                              }
                            })()}
                          </Typography>
                          {answer.author?.bio && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {answer.author.bio}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Answer content - support both HTML and plain text */}
                      <Box
                        component="div"
                        sx={{ 
                          mb: 1,
                          '& p': { mb: 1.5 },
                          '& strong, & b': { fontWeight: 600 },
                          '& em, & i': { fontStyle: 'italic' },
                          '& ul, & ol': { pl: 3, mb: 1.5 },
                          '& li': { mb: 0.5 },
                          '& br': { display: 'block', content: '""', marginBottom: '0.5em' },
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: answer.answer || answer.content || '' 
                        }}
                      />

                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                        <Button
                          size="small"
                          startIcon={<ThumbUpIcon />}
                          onClick={() =>
                            handleMarkAnswerHelpful(
                              faq._id?.toString() || '',
                              answer._id?.toString() || ''
                            )
                          }
                          disabled={!session}
                          color={helpfulAnswers.has(`${faq._id}-${answer._id}`) ? 'primary' : 'inherit'}
                          sx={{ textTransform: 'none', minWidth: 'auto' }}
                        >
                          Helpful ({answer.helpfulCount || 0})
                        </Button>
                        {answer.comments && answer.comments.length > 0 && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              toggleCommentsExpanded(
                                faq._id?.toString() || '',
                                answer._id?.toString() || ''
                              )
                            }
                          >
                            <CommentIcon fontSize="small" />
                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                              {answer.comments.length}
                            </Typography>
                            {expandedComments.has(`${faq._id}-${answer._id}`) ? (
                              <ExpandLessIcon fontSize="small" />
                            ) : (
                              <ExpandMoreIcon fontSize="small" />
                            )}
                          </IconButton>
                        )}
                      </Box>

                      {/* Comments */}
                      {answer.comments && answer.comments.length > 0 && (
                        <Collapse
                          in={expandedComments.has(`${faq._id}-${answer._id}`)}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ mt: 2, pl: 2, borderLeft: 1, borderColor: 'divider' }}>
                            {answer.comments.map((comment: FAQComment) => (
                              <Box key={comment._id?.toString()} sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                  <Avatar
                                    src={comment.userImage}
                                    alt={comment.userName}
                                    sx={{ width: 24, height: 24 }}
                                  >
                                    {comment.userName.charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" fontWeight={600}>
                                      {comment.userName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                      {(() => {
                                        try {
                                          return formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
                                        } catch {
                                          return 'recently';
                                        }
                                      })()}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Typography variant="body2" sx={{ pl: 4, whiteSpace: 'pre-wrap' }}>
                                  {comment.content}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Collapse>
                      )}

                      {/* Comment Form */}
                      {session && (
                        <CommentForm
                          faqId={faq._id?.toString() || ''}
                          answerId={answer._id?.toString() || ''}
                          onCommentSubmitted={handleCommentSubmitted}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              )}

              {/* Answer Form */}
              {session && (
                <AnswerForm
                  faqId={faq._id?.toString() || ''}
                  onAnswerSubmitted={handleAnswerSubmitted}
                />
              )}
            </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
