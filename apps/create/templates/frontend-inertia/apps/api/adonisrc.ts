import { defineConfig } from '@adonisjs/core/app'
import { indexPages } from '@adonisjs/inertia'

export default defineConfig({
  experimental: {},

  commands: [
    () => import('@adonisjs/core/commands'),
    () => import('@adonisjs/lucid/commands'),
    () => import('@adonisjs/inertia/commands'),
  ],

  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    {
      file: () => import('@adonisjs/core/providers/repl_provider'),
      environment: ['repl', 'test'],
    },
    () => import('@adonisjs/core/providers/vinejs_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    () => import('@adonisjs/core/providers/edge_provider'),
    () => import('@adonisjs/vite/vite_provider'),
    () => import('@adonisjs/static/static_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/cors/cors_provider'),
    () => import('@adonisjs/inertia/inertia_provider'),
    //#if web3=evm
    () => import('#providers/web3_provider'),
    //#endif
  ],

  preloads: [() => import('#start/routes'), () => import('#start/kernel')],

  tests: {
    suites: [
      {
        files: ['tests/unit/**/*.spec.{ts,js}'],
        name: 'unit',
        timeout: 2000,
      },
      {
        files: ['tests/functional/**/*.spec.{ts,js}'],
        name: 'functional',
        timeout: 30000,
      },
    ],
    forceExit: false,
  },

  metaFiles: [
    { pattern: 'resources/views/**/*.edge', reloadServer: false },
    { pattern: 'public/**', reloadServer: false },
  ],

  hooks: {
    // Gera o registro tipado das páginas de inertia/pages (usado por renderInertia).
    init: [indexPages({ framework: 'react' })],
    buildStarting: [() => import('@adonisjs/vite/build_hook')],
  },
})
