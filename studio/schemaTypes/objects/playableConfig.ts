import {defineField, defineType} from 'sanity'

export const playableConfig = defineType({
  name: 'playableConfig',
  title: 'Playable Configuration',
  type: 'object',

  fields: [
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {
            title: 'Unity WebGL',
            value: 'unity-webgl',
          },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      description: 'Path or URL used by the frontend to load the playable build.',
      validation: (rule) => rule.required(),
    }),
  ],
})