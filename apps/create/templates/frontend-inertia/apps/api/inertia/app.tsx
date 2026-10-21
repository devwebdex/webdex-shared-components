import './css/app.css'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
//#if web3=evm
import { Web3Provider } from '~/components/web3-provider'
//#endif

createInertiaApp({
  title: (title) => (title ? `${title} - {{name}}` : '{{name}}'),
  resolve: async (name) => {
    const page = await resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob<{ default: ResolvedComponent }>('./pages/**/*.tsx')
    )
    return page.default
  },
  setup({ el, App, props }) {
    //#if web3=evm
    // Providers fora do App do Inertia: a carteira continua conectada ao navegar entre páginas.
    createRoot(el).render(
      <Web3Provider>
        <App {...props} />
      </Web3Provider>
    )
    //#else
    createRoot(el).render(<App {...props} />)
    //#endif
  },
})
