export default {
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Page Title',
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
      name: 'pageType',
      title: 'Page Type',
      type: 'string',
      options: {
        list: [
          {title: 'Homepage', value: 'homepage'},
          {title: 'Now Page', value: 'now'},
          {title: 'About Page', value: 'about'},
          {title: 'General Page', value: 'general'}
        ],
        layout: 'dropdown'
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'description',
      title: 'Meta Description',
      type: 'text',
      description: 'For SEO and social media',
      rows: 2
    },
    {
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Number', value: 'number'}
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Code', value: 'code'},
              {title: 'Underline', value: 'underline'},
              {title: 'Strike', value: 'strike-through'}
            ],
            annotations: [
              {
                title: 'URL',
                name: 'link',
                type: 'object',
                fields: [
                  {
                    title: 'URL',
                    name: 'href',
                    type: 'url',
                    validation: Rule => Rule.uri({
                      allowRelative: true,
                      scheme: ['http', 'https', 'mailto', 'tel']
                    })
                  },
                  {
                    title: 'Open in new tab',
                    name: 'blank',
                    type: 'boolean',
                    initialValue: false
                  }
                ]
              }
            ]
          }
        },
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            }
          ]
        }
      ]
    },
    {
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'datetime',
      description: 'When this page content was last modified',
      initialValue: () => new Date().toISOString()
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
          description: 'Custom meta title (leave empty to use page title)'
        },
        {
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          description: 'Custom meta description (leave empty to use description)',
          rows: 2
        },
        {
          name: 'openGraphImage',
          title: 'Open Graph Image',
          type: 'image',
          description: 'Custom image for social media sharing'
        }
      ]
    }
  ],
  
  preview: {
    select: {
      title: 'title',
      pageType: 'pageType',
      lastUpdated: 'lastUpdated'
    },
    prepare(selection) {
      const {title, pageType, lastUpdated} = selection
      const date = lastUpdated ? new Date(lastUpdated).toLocaleDateString() : ''
      return {
        title: title,
        subtitle: `${pageType} • Updated ${date}`
      }
    }
  }
}
