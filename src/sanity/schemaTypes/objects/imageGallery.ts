import {defineField, defineType} from 'sanity'

export const imageGalleryObject = defineType({
  name: 'imageGallery',
  title: 'Image Gallery',
  type: 'object',
  fields: [
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
        },
      ],
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      media: 'images.0',
      title: 'caption',
    },
    prepare({media, title}) {
      return {media, title: title || 'Image Gallery'}
    },
  },
})


