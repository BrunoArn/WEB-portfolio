import { defineField, defineType } from 'sanity'

export const project = defineType({
    name: 'project',
    title: 'Project',
    type: 'document',

    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'localizedString',
            validation: (rule) => rule.required(),
        }),

        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title.en',
                maxLength: 96,
            },
            validation: (rule) => rule.required(),
        }),

        defineField({
            name: 'year',
            title: 'Year',
            type: 'number',
            validation: (rule) =>
                rule.required().integer().min(2000).max(2100),
        }),

        defineField({
            name: 'description',
            title: 'Description',
            type: 'localizedText',
            validation: (rule) => rule.required(),
        }),

        defineField({
            name: 'context',
            title: 'Context',
            type: 'localizedText',
        }),

        defineField({
            name: 'role',
            title: 'Role',
            type: 'localizedString',
            validation: (rule) => rule.required(),
        }),

        defineField({
            name: 'status',
            title: 'Status',
            type: 'string',
            options: {
                list: [
                    { title: 'Released', value: 'released' },
                    { title: 'Prototype', value: 'prototype' },
                    { title: 'Hackathon', value: 'hackathon' },
                    { title: 'Client', value: 'client' },
                    { title: 'Development', value: 'development' },
                    { title: 'Archived', value: 'archived' },
                ],
                layout: 'dropdown',
            },
            validation: (rule) => rule.required(),
        }),

        defineField({
            name: 'organization',
            title: 'Organization',
            type: 'localizedString',
        }),

        defineField({
            name: 'categories',
            title: 'Categories',
            type: 'array',
            of: [
                {
                    type: 'reference',
                    to: [{ type: 'category' }],
                },
            ],
            validation: (rule) => rule.min(1),
        }),

        defineField({
            name: 'technologies',
            title: 'Technologies',
            type: 'array',
            of: [{ type: 'string' }],
        }),

        defineField({
            name: 'team',
            title: 'Team',
            type: 'array',
            of: [{ type: 'teamMember' }],
        }),
    ],

    preview: {
        select: {
            title: 'title.en',
            subtitle: 'year',
        },

        prepare({ title, subtitle }) {
            return {
                title,
                subtitle: subtitle ? String(subtitle) : undefined,
            }
        },
    },
})