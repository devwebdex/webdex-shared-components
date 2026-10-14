import { backend } from '@devwebdex/eslint-config'

export default [{ ignores: ['build', 'tmp'] }, ...backend(import.meta.dirname)]
