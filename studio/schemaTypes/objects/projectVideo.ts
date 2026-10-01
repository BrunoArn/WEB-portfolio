import {defineField, defineType} from 'sanity'

export const projectVideo = defineType({
  name: 'projectVideo',
  title: 'Project Video',
  type: 'object',

  fields: [
    defineField({
      name: 'video',
      title: 'Video',
      type: 'file',
      options: {
        accept: 'video/*',
      },
      validation: (rule) => rule.required(),
    }),
  ],
})