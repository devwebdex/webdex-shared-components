import { backend } from '@devwebdex/eslint-config'

export default [
  { ignores: ['build', 'tmp', 'database/schema.ts'] },
  ...backend(import.meta.dirname),
]
