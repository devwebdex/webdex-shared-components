import { backend } from '@devwebdex/eslint-config'

export default [{ ignores: ['dist', 'src/generated'] }, ...backend(import.meta.dirname)]
