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
            S.listItem().title('Atlas — Topografia').id('atlasSettings').child(S.document().schemaType('atlasSettings').documentId('atlas-settings')),
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
              (item) => !['aboutPage', 'atlasSettings'].includes(item.getId() ?? ''),
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
        (template) => !['aboutPage', 'atlasSettings'].includes(template.templateId),
      ),

    actions: (prev, context) =>
      ['aboutPage', 'atlasSettings'].includes(context.schemaType)
        ? prev.filter(
          ({ action }) =>
            action !== 'duplicate' && action !== 'delete',
        )
        : prev,
  },
})
