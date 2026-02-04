'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
  Paper,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

interface AnswerFormProps {
  faqId: string;
  onAnswerSubmitted?: () => void;
}

export default function AnswerForm({ faqId, onAnswerSubmitted }: AnswerFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [isExpertAnswer, setIsExpertAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [isExpert, setIsExpert] = useState(false);

  // Check if user is an expert from authors collection
  useEffect(() => {
    const checkExpertStatus = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/authors/check-expert?userId=${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            setIsExpert(data.isExpert || false);
          }
        } catch (error) {
          console.error('Error checking expert status:', error);
          // Fallback to admin email check
          setIsExpert(
            session?.user?.email && 
            process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').includes(session.user.email) || false
          );
        }
      } else if (session?.user?.email) {
        // Fallback to admin email check
        setIsExpert(
          process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').includes(session.user.email) || false
        );
      }
    };
    checkExpertStatus();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (content.trim().length < 10) {
      setError('Answer must be at least 10 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/faqs/${faqId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          isExpertAnswer: isExpertAnswer && isAdmin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit answer. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setContent('');
      setIsExpertAnswer(false);

      if (onAnswerSubmitted) {
        onAnswerSubmitted();
      }

      // Refresh to show the new answer
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <SendIcon fontSize="small" />
        Add an Answer
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, mt: 1 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2, mt: 1 }}>
          Your answer has been submitted successfully!
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Your Answer"
          placeholder="Provide an answer to this question..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          disabled={loading}
          sx={{ mb: 1 }}
          helperText={`${content.length}/1000 characters (minimum 10)`}
          inputProps={{ maxLength: 1000 }}
        />

        {isExpert && (
          <FormControlLabel
            control={
              <Checkbox
                checked={isExpertAnswer}
                onChange={(e) => setIsExpertAnswer(e.target.checked)}
                disabled={loading}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VerifiedUserIcon fontSize="small" color="primary" />
                <Typography variant="body2">Mark as Expert Answer</Typography>
              </Box>
            }
            sx={{ mb: 1 }}
          />
        )}

        <Button
          type="submit"
          variant="contained"
          size="small"
          disabled={loading || content.trim().length < 10}
          startIcon={<SendIcon />}
          sx={{ textTransform: 'none' }}
        >
          {loading ? 'Submitting...' : 'Submit Answer'}
        </Button>
      </Box>
    </Paper>
  );
}
