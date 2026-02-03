'use client';

import { Box, Container, Typography, Link as MuiLink, IconButton } from '@mui/material';
import { Facebook, Instagram, YouTube } from '@mui/icons-material';
import { COMPANY_INFO } from '@/lib/company';
import StickyCallToAction from './StickyCallToAction';

export default function Footer() {
  return (
    <>
      {/* Sticky Call-to-Action Banner */}
      <StickyCallToAction />

      <Box
        component="footer"
        sx={{
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          py: { xs: 4, sm: 5 },
          mt: 'auto',
          pb: { xs: 8, sm: 9, md: 10 }, // Add padding bottom to account for sticky banner
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: { xs: 4, md: 3 } }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'primary.main', 
                  mb: 2,
                  fontSize: { xs: '1rem', sm: '1.125rem' },
                }}
              >
                {COMPANY_INFO.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="left" sx={{ mb: 1 }}>
                © {new Date().getFullYear()} {COMPANY_INFO.name}. All rights reserved.
              </Typography>
              <Typography variant="body2" color="text.secondary" align="left" sx={{ mb: 0.5 }}>
                {COMPANY_INFO.address.full}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="left">
                <MuiLink 
                  href={`mailto:${COMPANY_INFO.email}`} 
                  color="primary.main" 
                  underline="hover"
                  sx={{ 
                    transition: 'opacity 0.2s',
                    '&:hover': { opacity: 0.8 },
                  }}
                >
                  {COMPANY_INFO.email}
                </MuiLink>
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.primary" sx={{ mb: 1.5, fontWeight: 600 }}>
                Directories
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                <MuiLink 
                  href="/airports" 
                  color="text.secondary" 
                  underline="hover"
                  sx={{ 
                    transition: 'color 0.2s',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  Airports
                </MuiLink>
                <MuiLink 
                  href="/airlines" 
                  color="text.secondary" 
                  underline="hover"
                  sx={{ 
                    transition: 'color 0.2s',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  Airlines
                </MuiLink>
                <MuiLink 
                  href="/airlines/routes" 
                  color="text.secondary" 
                  underline="hover"
                  sx={{ 
                    transition: 'color 0.2s',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  Airline Routes
                </MuiLink>
                <MuiLink 
                  href="/flights" 
                  color="text.secondary" 
                  underline="hover"
                  sx={{ 
                    transition: 'color 0.2s',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  Flight Routes
                </MuiLink>
              </Box>
              <Typography variant="body2" color="text.primary" sx={{ mb: 1.5, fontWeight: 600 }}>
                About
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <MuiLink 
                  href="/manifesto" 
                  color="text.secondary" 
                  underline="hover"
                  sx={{ 
                    transition: 'color 0.2s',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  Manifesto
                </MuiLink>
                <MuiLink 
                  href="/how-we-help" 
                  color="text.secondary" 
                  underline="hover"
                  sx={{ 
                    transition: 'color 0.2s',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  How We Help
                </MuiLink>
                <MuiLink 
                  href="/editorial-policy" 
                  color="text.secondary" 
                  underline="hover"
                  sx={{ 
                    transition: 'color 0.2s',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  Editorial Policy
                </MuiLink>
                <MuiLink 
                  href="/corrections" 
                  color="text.secondary" 
                  underline="hover"
                  sx={{ 
                    transition: 'color 0.2s',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  Corrections
                </MuiLink>
                <MuiLink 
                  href="/team" 
                  color="text.secondary" 
                  underline="hover"
                  sx={{ 
                    transition: 'color 0.2s',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  Team
                </MuiLink>
              </Box>
            </Box>
            
            {/* Social Media Links */}
            <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '200px' } }}>
              <Typography variant="body2" color="text.primary" sx={{ mb: 1.5, fontWeight: 600 }}>
                Follow Us
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {COMPANY_INFO.social.facebook && (
                  <IconButton
                    component="a"
                    href={COMPANY_INFO.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: '#1877F2',
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Facebook />
                  </IconButton>
                )}
                {COMPANY_INFO.social.instagram && (
                  <IconButton
                    component="a"
                    href={COMPANY_INFO.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: '#E4405F',
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Instagram />
                  </IconButton>
                )}
                {COMPANY_INFO.social.youtube && (
                  <IconButton
                    component="a"
                    href={COMPANY_INFO.social.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: '#FF0000',
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <YouTube />
                  </IconButton>
                )}
                {COMPANY_INFO.social.dailymotion && (
                  <IconButton
                    component="a"
                    href={COMPANY_INFO.social.dailymotion}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Dailymotion"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: '#0066DC',
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <YouTube /> {/* Using YouTube icon as placeholder for Dailymotion */}
                  </IconButton>
                )}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}

