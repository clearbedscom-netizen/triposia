'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import { Close, Phone, LocalPhone } from '@mui/icons-material';
import Link from 'next/link';
import { keyframes } from '@mui/system';

// Animation for pulsing phone icon
const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 0 8px rgba(255, 255, 255, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
`;

// Animation for shimmer effect
const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

// Animation for bounce
const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
`;

export default function StickyCallToAction() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the popup
    const dismissed = localStorage.getItem('cta-dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('cta-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: '#2e7d32', // Dark green background
        background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #43a047 100%)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: { xs: 1.5, sm: 2 },
        gap: { xs: 1, sm: 2 },
        borderTop: '3px solid #1b5e20',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          animation: `${shimmer} 3s infinite`,
          pointerEvents: 'none',
        },
      }}
      className="commonBottomPopup_cardPopup__lZUrO commonBottomPopup_activeCard__1VnmS"
    >
      {/* Close Button */}
      <IconButton
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top: { xs: 4, sm: 8 },
          right: { xs: 8, sm: 16 },
          color: 'rgba(255, 255, 255, 0.9)',
          bgcolor: 'rgba(0, 0, 0, 0.1)',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.2)',
            color: '#fff',
          },
          zIndex: 2,
          transition: 'all 0.2s ease',
        }}
        aria-label="Close"
      >
        <Close />
      </IconButton>

      {/* Content */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 2 },
          width: '100%',
          maxWidth: '1200px',
          mx: 'auto',
          pr: { xs: 4, sm: 6 },
        }}
        className="commonBottomPopup_popUpSec__FYsIP"
      >
        {/* Animated Phone Icon */}
        <Box
          sx={{
            flexShrink: 0,
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            width: 70,
            height: 70,
            borderRadius: '50%',
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            position: 'relative',
            animation: `${pulse} 2s ease-in-out infinite`,
          }}
        >
          <LocalPhone
            sx={{
              fontSize: '2rem',
              color: '#fff',
              animation: `${bounce} 2s ease-in-out infinite`,
            }}
          />
          {/* Fallback image if available */}
          <Box
            component="img"
            src="/assets/call-us-image.jpg"
            alt="calling"
            loading="lazy"
            onError={(e) => {
              // Hide image if it doesn't exist
              e.currentTarget.style.display = 'none';
            }}
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'none', // Hidden by default, show if image loads
            }}
          />
        </Box>

        {/* Text Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 0.5, sm: 1 },
          }}
          className="commonBottomPopup_popupText__WErsT"
        >
          {/* Heading */}
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.3,
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
            className="commonBottomPopup_popupH6__Jg2Pi"
          >
            Need Affordable Flights?{' '}
            <Box
              component="span"
              sx={{
                display: { xs: 'block', sm: 'inline' },
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.95)',
              }}
              className="commonBottomPopup_phoneOnlytxt__jdV7h"
            >
              Just give us a call to get phone-only deals.
            </Box>
          </Typography>

          {/* Desktop Text */}
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
            className="commonBottomPopup_txtDesktop__TSu5j"
          >
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: '0.875rem',
              }}
            >
              Call us at
            </Typography>
            <Button
              component={Link}
              href="tel:+18779225372"
              variant="contained"
              startIcon={<Phone />}
              sx={{
                bgcolor: '#fff',
                color: '#2e7d32',
                fontWeight: 700,
                fontSize: '0.875rem',
                px: 2,
                py: 0.5,
                borderRadius: '20px',
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                },
                transition: 'all 0.2s ease',
                animation: `${bounce} 2s ease-in-out infinite`,
              }}
            >
              +1 877-922-5372
            </Button>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: '0.875rem',
              }}
            >
              and get travel assistance 24/7
            </Typography>
          </Box>

          {/* Mobile Text */}
          <Box
            sx={{
              display: { xs: 'flex', sm: 'none' },
              flexDirection: 'column',
              gap: 1,
            }}
            className="commonBottomPopup_txtMobile__crsC8"
          >
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: '0.8rem',
              }}
              className="commonBottomPopup_mobileCallus__K9nJA"
            >
              Call us for travel assistance.
            </Typography>
            <Button
              component={Link}
              href="tel:+18779225372"
              variant="contained"
              startIcon={<Phone />}
              fullWidth
              sx={{
                bgcolor: '#fff',
                color: '#2e7d32',
                fontWeight: 700,
                fontSize: '0.875rem',
                py: 1,
                borderRadius: '20px',
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                },
                transition: 'all 0.2s ease',
              }}
              className="commonBottomPopup_mobileTfn__31G0S"
            >
              +1 877-922-5372
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
