'use client';

import { Box, Typography, Paper } from '@mui/material';
import { SupportAgent, Phone } from '@mui/icons-material';
import Link from 'next/link';
import { COMPANY_INFO } from '@/lib/company';

export default function StickyCallToAction() {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        p: { xs: 1.25, sm: 1.5 },
        display: 'flex',
        justifyContent: 'center',
        // Backdrop so bar reads as a distinct layer
        background: 'linear-gradient(to top, rgba(0,0,0,0.06) 0%, transparent 100%)',
      }}
    >
      <Paper
        component={Link}
        href={`tel:${COMPANY_INFO.phone.tel}`}
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 2 },
          p: { xs: 1.75, sm: 2.25 },
          borderRadius: 3,
          textDecoration: 'none',
          color: 'inherit',
          // Strong primary CTA: filled bar so it reads as “call now”
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 35%, #6366f1 65%, #0ea5e9 100%)',
          bgcolor: 'transparent',
          border: '2px solid rgba(255,255,255,0.25)',
          maxWidth: { xs: '100%', sm: '560px' },
          width: '100%',
          transition: 'all 0.25s ease',
          boxShadow: '0 -2px 12px rgba(37, 99, 235, 0.4), 0 4px 20px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
          '@keyframes ctaGlow': {
            '0%, 100%': { boxShadow: '0 -2px 12px rgba(37, 99, 235, 0.4), 0 4px 20px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)' },
            '50%': { boxShadow: '0 -2px 18px rgba(37, 99, 235, 0.5), 0 6px 26px rgba(99, 102, 241, 0.4), 0 0 24px rgba(14, 165, 233, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)' },
          },
          animation: 'ctaGlow 2.5s ease-in-out infinite',
          '&:hover': {
            boxShadow: '0 -4px 22px rgba(37, 99, 235, 0.55), 0 8px 30px rgba(99, 102, 241, 0.45), 0 0 32px rgba(14, 165, 233, 0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
            transform: 'translateY(-3px) scale(1.01)',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 30%, #6366f1 70%, #06b6d4 100%)',
            borderColor: 'rgba(255,255,255,0.4)',
            animation: 'none',
          },
          '&:active': {
            transform: 'translateY(-1px) scale(0.99)',
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
            width: { xs: 48, sm: 52 },
            height: { xs: 48, sm: 52 },
            borderRadius: 2,
            background: 'linear-gradient(145deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.12) 100%)',
            border: '1px solid rgba(255,255,255,0.35)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
          }}
        >
          <SupportAgent
            sx={{
              fontSize: { xs: '1.875rem', sm: '2.25rem' },
              color: 'white',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
            }}
          />
        </Box>

        {/* Phone Number and CTA text */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.25,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #fef08a 0%, #fde047 50%, #facc15 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 0 20px rgba(254, 240, 138, 0.5)',
              lineHeight: 1.2,
            }}
          >
            Call now — expert help, no hold
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.35rem' },
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.2,
              letterSpacing: '0.02em',
              textShadow: '0 1px 3px rgba(0,0,0,0.2), 0 0 12px rgba(255,255,255,0.15)',
            }}
          >
            {COMPANY_INFO.phone.display}
          </Typography>
        </Box>

        {/* Phone Icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            width: { xs: 44, sm: 48 },
            height: { xs: 44, sm: 48 },
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #fde047 0%, #facc15 50%, #eab308 100%)',
            border: '2px solid rgba(255,255,255,0.6)',
            boxShadow: '0 2px 8px rgba(234, 179, 8, 0.4), inset 0 1px 0 rgba(255,255,255,0.5)',
          }}
        >
          <Phone
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              color: '#1e293b',
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
