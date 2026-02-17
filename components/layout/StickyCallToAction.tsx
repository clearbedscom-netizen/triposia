'use client';

import { Box, Typography, Paper } from '@mui/material';
import { SupportAgent, Phone } from '@mui/icons-material';
import Link from 'next/link';

export default function StickyCallToAction() {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        p: { xs: 1, sm: 1.5 },
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Paper
        component={Link}
        href="tel:+18883519011"
        elevation={2}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 2 },
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2,
          textDecoration: 'none',
          color: 'inherit',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.12) 100%)',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'primary.light',
          maxWidth: { xs: '100%', sm: '600px' },
          width: '100%',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
            transform: 'translateY(-2px)',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(37, 99, 235, 0.16) 100%)',
            borderColor: 'primary.main',
          },
        }}
      >
        {/* Support Agent Icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <SupportAgent
            sx={{
              fontSize: { xs: '1.75rem', sm: '2rem' },
              color: 'primary.main',
            }}
          />
        </Box>

        {/* Phone Number and Text */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1rem', sm: '1.125rem' },
              fontWeight: 600,
              color: 'primary.main',
              lineHeight: 1.2,
            }}
          >
            +1-(888) 351-9011
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              color: 'text.secondary',
              lineHeight: 1.2,
            }}
          >
            Speak with expert • No hold
            </Typography>
          </Box>

        {/* Phone Icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Phone
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              color: 'primary.main',
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
