# Sanity Image Sizing Guide

## How to Use

You can now control the size and positioning of images in your blog posts using two methods:

### Method 1: Caption Directives (Works Now)

Add directives to the end of your image caption in square brackets:

```
My beautiful portrait photo [size:small,float:left]
```

**Available sizes:**
- `small` - Good for portraits and mobile screenshots (max-width: 320px)
- `medium` - Default size (max-width: 448px)
- `large` - Wide images (max-width: 672px)
- `full` - Full width

**Available float options:**
- `none` - Default, centered
- `left` - Image floats left, text wraps around right
- `right` - Image floats right, text wraps around left

**Examples:**
- `[size:small,float:left]` - Small image on the left with text wrap
- `[size:medium,float:right]` - Medium image on the right with text wrap
- `[size:large]` - Large centered image (no float)

### Method 2: Sanity Schema Fields (Recommended for future)

Add these fields to your Sanity image type in the Portable Text schema:

```javascript
{
  type: 'image',
  options: { hotspot: true },
  fields: [
    { name: 'alt', type: 'string', title: 'Alt text' },
    { name: 'caption', type: 'string', title: 'Caption' },
    { 
      name: 'size', 
      type: 'string', 
      title: 'Display size',
      options: {
        list: [
          { title: 'Small (portraits/mobile)', value: 'small' },
          { title: 'Medium (default)', value: 'medium' },
          { title: 'Large (wide images)', value: 'large' },
          { title: 'Full width', value: 'full' },
        ],
        layout: 'radio'
      }
    },
    { 
      name: 'float', 
      type: 'string', 
      title: 'Float',
      options: {
        list: [
          { title: 'None (centered)', value: 'none' },
          { title: 'Left (text wraps right)', value: 'left' },
          { title: 'Right (text wraps left)', value: 'right' },
        ],
        layout: 'radio'
      }
    }
  ]
}
```

Once you add these fields to your Sanity Studio schema, you'll be able to select size and float options directly in the CMS interface, and they'll take priority over caption directives.

## Technical Details

- Images use Tailwind CSS classes for sizing
- Float classes include margins for proper text spacing
- Paragraphs automatically clear floats to prevent layout issues
- Caption directives are removed from the displayed caption text
