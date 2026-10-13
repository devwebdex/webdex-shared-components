import tseslint from 'typescript-eslint'

/**
 * Usar no eslint.config.js de cada app de backend:
 *
 *   import { backend } from '@devwebdex/eslint-config'
 *   export default backend(import.meta.dirname)
 */
export function backend(tsconfigRootDir) {
  return [
    {
      files: ['**/*.ts', '**/*.mts', '**/*.cts'],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      plugins: {
        '@typescript-eslint': tseslint.plugin,
      },
      rules: {
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
      },
    },
  ]
}
