#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');
const matter = require('gray-matter');

require('dotenv').config();

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN, // You need write permissions
  apiVersion: '2025-01-13'
});

async function createAuthor() {
  // Create default author if none exists
  const existingAuthor = await client.fetch(`*[_type == "author"][0]`);
  if (existingAuthor) return existingAuthor;

  const author = await client.create({
    _type: 'author',
    name: 'Marcel Fahle',
    slug: {
      _type: 'slug',
      current: 'marcel-fahle'
    },
    bio: [
      {
        _key: 'bio1',
        _type: 'block',
        children: [
          {
            _key: 'bio1-text',
            _type: 'span',
            marks: [],
            text: 'Developer, entrepreneur, and writer focused on building meaningful digital experiences.'
          }
        ],
        markDefs: [],
        style: 'normal'
      }
    ]
  });

  console.log('Created author:', author.name);
  return author;
}

async function createCategory(title) {
  const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  // Check if category exists
  const existingCategory = await client.fetch(`*[_type == "category" && title == $title][0]`, { title });
  if (existingCategory) return existingCategory;

  const category = await client.create({
    _type: 'category',
    title: title,
    description: `Posts about ${title}`
  });

  console.log('Created category:', category.title);
  return category;
}

function markdownToPortableText(markdown) {
  // Simple conversion - for complex content, consider using a proper converter
  const paragraphs = markdown.split('\n\n').filter(p => p.trim());
  
  return paragraphs.map((paragraph, index) => {
    const trimmed = paragraph.trim();
    
    // Headers
    if (trimmed.startsWith('# ')) {
      return {
        _key: `block-${index}`,
        _type: 'block',
        style: 'h1',
        children: [{ _type: 'span', text: trimmed.slice(2) }]
      };
    }
    if (trimmed.startsWith('## ')) {
      return {
        _key: `block-${index}`,
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: trimmed.slice(3) }]
      };
    }
    if (trimmed.startsWith('### ')) {
      return {
        _key: `block-${index}`,
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: trimmed.slice(4) }]
      };
    }
    
    // Regular paragraphs
    return {
      _key: `block-${index}`,
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: trimmed }]
    };
  });
}

async function migratePosts() {
  const postsDir = path.join(__dirname, 'posts');
  const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));

  const author = await createAuthor();

  console.log(`Found ${files.length} markdown posts to migrate...`);

  for (const file of files) {
    try {
      const filePath = path.join(postsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data: frontmatter, content: markdown } = matter(content);

      // Skip if it's the posts.11tydata.js file
      if (file === 'posts.11tydata.js') continue;

      console.log(`\nMigrating: ${frontmatter.title || file}`);

      // Create categories
      const categories = [];
      if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
        for (const tag of frontmatter.tags) {
          if (tag !== 'posts') { // Skip the posts tag
            const category = await createCategory(tag);
            categories.push({ _type: 'reference', _ref: category._id });
          }
        }
      }

      // Generate slug from filename or title
      const slug = frontmatter.slug || 
                   path.basename(file, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '');

      // Convert markdown to portable text
      const portableText = markdownToPortableText(markdown);

      // Create the post document
      const post = {
        _type: 'post',
        title: frontmatter.title || 'Untitled',
        slug: {
          _type: 'slug',
          current: slug
        },
        author: {
          _type: 'reference',
          _ref: author._id
        },
        publishedAt: frontmatter.date ? new Date(frontmatter.date).toISOString() : new Date().toISOString(),
        excerpt: frontmatter.description || '',
        body: portableText,
        categories: categories,
        seo: {
          metaTitle: frontmatter.title,
          metaDescription: frontmatter.description || ''
        }
      };

      const result = await client.create(post);
      console.log(`✓ Migrated: ${result.title} (ID: ${result._id})`);

    } catch (error) {
      console.error(`Error migrating ${file}:`, error.message);
    }
  }

  console.log('\nMigration complete!');
}

// Check if required environment variables are set
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_API_TOKEN) {
  console.error('Please set SANITY_PROJECT_ID and SANITY_API_TOKEN in your .env file');
  process.exit(1);
}

migratePosts().catch(console.error);
