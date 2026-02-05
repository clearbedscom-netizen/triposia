'use client';

import { useState, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link as MuiLink,
  CircularProgress,
} from '@mui/material';
import ReCAPTCHA from 'react-google-recaptcha';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import LoginIcon from '@mui/icons-material/Login';
import GoogleIcon from '@mui/icons-material/Google';

interface QuestionFormProps {
  pageType: 'flight-route' | 'airline-route' | 'airline-airport' | 'airport' | 'airline' | 'general';
  pageSlug: string;
  pageUrl: string;
  onQuestionSubmitted?: () => void;
}

export default function QuestionForm({
  pageType,
  pageSlug,
  pageUrl,
  onQuestionSubmitted,
}: QuestionFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!session) {
      setError('Please sign in to ask a question. Redirecting to sign-in...');
      setTimeout(() => {
        signIn('google', { callbackUrl: pageUrl });
      }, 1500);
      return;
    }

    if (question.trim().length < 10) {
      setError('Question must be at least 10 characters long');
      return;
    }

    const recaptchaToken = recaptchaRef.current?.getValue();
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/faqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          pageType,
          pageSlug,
          pageUrl,
          ...(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && { recaptchaToken }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Authentication required - redirect to sign in
          setError(data.message || data.error || 'Please sign in to ask a question.');
          setTimeout(() => {
            signIn('google', { callbackUrl: pageUrl });
          }, 2000);
        } else {
          setError(data.error || 'Failed to submit question. Please try again.');
        }
        recaptchaRef.current?.reset();
        setLoading(false);
        return;
      }

      setSuccess(true);
      setQuestion('');
      recaptchaRef.current?.reset();

      if (onQuestionSubmitted) {
        onQuestionSubmitted();
      }

      // Refresh the page to show the new question
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      recaptchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      </Paper>
    );
  }

  if (!session) {
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <QuestionAnswerIcon color="primary" />
          <Typography variant="h6">Ask a Question</Typography>
        </Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please sign in to ask a question about this page. You can sign in with Google or create a new account.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Button
              variant="contained"
              fullWidth={false}
              startIcon={<GoogleIcon />}
              onClick={() => signIn('google', { callbackUrl: pageUrl })}
              sx={{
                textTransform: 'none',
                bgcolor: '#4285F4',
                '&:hover': {
                  bgcolor: '#357AE8',
                },
              }}
            >
              Sign in with Google
            </Button>
            <Button
              variant="outlined"
              fullWidth={false}
              component={MuiLink}
              href="/register"
              sx={{ textDecoration: 'none', textTransform: 'none' }}
            >
              Create Account
            </Button>
            <Button
              variant="text"
              fullWidth={false}
              component={MuiLink}
              href="/login"
              sx={{ textDecoration: 'none', textTransform: 'none' }}
            >
              Sign In
            </Button>
          </Box>
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <QuestionAnswerIcon color="primary" />
        <Typography variant="h6">Ask a Question</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Your question has been submitted successfully! It will appear once approved.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Your Question"
          placeholder="Ask a question about this page..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          disabled={loading}
          sx={{ mb: 2 }}
          helperText={`${question.length}/500 characters (minimum 10)`}
          inputProps={{ maxLength: 500 }}
        />

        {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
          <Box sx={{ mb: 2 }}>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
              theme="light"
            />
          </Box>
        )}

        <Button
          type="submit"
          variant="contained"
          disabled={loading || question.trim().length < 10}
          sx={{ textTransform: 'none' }}
        >
          {loading ? 'Submitting...' : 'Submit Question'}
        </Button>
      </Box>
    </Paper>
  );
}
