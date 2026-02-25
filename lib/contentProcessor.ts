/**
 * Content processor for optimizing blog post HTML for SEO
 */

import { addHeadingIds } from '@/lib/tableOfContents';

/**
 * Add cache-busting parameter to image URL
 */
function addCacheBustingToImageUrl(url: string, timestamp?: string): string {
  if (!url) return url;
  if (!timestamp) return url;
  
  // Skip if URL already has query parameters
  if (url.includes('?')) {
    // Check if it already has a cache-busting parameter
    if (url.includes('v=') || url.includes('updated_at=') || url.includes('t=')) {
      return url;
    }
    // Add cache-busting parameter
    const timestampValue = new Date(timestamp).getTime();
    return `${url}&v=${timestampValue}`;
  }
  
  // Add cache-busting parameter
  const timestampValue = new Date(timestamp).getTime();
  const separator = url.includes('#') ? '&' : '?';
  return `${url}${separator}v=${timestampValue}`;
}

/**
 * Process HTML content to ensure SEO optimization:
 * - Add alt text to images without alt attributes
 * - Ensure proper heading hierarchy
 * - Optimize links (add rel attributes, ensure proper structure)
 * - Add structured data hints
 * - Ensure semantic HTML structure
 * - Add cache-busting to image URLs
 */
export function processContentForSEO(
  html: string,
  options: {
    title?: string;
    slug?: string;
    defaultAltText?: string;
    updatedAt?: string; // Add updatedAt for cache-busting
  } = {}
): string {
  if (!html) return '';

  const { title, slug, defaultAltText, updatedAt } = options;

  // Create a temporary container to parse HTML
  // Note: This is server-side, so we'll use string manipulation
  let processed = html;

  // 0. Auto-detect and convert plain image URLs to <img> tags
  // This handles cases where users paste image URLs directly into the content
  // We need to process this carefully to avoid converting URLs that are already in tags
  
  // First, protect existing img tags and links by temporarily replacing them
  // BUT: We need to check if img tags have valid src attributes - if not, they might be broken and need fixing
  const protectedContent: Array<{ placeholder: string; original: string }> = [];
  let protectIndex = 0;
  
  // Protect existing img tags (only if they have a valid src with a URL)
  processed = processed.replace(/<img([^>]*)>/gi, (match, attributes) => {
    // Check if img tag has a valid src attribute with an actual URL
    const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i);
    const hasValidSrc = srcMatch && srcMatch[1] && (srcMatch[1].startsWith('http') || srcMatch[1].startsWith('/'));
    if (hasValidSrc) {
      const placeholder = `__PROTECTED_IMG_${protectIndex}__`;
      protectedContent.push({ placeholder, original: match });
      protectIndex++;
      return placeholder;
    }
    // If no valid src, don't protect it - let it be processed as a plain URL
    // This handles broken img tags or img tags with empty src
    return match;
  });
  
  // Protect existing links (including image links)
  processed = processed.replace(/<a[^>]*>[\s\S]*?<\/a>/gi, (match) => {
    const placeholder = `__PROTECTED_LINK_${protectIndex}__`;
    protectedContent.push({ placeholder, original: match });
    protectIndex++;
    return placeholder;
  });
  
  // Now process plain image URLs (with file extensions)
  // Match URLs ending with image extensions that are NOT inside HTML tags
  // More aggressive pattern to catch URLs in various contexts - process all matches
  const imageUrlPattern = /(https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp|avif|svg|bmp|ico)(\?[^\s<>"']*)?)/gi;
  let lastIndex = 0;
  let match;
  const replacements: Array<{ start: number; end: number; replacement: string }> = [];
  
  // Find all matches and check context
  while ((match = imageUrlPattern.exec(processed)) !== null) {
    const imageUrl = match[0];
    const matchIndex = match.index;
    
    if (matchIndex === undefined) continue;
    
    // Get context around the URL
    const beforeUrl = processed.substring(Math.max(0, matchIndex - 100), matchIndex);
    const afterUrl = processed.substring(matchIndex + imageUrl.length, Math.min(processed.length, matchIndex + imageUrl.length + 100));
    
    // Skip if already in img tag, link, or protected content
    if (beforeUrl.includes('__PROTECTED_') || beforeUrl.includes('<img') || beforeUrl.includes('src=') || 
        beforeUrl.includes('<a') || afterUrl.includes('</a>') || beforeUrl.includes('href=')) {
      continue;
    }
    
    // Convert plain URL to img tag
    const altText = title || defaultAltText || 'Blog post image';
    const imageUrlWithCache = updatedAt ? addCacheBustingToImageUrl(imageUrl, updatedAt) : imageUrl;
    replacements.push({
      start: matchIndex,
      end: matchIndex + imageUrl.length,
      replacement: `<img src="${imageUrlWithCache}" alt="${altText}" loading="lazy" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0; display: block;" />`
    });
  }
  
  // Apply replacements in reverse order to maintain indices
  replacements.reverse().forEach(({ start, end, replacement }) => {
    processed = processed.substring(0, start) + replacement + processed.substring(end);
  });

  // Also handle ImageKit and other CDN URLs that might not have file extensions
  // Pattern for ImageKit URLs: https://ik.imagekit.io/...
  // More aggressive pattern to catch all ImageKit URLs
  const imageKitPattern = /(https?:\/\/ik\.imagekit\.io\/[^\s<>"']+)/gi;
  const imageKitReplacements: Array<{ start: number; end: number; replacement: string }> = [];
  lastIndex = 0;
  
  // Find all ImageKit matches and check context
  while ((match = imageKitPattern.exec(processed)) !== null) {
    const imageUrl = match[0];
    const matchIndex = match.index;
    
    if (matchIndex === undefined) continue;
    
    // Get context around the URL
    const beforeUrl = processed.substring(Math.max(0, matchIndex - 100), matchIndex);
    const afterUrl = processed.substring(matchIndex + imageUrl.length, Math.min(processed.length, matchIndex + imageUrl.length + 100));
    
    // Skip if already in img tag, link, or protected content
    if (beforeUrl.includes('__PROTECTED_') || beforeUrl.includes('<img') || beforeUrl.includes('src=') || 
        beforeUrl.includes('<a') || afterUrl.includes('</a>') || beforeUrl.includes('href=')) {
      continue;
    }
    
    // ImageKit URLs often have query params, so we allow them
    const altText = title || defaultAltText || 'Blog post image';
    const imageUrlWithCache = updatedAt ? addCacheBustingToImageUrl(imageUrl, updatedAt) : imageUrl;
    imageKitReplacements.push({
      start: matchIndex,
      end: matchIndex + imageUrl.length,
      replacement: `<img src="${imageUrlWithCache}" alt="${altText}" loading="lazy" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0; display: block;" />`
    });
  }
  
  // Apply ImageKit replacements in reverse order
  imageKitReplacements.reverse().forEach(({ start, end, replacement }) => {
    processed = processed.substring(0, start) + replacement + processed.substring(end);
  });
  
  // Restore protected content
  protectedContent.forEach(({ placeholder, original }) => {
    processed = processed.replace(placeholder, original);
  });

  // 0.5. Add cache-busting to existing image URLs if updatedAt is provided
  // This ensures images are refreshed when post is updated
  // Also ensure all img tags have proper attributes
  if (updatedAt) {
    processed = processed.replace(
      /<img([^>]*?)>/gi,
      (match, attributes) => {
        // Extract src attribute
        const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
          const src = srcMatch[1];
          // Always update cache-busting parameter to force refresh
          // Remove old cache-busting params if present
          const cleanSrc = src.replace(/[?&](v|updated_at|t|timestamp)=[^&]*/g, '');
          const separator = cleanSrc.includes('?') ? '&' : '?';
          const timestampValue = new Date(updatedAt).getTime();
          const updatedSrc = `${cleanSrc}${separator}v=${timestampValue}`;
          // Replace the src in the attributes
          const updatedAttributes = attributes.replace(/src\s*=\s*["'][^"']+["']/i, `src="${updatedSrc}"`);
          return `<img${updatedAttributes}>`;
        }
        // If no valid src, return as-is (will be handled by other processing)
        return match;
      }
    );
  }

  // 1. Ensure images have alt text (replace empty alt attributes)
  processed = processed.replace(
    /<img([^>]*?)>/gi,
    (match, attributes) => {
      // Check if alt attribute exists and has a non-empty value
      const altMatch = attributes.match(/alt\s*=\s*["']([^"']*)["']/i);
      if (altMatch && altMatch[1] && altMatch[1].trim()) {
        return match; // Keep as is if alt exists and has content
      }

      // Add alt text based on title or default
      const altText = title || defaultAltText || 'Blog post image';
      // Remove existing empty alt attribute if present
      const cleanedAttributes = attributes.replace(/alt\s*=\s*["'][^"']*["']/i, '');
      // Insert alt attribute before the closing >
      return `<img${cleanedAttributes} alt="${altText}">`;
    }
  );

  // 2. Ensure images have loading="lazy" for performance (except first image)
  let imageCount = 0;
  processed = processed.replace(/<img([^>]*?)>/gi, (match) => {
    imageCount++;
    if (imageCount === 1) {
      // First image should load eagerly
      if (!/loading\s*=/i.test(match)) {
        return match.replace('>', ' loading="eager">');
      }
      return match;
    }
    // Subsequent images should lazy load
    if (!/loading\s*=/i.test(match)) {
      return match.replace('>', ' loading="lazy">');
    }
    return match;
  });

  // 3. Add dimensions hint for images (will be handled by CSS, but ensure width/height if available)
  // Note: This would require actual image dimensions, which we'll skip for now

  // 4. Optimize external links with proper attributes
  processed = processed.replace(
    /<a\s+([^>]*?href\s*=\s*["'](https?:\/\/[^"']+)["'][^>]*?)>/gi,
    (match) => {
      // Check if it's an external link (not our domain)
      const hrefMatch = match.match(/href\s*=\s*["']([^"']+)["']/i);
      if (hrefMatch && hrefMatch[1]) {
        const href = hrefMatch[1];
        const isExternal = /^https?:\/\//i.test(href) && 
          !href.includes('triposia.com');
        
        if (isExternal) {
          // Add rel="noopener noreferrer" for external links
          if (!/rel\s*=/i.test(match)) {
            return match.replace('>', ' rel="noopener noreferrer" target="_blank">');
          } else if (!/noopener/i.test(match)) {
            return match.replace(/rel\s*=\s*["']([^"']*)["']/i, 
              (relMatch, relValue) => `rel="${relValue} noopener noreferrer" target="_blank"`);
          } else if (!/target\s*=/i.test(match)) {
            return match.replace('>', ' target="_blank">');
          }
        }
      }
      return match;
    }
  );

  // 5. Ensure proper heading hierarchy (h2, h3, h4 - avoid h1 in content as page already has one)
  // Convert h1 tags in content to h2
  processed = processed.replace(/<h1([^>]*?)>/gi, '<h2$1>');
  processed = processed.replace(/<\/h1>/gi, '</h2>');

  // 6. Add schema.org microdata hints where appropriate
  // This is handled by JSON-LD, but we can add itemscope hints if needed

  // 7. Ensure proper semantic structure - wrap content in sections if needed
  // This is already handled by the page structure

  // 8. Add proper spacing and formatting
  // This is handled by CSS

  // 9. Add IDs to headings for table of contents
  processed = addHeadingIds(processed);

  // 10. Make tables responsive - remove fixed widths and add responsive attributes
  processed = processed.replace(
    /<table([^>]*?)>/gi,
    (match, attributes) => {
      // Remove width, style with width, and other fixed sizing attributes
      let cleaned = attributes
        .replace(/\s+width\s*=\s*["'][^"']*["']/gi, '')
        .replace(/\s+style\s*=\s*["']([^"']*)["']/gi, (styleMatch: string, styleValue: string) => {
          // Remove width from style attribute
          const cleanedStyle = styleValue
            .replace(/width\s*:\s*[^;]+;?/gi, '')
            .replace(/min-width\s*:\s*[^;]+;?/gi, '')
            .replace(/max-width\s*:\s*[^;]+;?/gi, '')
            .trim()
            .replace(/;\s*;/g, ';')
            .replace(/^;|;$/g, '');
          return cleanedStyle ? ` style="${cleanedStyle}"` : '';
        });
      
      // Add responsive wrapper class if not present
      if (!/class\s*=/i.test(cleaned)) {
        cleaned += ' class="responsive-table"';
      } else if (!/responsive/i.test(cleaned)) {
        cleaned = cleaned.replace(/class\s*=\s*["']([^"']*)["']/i, 
          (classMatch: string, classValue: string) => `class="${classValue} responsive-table"`);
      }
      
      return `<table${cleaned}>`;
    }
  );

  // 11. Add data-label attributes to table cells for mobile display
  // This helps with responsive table display on mobile
  // Process each table separately
  processed = processed.replace(
    /<table([^>]*?)>([\s\S]*?)<\/table>/gi,
    (tableMatch: string, tableAttrs: string, tableContent: string) => {
      // Extract header cells from thead within this table
      const theadMatch = tableContent.match(/<thead>([\s\S]*?)<\/thead>/i);
      if (theadMatch) {
        const headerCells = theadMatch[1].match(/<th[^>]*>([\s\S]*?)<\/th>/gi);
        if (headerCells && headerCells.length > 0) {
          const headers = headerCells.map((th: string) => {
            const textMatch = th.match(/<th[^>]*>([\s\S]*?)<\/th>/i);
            return textMatch ? textMatch[1].replace(/<[^>]+>/g, '').trim() : '';
          });
          
          // Process tbody rows to add data-label attributes
          const processedTableContent = tableContent.replace(
            /<tr([^>]*?)>([\s\S]*?)<\/tr>/gi,
            (trMatch: string, trAttrs: string, trContent: string) => {
              // Only process rows with td cells (not th cells)
              if (trContent.includes('<td')) {
                let updatedContent = trContent;
                const tdMatches = trContent.match(/<td([^>]*?)>([\s\S]*?)<\/td>/gi);
                if (tdMatches) {
                  tdMatches.forEach((td: string, index: number) => {
                    if (headers[index] && !td.includes('data-label')) {
                      const newTd = td.replace(/<td([^>]*?)>/, 
                        `<td$1 data-label="${headers[index]}">`);
                      updatedContent = updatedContent.replace(td, newTd);
                    }
                  });
                }
                return `<tr${trAttrs}>${updatedContent}</tr>`;
              }
              return trMatch;
            }
          );
          return `<table${tableAttrs}>${processedTableContent}</table>`;
        }
      }
      return tableMatch;
    }
  );

  return processed;
}

/**
 * Extract all images from HTML content
 */
export function extractImagesFromContent(html: string): Array<{
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}> {
  if (!html) return [];

  const images: Array<{ src: string; alt?: string; width?: number; height?: number }> = [];
  const imgRegex = /<img([^>]*?)>/gi;
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const imgTag = match[1];
    const srcMatch = imgTag.match(/src\s*=\s*["']([^"']+)["']/i);
    const altMatch = imgTag.match(/alt\s*=\s*["']([^"']*)["']/i);
    const widthMatch = imgTag.match(/width\s*=\s*["']?(\d+)["']?/i);
    const heightMatch = imgTag.match(/height\s*=\s*["']?(\d+)["']?/i);

    if (srcMatch) {
      images.push({
        src: srcMatch[1],
        alt: altMatch ? altMatch[1] : undefined,
        width: widthMatch ? parseInt(widthMatch[1], 10) : undefined,
        height: heightMatch ? parseInt(heightMatch[1], 10) : undefined,
      });
    }
  }

  return images;
}

/**
 * Extract text content from HTML (for SEO purposes)
 */
export function extractTextContent(html: string): string {
  if (!html) return '';

  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities (basic ones)
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Generate enhanced image schema for blog post images with full ImageObject properties
 */
export function generateImageSchema(images: Array<{ src: string; alt?: string; width?: number; height?: number }>): Array<{
  '@type': 'ImageObject';
  url: string;
  contentUrl: string;
  width?: number;
  height?: number;
  encodingFormat?: string;
  caption?: string;
  name?: string;
  description?: string;
}> {
  return images.map(img => {
    // Detect image format from URL
    const encodingFormat = img.src.match(/\.(jpg|jpeg)$/i) ? 'image/jpeg' : 
                          img.src.match(/\.png$/i) ? 'image/png' :
                          img.src.match(/\.webp$/i) ? 'image/webp' :
                          img.src.match(/\.gif$/i) ? 'image/gif' :
                          img.src.match(/\.svg$/i) ? 'image/svg+xml' : 'image/jpeg';
    
    return {
    '@type': 'ImageObject' as const,
    url: img.src,
      contentUrl: img.src, // Required for ImageObject
      ...(img.width && { width: img.width }),
      ...(img.height && { height: img.height }),
      encodingFormat,
      ...(img.alt && { caption: img.alt, name: img.alt }),
      ...(img.alt && { description: img.alt }),
    };
  });
}

