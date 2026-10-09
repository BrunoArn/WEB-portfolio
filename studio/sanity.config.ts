import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Personal Portfolio',

  projectId: 'm2kdbi07',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('About Page')
              .id('aboutPage')
              .child(
                S.document()
                  .schemaType('aboutPage')
                  .documentId('aboutPage'),
              ),

            S.divider(),

            ...S.documentTypeListItems().filter(
              (item) => item.getId() !== 'aboutPage',
            ),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    newDocumentOptions: (prev) =>
      prev.filter(
        (template) => template.templateId !== 'aboutPage',
      ),

    actions: (prev, context) =>
      context.schemaType === 'aboutPage'
        ? prev.filter(
          ({ action }) =>
            action !== 'duplicate' && action !== 'delete',
        )
        : prev,
  },
})
