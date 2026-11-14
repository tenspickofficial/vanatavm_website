import { defineType, defineField } from 'sanity'

export const leadType = defineType({
  name: 'lead',
  title: 'Lead Submission',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'phone',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'email',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'project',
      type: 'string',
      title: 'Project of Interest',
    }),
    defineField({
      name: 'preferredDate',
      type: 'string',
      title: 'Preferred Visit Date',
    }),
    defineField({
      name: 'message',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'source',
      type: 'string',
      title: 'Form Source',
      description: 'Which form/page this lead came from',
      options: {
        list: [
          { title: 'Contact Page', value: 'contact' },
          { title: 'Book a Visit', value: 'book-a-visit' },
          { title: 'Brochure Download', value: 'brochure' },
        ],
      },
    }),
    defineField({
      name: 'submittedAt',
      type: 'datetime',
      title: 'Submitted At',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  orderings: [
    {
      title: 'Newest First',
      name: 'submittedAtDesc',
      by: [{ field: 'submittedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'project',
      description: 'phone',
    },
  },
})
