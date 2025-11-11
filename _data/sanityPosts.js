const path = require('path');
const { createClient } = require('@sanity/client');
const { toHTML } = require('@portabletext/to-html');
const { generateOgImage } = require('../lib/og/generateOgImage');

require('dotenv').config();

// Return empty array if Sanity is not configured
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_DATASET) {
  module.exports = async function() {
    console.log('Sanity not configured - returning empty posts array');
    return [];
  };
  return;
}

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: process.env.NODE_ENV === 'production',
  apiVersion: '2025-01-13'
});

// Helper to parse optional directives from caption, e.g. "Caption text [size:small,float:left]"
function parseImageDirectives(caption) {
  if (!caption) return { caption: '', size: undefined, float: undefined };
  const match = caption.match(/\[([^\]]+)\]\s*$/);
  if (!match) return { caption, size: undefined, float: undefined };
  
  const directives = {};
  match[1].split(',').forEach(part => {
    const [key, val] = part.split(':').map(s => s.trim());
    if (['size', 'float'].includes(key) && val) {
      directives[key] = val;
    }
  });
  
  const cleanCaption = caption.replace(/\s*\[[^\]]+\]\s*$/, '').trim();
  return { caption: cleanCaption, size: directives.size, float: directives.float };
}

// Mapping for size and float styles
const sizeStyleMap = {
  small: 'max-width: 320px',
  medium: 'max-width: 448px', 
  large: 'max-width: 672px',
  full: 'width: 100%'
};

const floatStyleMap = {
  none: '',
  left: 'float: left; margin-right: 1rem; margin-bottom: 1rem;',
  right: 'float: right; margin-left: 1rem; margin-bottom: 1rem;'
};

// Portable Text to HTML configuration
const portableTextComponents = {
  types: {
    image: ({value}) => {
      if (!value?.asset?._ref) {
        return '';
      }
      const [, id, dimensions, format] = value.asset._ref.split('-');
      const [width, height] = dimensions.split('x').map(Number);
      const imageUrl = `https://cdn.sanity.io/images/${process.env.SANITY_PROJECT_ID}/${process.env.SANITY_DATASET}/${id}-${dimensions}.${format}`;
      
      const alt = value.alt || '';
      const { caption: cleanCaption, size: parsedSize, float: parsedFloat } = parseImageDirectives(value.caption);
      
      // Prefer explicit fields from Sanity, fall back to parsed directives
      const size = value.size || parsedSize || 'medium';
      const float = value.float || parsedFloat || 'none';
      
      const sizeStyle = sizeStyleMap[size] || sizeStyleMap.medium;
      const floatStyle = floatStyleMap[float] || '';
      const figureStyle = [sizeStyle, floatStyle, 'margin: 1.5rem 0'].filter(Boolean).join('; ');
      
      return `
        <figure style="${figureStyle}">
          <img src="${imageUrl}" alt="${alt}" width="${width}" height="${height}" loading="lazy" />
          ${cleanCaption ? `<figcaption style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">${cleanCaption}</figcaption>` : ''}
        </figure>
      `;
    },
    gallery: ({value}) => {
      if (!value?.images?.length) return '';
      
      const galleryImages = value.images.map(image => {
        const [, id, dimensions, format] = image.asset._ref.split('-');
        const imageUrl = `https://cdn.sanity.io/images/${process.env.SANITY_PROJECT_ID}/${process.env.SANITY_DATASET}/${id}-${dimensions}.${format}`;
        const alt = image.alt || '';
        const caption = image.caption || '';
        return `
          <figure class="gallery-item">
            <img src="${imageUrl}" alt="${alt}" loading="lazy" />
            ${caption ? `<figcaption>${caption}</figcaption>` : ''}
          </figure>
        `;
      }).join('');
      
      return `<div class="gallery grid grid-cols-2 md:grid-cols-3 gap-4 my-8">${galleryImages}</div>`;
    }
  },
  marks: {
    link: ({children, value}) => {
      return `<a href="${value.href}" target="_blank" rel="noopener noreferrer">${children}</a>`;
    }
  }
};

module.exports = async function() {
  try {
    const posts = await client.fetch(`
      *[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc) {
        _id,
        title,
        slug,
        publishedAt,
        excerpt,
        body,
        mainImage,
        categories[]->{title},
        author->{name, slug, image},
        seo
      }
    `);

    // Transform posts for Eleventy
    const transformed = await Promise.all(posts.map(async post => {
      // Convert portable text to HTML
      const bodyHtml = post.body ? toHTML(post.body, {components: portableTextComponents}) : '';
      
      // Generate main image URL
      let mainImageUrl = null;
      if (post.mainImage?.asset?._ref) {
        const [, id, dimensions, format] = post.mainImage.asset._ref.split('-');
        mainImageUrl = `https://cdn.sanity.io/images/${process.env.SANITY_PROJECT_ID}/${process.env.SANITY_DATASET}/${id}-${dimensions}.${format}`;
      }

      // Generate OpenGraph image URL
      let ogImageUrl = mainImageUrl;
      if (post.seo?.openGraphImage?.asset?._ref) {
        const [, id, dimensions, format] = post.seo.openGraphImage.asset._ref.split('-');
        ogImageUrl = `https://cdn.sanity.io/images/${process.env.SANITY_PROJECT_ID}/${process.env.SANITY_DATASET}/${id}-${dimensions}.${format}`;
      } else {
        const generatedImage = await generateOgImage({
          slug: post.slug?.current,
          title: post.title,
          description: post.excerpt,
        });

        if (generatedImage) {
          const relative = path.relative(process.cwd(), generatedImage).split(path.sep).join('/');
          ogImageUrl = `/${relative}`;
        }
      }

      if (!ogImageUrl) {
        ogImageUrl = '/img/og/opengraph-default.png';
      }

      return {
        id: post._id,
        title: post.title,
        slug: post.slug.current,
        url: `/posts/${post.slug.current}/`,
        date: new Date(post.publishedAt),
        description: post.excerpt,
        content: bodyHtml,
        tags: post.categories?.map(cat => cat.title.toLowerCase().replace(/\s+/g, '-')) || [],
        author: post.author,
        image: mainImageUrl,
        seo: {
          title: post.seo?.metaTitle || post.title,
          description: post.seo?.metaDescription || post.excerpt,
          ogImage: ogImageUrl
        }
      };
    }));

    return transformed;
  } catch (error) {
    console.error('Error fetching Sanity posts:', error);
    return [];
  }
};
