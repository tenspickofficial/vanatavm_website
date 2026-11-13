import { type SchemaTypeDefinition } from 'sanity'
import { postType } from './documents/post'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [postType],
}

