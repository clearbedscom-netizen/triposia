'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import CommentIcon from '@mui/icons-material/Comment';

interface CommentFormProps {
  faqId: string;
  answerId: string;
  onCommentSubmitted?: () => void;
}

export default function CommentForm({ faqId, answerId, onCommentSubmitted }: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (content.trim().length < 5) {
      setError('Comment must be at least 5 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/faqs/${faqId}/answers/${answerId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit comment. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setContent('');

      if (onCommentSubmitted) {
        onCommentSubmitted();
      }

      // Refresh to show the new comment
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
    <Box sx={{ mt: 1, pl: 2, borderLeft: 2, borderColor: 'divider' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 1 }}>
          Your comment has been submitted successfully!
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          rows={2}
          size="small"
          label="Add a comment"
          placeholder="Share your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          disabled={loading}
          sx={{ mb: 1 }}
          helperText={`${content.length}/500 characters (minimum 5)`}
          inputProps={{ maxLength: 500 }}
        />

        <Button
          type="submit"
          variant="outlined"
          size="small"
          disabled={loading || content.trim().length < 5}
          startIcon={<CommentIcon />}
          sx={{ textTransform: 'none' }}
        >
          {loading ? 'Submitting...' : 'Comment'}
        </Button>
      </Box>
    </Box>
  );
}
