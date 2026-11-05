import {VideoUploadInput} from '../../components/VideoUploadInput'
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
      components: {input: VideoUploadInput},
      options: {
        accept: 'video/*',
      },
      validation: (rule) => rule.required(),
    }),
  ],
})
