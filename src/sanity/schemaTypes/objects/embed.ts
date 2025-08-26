import {defineField, defineType} from 'sanity'

export const embedObject = defineType({
  name: 'embed',
  title: 'Embed',
  type: 'object',
  fields: [
    defineField({
      name: 'provider',
      title: 'Provider',
      type: 'string',
      options: {
        list: [
          {title: 'YouTube', value: 'youtube'},
          {title: 'Vimeo', value: 'vimeo'},
          {title: 'Figma', value: 'figma'},
          {title: 'CodePen', value: 'codepen'},
          {title: 'Other', value: 'other'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) => Rule.required().uri({allowRelative: false}),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Aspect Ratio',
      type: 'string',
      description: '예: 16:9, 4:3, 1:1',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'provider'},
    prepare({title, subtitle}) {
      return {title: title || 'Embed', subtitle}
    },
  },
})


