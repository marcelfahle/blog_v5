export default {
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: {type: 'author'}
    },
    {
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
        }
      ]
    },
    {
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{type: 'reference', to: {type: 'category'}}]
    },
    {
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    },

    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      description: 'Short description for SEO and social media',
      rows: 3
    },
    {
      name: 'body',
      title: 'Body',
      type: 'blockContent'
    },
    {
      name: 'seo',
      title: 'SEO',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: true
      },
      fields: [
        {
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
          description: 'Custom meta title (leave empty to use post title)'
        },
        {
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          description: 'Custom meta description (leave empty to use excerpt)',
          rows: 2
        },
        {
          name: 'openGraphImage',
          title: 'Open Graph Image',
          type: 'image',
          description: 'Custom image for social media (leave empty to use main image)'
        }
      ]
    }
  ],
  
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
      publishedAt: 'publishedAt'
    },
    prepare(selection) {
      const {author, title, publishedAt} = selection
      const date = publishedAt ? new Date(publishedAt).toLocaleDateString() : ''
      return {
        title: title,
        subtitle: author && `by ${author} • ${date}`
      }
    }
  }
}
