import {defineField, defineType} from 'sanity'

export const projectImage = defineType({
  name: 'projectImage',
  title: 'Project Image',
  type: 'object',

  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'alt',
      title: 'Alt Text',
      type: 'localizedString',
      validation: (rule) => rule.required(),
    }),
  ],

  preview: {
    select: {
      media: 'image',
      title: 'alt.pt',
    },
  },
})