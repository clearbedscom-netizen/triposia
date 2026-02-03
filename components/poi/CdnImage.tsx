import Image from 'next/image';
import { Box } from '@mui/material';

interface CdnImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  priority?: boolean;
}

export default function CdnImage({ src, alt, width, height, className, priority = false }: CdnImageProps) {
  const imageUrl = src.startsWith('http') ? src : `https://ik.imagekit.io/clearmystay/askfares${src}`;
  
  const widthNum = typeof width === 'number' ? width : typeof width === 'string' ? parseInt(width) : 800;
  const heightNum = typeof height === 'number' ? height : typeof height === 'string' ? parseInt(height) : 600;
  
  return (
    <Box
      sx={{
        position: 'relative',
        width: width || '100%',
        height: height || 'auto',
        borderRadius: 1,
        overflow: 'hidden',
      }}
      className={className}
    >
      <Image
        src={imageUrl}
        alt={alt}
        width={widthNum}
        height={heightNum}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
        }}
        loading={priority ? undefined : 'lazy'}
        priority={priority}
        quality={85}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </Box>
  );
}

