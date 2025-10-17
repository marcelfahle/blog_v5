const { createClient } = require('@sanity/client');
const { toHTML } = require('@portabletext/to-html');

require('dotenv').config();

// Return empty array if Sanity is not configured
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_DATASET) {
  module.exports = async function() {
    console.log('Sanity not configured - returning empty pages array');
    return {};
  };
  return;
}

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: process.env.NODE_ENV === 'production',
  apiVersion: '2025-01-13'
});

// Portable Text to HTML configuration for pages
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
      const caption = value.caption || '';
      return `
        <figure class="my-8">
          <img src="${imageUrl}" alt="${alt}" width="${width}" height="${height}" loading="lazy" class="w-full rounded-lg" />
          ${caption ? `<figcaption class="text-sm text-gray-600 mt-2 text-center">${caption}</figcaption>` : ''}
        </figure>
      `;
    }
  },
  marks: {
    link: ({children, value}) => {
      const target = value.blank ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${value.href}"${target}>${children}</a>`;
    }
  }
};

module.exports = async function() {
  try {
    const pages = await client.fetch(`
      *[_type == "page" && !(_id in path("drafts.**"))] {
        _id,
        title,
        slug,
        pageType,
        description,
        content,
        lastUpdated,
        seo
      }
    `);

    // Transform pages into an object keyed by pageType for easy access
    const pagesData = {};
    
    pages.forEach(page => {
      // Convert portable text to HTML
      const contentHtml = page.content ? toHTML(page.content, {components: portableTextComponents}) : '';
      
      // Generate OpenGraph image URL
      let ogImageUrl = null;
      if (page.seo?.openGraphImage?.asset?._ref) {
        const [, id, dimensions, format] = page.seo.openGraphImage.asset._ref.split('-');
        ogImageUrl = `https://cdn.sanity.io/images/${process.env.SANITY_PROJECT_ID}/${process.env.SANITY_DATASET}/${id}-${dimensions}.${format}`;
      }
      
      pagesData[page.pageType] = {
        id: page._id,
        title: page.title,
        slug: page.slug.current,
        pageType: page.pageType,
        description: page.description,
        content: contentHtml,
        lastUpdated: new Date(page.lastUpdated),
        seo: {
          title: page.seo?.metaTitle || page.title,
          description: page.seo?.metaDescription || page.description,
          ogImage: ogImageUrl
        }
      };
    });
    
    return pagesData;
  } catch (error) {
    console.error('Error fetching Sanity pages:', error);
    return {};
  }
};
