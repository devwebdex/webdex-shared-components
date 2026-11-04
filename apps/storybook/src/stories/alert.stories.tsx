import { Alert, type AlertProps } from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'

const VARIANTS = ['info', 'warning', 'error', 'success'] as const

/**
 * Uma mensagem por variante, no tom do produto. Sucesso e erro são os exemplos do próprio
 * design system; info e warning seguem o uso que a paleta dá a cada cor (IA e rede de teste).
 */
const EXAMPLES: Record<(typeof VARIANTS)[number], Pick<AlertProps, 'title' | 'children'>> = {
  info: {
    title: 'Sugestão da IA.',
    children: 'Um mapping no lugar do laço deixa este contrato mais barato em gas.',
  },
  warning: {
    title: 'Rede de teste.',
    children: 'Você está na Amoy: nenhuma transação aqui usa fundos reais.',
  },
  error: {
    title: 'Compilação falhou.',
    children: (
      <>
        Linha 42: função <code className="font-mono">withdraw()</code> sem guarda de reentrância.
        Adicione o modificador e recompile.
      </>
    ),
  },
  success: {
    title: 'Contrato publicado.',
    children: 'WebdexVault está no ar em 0x3fA9…c21B. Verifique no explorador.',
  },
}

const meta = {
  title: 'Componentes/Alert',
  component: Alert,
  args: {
    variant: 'success',
    ...EXAMPLES.success,
  },
  // O docgen não extrai tipo de VariantProps, que é um mapped type: sem declarar
  // `table.type` à mão, a coluna de tipo do painel de controles fica vazia.
  argTypes: {
    variant: {
      control: { type: 'inline-radio' },
      options: ['info', 'warning', 'error', 'success'],
      description: 'Cor e símbolo. error usa os tokens danger.',
      table: {
        type: { summary: "'info' | 'warning' | 'error' | 'success'" },
        defaultValue: { summary: 'info' },
      },
    },
    title: {
      control: { type: 'text' },
      description: 'Título em negrito, na mesma linha do texto.',
      table: { type: { summary: 'ReactNode' } },
    },
    children: {
      control: { type: 'text' },
      description: 'Texto do alerta.',
      table: { type: { summary: 'ReactNode' } },
    },
    icon: {
      control: false,
      description: 'Troca o símbolo da variante (✓, ✕, i, !). null esconde.',
      table: { type: { summary: 'ReactNode' } },
    },
    role: {
      control: false,
      description: 'Padrão: alert em error e warning, status em info e success.',
      table: { type: { summary: 'AriaRole' } },
    },
  },
  // O Alert ocupa a largura de quem o contém; a moldura dá uma largura de leitura.
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: [
          'Mensagem de retorno de uma ação: o que aconteceu e, quando der, o que fazer.',
          '',
          'Segue o bloco **Alertas** do Kit de interface (`docs/ui/webdex-design-system.html`),',
          'que desenha sucesso e erro. Info e warning usam o mesmo desenho com a cor semântica',
          'de cada um.',
          '',
          'O `role` muda com a variante: `alert` em error e warning, que interrompem o leitor de',
          'tela, e `status` em info e success, que esperam a fala atual terminar.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

/** Use os controles ao lado para trocar a variante e o texto. */
export const Playground: Story = {}

/** As quatro variantes, com mensagens do produto. */
export const Variantes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {VARIANTS.map((variant) => (
        <Alert key={variant} {...args} variant={variant} {...EXAMPLES[variant]} />
      ))}
    </div>
  ),
}

/**
 * O que muda com o conteúdo: só título, só texto, texto que quebra linha (o símbolo fica
 * na primeira), hash sem espaço (quebra em vez de vazar da caixa) e alerta sem símbolo.
 */
export const Conteudo: Story = {
  name: 'Conteúdo',
  render: () => (
    <div className="flex flex-col gap-3">
      <Alert variant="success" title="Carteira conectada." />
      <Alert variant="info">A cotação do POL é atualizada a cada 30 segundos.</Alert>
      <Alert variant="error" title="Saldo insuficiente para o gas.">
        A carteira 0x8a1F…44Ce tem 0,002 POL, e esta transação precisa de cerca de 0,01 POL.
        Adicione saldo ou tente de novo quando a rede estiver menos congestionada.
      </Alert>
      <Alert variant="info" title="Transação enviada.">
        Hash 0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060
      </Alert>
      <Alert variant="warning" title="Gas alto." icon={null}>
        A rede está congestionada, e esta transação pode custar mais que o normal.
      </Alert>
    </div>
  ),
}
