import { type SchemaTypeDefinition } from 'sanity'
import { postType } from './documents/post'
import { leadType } from './documents/lead'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [postType, leadType],
}

