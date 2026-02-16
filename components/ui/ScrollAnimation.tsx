'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { Box, BoxProps } from '@mui/material';

interface ScrollAnimationProps extends BoxProps {
  children: ReactNode;
  delay?: number;
  direction?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight';
}

/**
 * Component that animates on scroll into view
 * Uses Intersection Observer API for performance
 */
export default function ScrollAnimation({
  children,
  delay = 0,
  direction = 'fadeIn',
  sx,
  ...props
}: ScrollAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true);
            }, delay);
            // Unobserve after animation to improve performance
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [delay]);

  const getAnimationStyles = () => {
    const baseStyles = {
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
    };

    switch (direction) {
      case 'slideUp':
        return {
          ...baseStyles,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        };
      case 'slideLeft':
        return {
          ...baseStyles,
          transform: isVisible ? 'translateX(0)' : 'translateX(30px)',
        };
      case 'slideRight':
        return {
          ...baseStyles,
          transform: isVisible ? 'translateX(0)' : 'translateX(-30px)',
        };
      case 'fadeIn':
      default:
        return baseStyles;
    }
  };

  return (
    <Box
      ref={elementRef}
      sx={{
        ...getAnimationStyles(),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
