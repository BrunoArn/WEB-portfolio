import { defineField, defineType } from 'sanity'

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
    defineField({
      name: 'width',
      title: 'Native Width',
      type: 'number',
      description: 'Native canvas width used to preserve the playable aspect ratio.',
      validation: (rule) => rule.required().integer().positive(),
    }),

    defineField({
      name: 'height',
      title: 'Native Height',
      type: 'number',
      description: 'Native canvas height used to preserve the playable aspect ratio.',
      validation: (rule) => rule.required().integer().positive(),
    }),
  ],
})