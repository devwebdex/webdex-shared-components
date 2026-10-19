import { Button, type ButtonProps } from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'

const Wallet = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M16 12h.01" />
  </svg>
)

const Check = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

const meta = {
  title: 'Componentes/Button',
  component: Button,
  args: {
    children: 'Conectar Carteira',
    iconLeft: <Wallet />,
    iconRight: <Check />,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['large', 'medium', 'small'] },
    color: { control: 'inline-radio', options: ['brand', 'code'] },
    variant: { control: 'inline-radio', options: ['contained', 'outlined', 'text'] },
    disabled: { control: 'boolean' },
    iconLeft: { control: false },
    iconRight: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: [
          'Os três eixos espelham as component properties do Figma: `Size`, `Color` e `Variant`.',
          '',
          'O quarto eixo do Figma, `State`, **não é prop**. Hovered, Pressed, Disabled e Focused',
          'existem lá porque a Figma não tem pseudo-classe; aqui são `hover:`, `active:`,',
          '`disabled:` e `focus-visible:`. Passe o mouse e segure o clique para vê-los.',
          '',
          'O anel de foco é provisório: no Figma, Focused é idêntico a Enabled nas 18 combinações.',
          'O anel definitivo é o SCRUM-141.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/** Use os controles ao lado para trocar tamanho, cor e variante. */
export const Playground: Story = {}

const SIZES = ['large', 'medium', 'small'] as const
const COLORS = ['brand', 'code'] as const
const VARIANTS = ['contained', 'outlined', 'text'] as const

function Grade({ children, ...props }: ButtonProps) {
  return (
    <div className="flex flex-col gap-8">
      {COLORS.map((color) => (
        <section key={color} className="flex flex-col gap-3">
          <h3 className="font-mono text-sm text-text-secondary">color = {color}</h3>
          <div className="flex flex-wrap items-center gap-4">
            {VARIANTS.map((variant) => (
              <Button key={variant} color={color} variant={variant} {...props}>
                {children}
              </Button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/** As seis combinações de cor e variante, no tamanho médio. */
export const Variantes: Story = {
  render: (args) => <Grade {...args} />,
}

/** Os três tamanhos, lado a lado. */
export const Tamanhos: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      {SIZES.map((size) => (
        <Button key={size} {...args} size={size} />
      ))}
    </div>
  ),
}

/** Desabilitado perde o gradiente e a sombra, e o texto cai para branco a 15%. */
export const Desabilitado: Story = {
  render: (args) => <Grade {...args} disabled />,
}

/** A matriz inteira: 3 tamanhos x 2 cores x 3 variantes. */
export const Matriz: Story = {
  render: (args) => (
    <div className="flex flex-col gap-10">
      {SIZES.map((size) => (
        <section key={size} className="flex flex-col gap-4">
          <h3 className="font-mono text-sm text-brand">size = {size}</h3>
          <Grade {...args} size={size} />
        </section>
      ))}
    </div>
  ),
}
