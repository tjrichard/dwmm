import {defineField, defineType} from 'sanity'

export const reactComponentObject = defineType({
  name: 'reactComponent',
  title: 'React Component',
  type: 'object',
  fields: [
    defineField({
      name: 'componentName',
      title: 'Component Name',
      type: 'string',
      description: '프런트엔드에서 매핑될 컴포넌트 키',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'props',
      title: 'Props',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: false,
      },
      fields: [
        defineField({
          name: 'data',
          title: 'Data',
          type: 'text',
          description: 'JSON 문자열 또는 간단한 텍스트',
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'componentName'},
    prepare({title}) {
      return {title: title || 'React Component'}
    },
  },
})


