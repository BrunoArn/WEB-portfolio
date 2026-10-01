import {defineField, defineType} from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'localizedText',
    }),
  ],
})