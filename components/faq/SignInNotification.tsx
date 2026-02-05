'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  Box,
  Alert,
  Button,
  IconButton,
  Link as MuiLink,
  Collapse,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  Google as GoogleIcon,
  PersonAdd as PersonAddIcon,
  QuestionAnswer as QuestionAnswerIcon,
} from '@mui/icons-material';
import Link from 'next/link';

export default function SignInNotification() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  // Check if user has dismissed this notification in localStorage
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session && !dismissed) {
      const dismissedKey = `signin-notification-dismissed-${pathname}`;
      const wasDismissed = localStorage.getItem(dismissedKey);
      if (!wasDismissed) {
        setShow(true);
      }
    } else {
      setShow(false);
    }
  }, [session, status, dismissed, pathname]);

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    const dismissedKey = `signin-notification-dismissed-${pathname}`;
    localStorage.setItem(dismissedKey, 'true');
  };

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: pathname });
  };

  // Don't show if user is signed in or loading
  if (status === 'loading' || session || !show) {
    return null;
  }

  return (
    <Collapse in={show}>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          width: '100%',
        }}
      >
        <Alert
          severity="info"
          icon={<QuestionAnswerIcon />}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleSignIn}
                sx={{
                  textTransform: 'none',
                  bgcolor: 'white',
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'grey.100',
                  },
                }}
              >
                Sign in with Google
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonAddIcon />}
                component={Link}
                href="/register"
                sx={{
                  textTransform: 'none',
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Register
              </Button>
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={handleDismiss}
                sx={{ color: 'inherit' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
          sx={{
            borderRadius: 0,
            bgcolor: 'primary.main',
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white',
            },
            '& .MuiAlert-message': {
              color: 'white',
              flex: 1,
            },
            py: { xs: 1, sm: 1.5 },
            px: { xs: 1, sm: 2 },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 2 }, alignItems: { xs: 'flex-start', sm: 'center' } }}>
            <Typography
              component="span"
              variant="body2"
              sx={{
                fontWeight: 500,
                color: 'white',
              }}
            >
              Want to ask a question? Sign in with Google or create an account to get started!
            </Typography>
          </Box>
        </Alert>
      </Box>
    </Collapse>
  );
}
