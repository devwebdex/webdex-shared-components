import type { Preview } from '@storybook/react-vite'
import '../src/tailwind.css'

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Tema do design system',
      toolbar: {
        title: 'Tema',
        icon: 'contrast',
        items: [
          { value: 'dark', title: 'Escuro', icon: 'moon' },
          { value: 'light', title: 'Claro (provisório)', icon: 'sun' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'dark' },
  parameters: {
    // Sem isto a ordem da barra lateral sai da ordem dos arquivos no disco, e muda
    // sozinha quando alguém acrescenta um componente. Alfabética não precisa de lista
    // para manter: componente novo cai no lugar certo sem ninguém mexer aqui.
    //
    // A única ordem fixa é a das duas seções de cima: Fundação (tokens) antes de
    // Componentes, que é a ordem em que se lê um design system. Dentro delas, alfabética.
    options: { storySort: { method: 'alphabetical', order: ['Fundação', 'Componentes'] } },
    controls: { expanded: true },
    a11y: { test: 'todo' },
    docs: { toc: true },
  },
  // O enquadramento usa os próprios tokens, então ele quebra junto se um token quebrar.
  decorators: [
    (Story, context) => {
      document.documentElement.dataset.theme = context.globals.theme === 'light' ? 'light' : 'dark'
      return (
        <div className="bg-background text-text-primary font-sans flex min-h-32 items-center justify-center p-8">
          <Story />
        </div>
      )
    },
  ],
}

export default preview
