import type { Preview } from '@storybook/react-vite'
import '../src/tailwind.css'

const preview: Preview = {
  parameters: {
    // Sem isto a ordem da barra lateral sai da ordem dos arquivos no disco, e muda
    // sozinha quando alguém acrescenta um componente. Alfabética não precisa de lista
    // para manter: componente novo cai no lugar certo sem ninguém mexer aqui.
    options: { storySort: { method: 'alphabetical' } },
    controls: { expanded: true },
    a11y: { test: 'todo' },
    docs: { toc: true },
  },
  // O design system é só escuro: as cores com alpha só se leem sobre o fundo da marca.
  // O enquadramento usa os próprios tokens, então ele quebra junto se um token quebrar.
  decorators: [
    (Story) => (
      <div className="bg-background text-text-primary font-sans flex min-h-32 items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
}

export default preview
