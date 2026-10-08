import { defineField, defineType } from 'sanity'

export const aboutPage = defineType({
    name: 'aboutPage',
    title: 'About Page',
    type: 'document',

    fields: [
        defineField({
            name: 'name',
            title: 'Professional Name',
            type: 'string',
            validation: (rule) => rule.required(),
        }),

        defineField({
            name: 'headline',
            title: 'Professional Headline',
            type: 'localizedString',
            validation: (rule) => rule.required(),
        }),

        defineField({
            name: 'introduction',
            title: 'Introduction',
            type: 'localizedText',
            validation: (rule) => rule.required(),
        }),

        defineField({
            name: 'experience',
            title: 'Professional Experience',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'experienceEntry',
                    title: 'Experience',
                    fields: [
                        defineField({
                            name: 'role',
                            title: 'Role',
                            type: 'localizedString',
                            validation: (rule) => rule.required(),
                        }),
                        defineField({
                            name: 'organization',
                            title: 'Organization',
                            type: 'string',
                            validation: (rule) => rule.required(),
                        }),
                        defineField({
                            name: 'startYear',
                            title: 'Start Year',
                            type: 'number',
                            validation: (rule) =>
                                rule.required().integer().min(1950).max(2100),
                        }),
                        defineField({
                            name: 'endYear',
                            title: 'End Year',
                            type: 'number',
                            validation: (rule) =>
                                rule.integer().min(1950).max(2100),
                        }),
                        defineField({
                            name: 'isCurrent',
                            title: 'Current Position',
                            type: 'boolean',
                            initialValue: false,
                        }),
                        defineField({
                            name: 'description',
                            title: 'Description',
                            type: 'localizedText',
                            validation: (rule) => rule.required(),
                        }),
                    ],
                    preview: {
                        select: {
                            title: 'role.en',
                            subtitle: 'organization',
                        },
                    },
                },
            ],
        }),

        defineField({
            name: 'education',
            title: 'Education',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'educationEntry',
                    title: 'Education Entry',
                    fields: [
                        defineField({
                            name: 'degree',
                            title: 'Degree / Course',
                            type: 'localizedString',
                            validation: (rule) => rule.required(),
                        }),
                        defineField({
                            name: 'institution',
                            title: 'Institution',
                            type: 'string',
                            validation: (rule) => rule.required(),
                        }),
                        defineField({
                            name: 'startYear',
                            title: 'Start Year',
                            type: 'number',
                            validation: (rule) =>
                                rule.integer().min(1950).max(2100),
                        }),
                        defineField({
                            name: 'endYear',
                            title: 'End Year',
                            type: 'number',
                            validation: (rule) =>
                                rule.integer().min(1950).max(2100),
                        }),
                        defineField({
                            name: 'description',
                            title: 'Description',
                            type: 'localizedText',
                        }),
                    ],
                    preview: {
                        select: {
                            title: 'degree.en',
                            subtitle: 'institution',
                        },
                    },
                },
            ],
        }),

        defineField({
            name: 'skillGroups',
            title: 'Skill Groups',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'skillGroup',
                    title: 'Skill Group',
                    fields: [
                        defineField({
                            name: 'title',
                            title: 'Group Title',
                            type: 'localizedString',
                            validation: (rule) => rule.required(),
                        }),
                        defineField({
                            name: 'skills',
                            title: 'Skills',
                            type: 'array',
                            of: [{ type: 'string' }],
                            validation: (rule) => rule.required().min(1),
                        }),
                    ],
                    preview: {
                        select: {
                            title: 'title.en',
                        },
                    },
                },
            ],
        }),

        defineField({
            name: 'languages',
            title: 'Languages',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'languageEntry',
                    title: 'Language',
                    fields: [
                        defineField({
                            name: 'name',
                            title: 'Language',
                            type: 'localizedString',
                            validation: (rule) => rule.required(),
                        }),
                        defineField({
                            name: 'proficiency',
                            title: 'Proficiency',
                            type: 'localizedString',
                            validation: (rule) => rule.required(),
                        }),
                    ],
                    preview: {
                        select: {
                            title: 'name.en',
                            subtitle: 'proficiency.en',
                        },
                    },
                },
            ],
        }),


        defineField({
            name: 'achievements',
            title: 'Achievements & Highlights',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'achievementEntry',
                    title: 'Achievement',
                    fields: [
                        defineField({
                            name: 'title',
                            title: 'Title',
                            type: 'localizedString',
                            validation: (rule) => rule.required(),
                        }),
                        defineField({
                            name: 'year',
                            title: 'Year',
                            type: 'number',
                            validation: (rule) =>
                                rule.required().integer().min(1950).max(2100),
                        }),
                        defineField({
                            name: 'description',
                            title: 'Description',
                            type: 'localizedText',
                            validation: (rule) => rule.required(),
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
                                subtitle:
                                    typeof subtitle === 'number'
                                        ? String(subtitle)
                                        : undefined,
                            }
                        },
                    },
                },
            ],
        }),


        defineField({
            name: 'email',
            title: 'Contact Email',
            type: 'email',
            validation: (rule) => rule.required(),
        }),

        defineField({
            name: 'githubUrl',
            title: 'GitHub URL',
            type: 'url',
            validation: (rule) =>
                rule.uri({ scheme: ['https'] }),
        }),

        defineField({
            name: 'linkedinUrl',
            title: 'LinkedIn URL',
            type: 'url',
            validation: (rule) =>
                rule.uri({ scheme: ['https'] }),
        }),

        defineField({
            name: 'itchUrl',
            title: 'itch.io URL',
            type: 'url',
            validation: (rule) =>
                rule.uri({ scheme: ['https'] }),
        }),

        defineField({
            name: 'cvPt',
            title: 'CV — Português',
            type: 'file',
            options: {
                accept: '.pdf',
            },
        }),

        defineField({
            name: 'cvEn',
            title: 'CV — English',
            type: 'file',
            options: {
                accept: '.pdf',
            },
        }),
    ],

    preview: {
        select: {
            title: 'name',
            subtitle: 'headline.en',
        },
    },
})