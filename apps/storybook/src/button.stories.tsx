import { Button, type ButtonProps, buttonVariants } from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Measurements } from './measurements.js'

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
  // O docgen não extrai tipo de VariantProps, que é um mapped type: sem declarar
  // `table.type` à mão, a coluna de tipo do painel de controles fica vazia.
  argTypes: {
    size: {
      control: { type: 'inline-radio' },
      options: ['large', 'medium', 'small'],
      description: 'Muda padding, raio, fonte, altura de linha e tamanho do ícone.',
      table: {
        type: { summary: "'large' | 'medium' | 'small'" },
        defaultValue: { summary: 'medium' },
      },
    },
    color: {
      control: { type: 'inline-radio' },
      options: ['brand', 'code'],
      description: 'brand é o gradiente da marca; code é a superfície translúcida.',
      table: {
        type: { summary: "'brand' | 'code'" },
        defaultValue: { summary: 'brand' },
      },
    },
    variant: {
      control: { type: 'inline-radio' },
      options: ['contained', 'outlined', 'text'],
      description: 'Preenchimento. A variante text usa metade do padding horizontal.',
      table: {
        type: { summary: "'contained' | 'outlined' | 'text'" },
        defaultValue: { summary: 'contained' },
      },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Atributo nativo do botão. Remove o gradiente e a sombra.',
      table: { type: { summary: 'boolean' } },
    },
    children: {
      control: { type: 'text' },
      description: 'Rótulo do botão.',
      table: { type: { summary: 'ReactNode' } },
    },
    iconLeft: {
      control: false,
      description: 'Ícone antes do rótulo.',
      table: { type: { summary: 'ReactNode' } },
    },
    iconRight: {
      control: false,
      description: 'Ícone depois do rótulo.',
      table: { type: { summary: 'ReactNode' } },
    },
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

const SIZES = ['large', 'medium', 'small'] as const
const COLORS = ['brand', 'code'] as const
const VARIANTS = ['contained', 'outlined', 'text'] as const

/** Use os controles ao lado para trocar tamanho, cor e variante. */
export const Playground: Story = {}

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
export const Variantes: Story = { render: (args) => <Grade {...args} /> }

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

// --------------------------------------------------------------------------
// Matriz no formato do Figma

type Axes = {
  size: (typeof SIZES)[number]
  color: (typeof COLORS)[number]
  variant: (typeof VARIANTS)[number]
}

/**
 * Hovered, Pressed e Focused são pseudo-classes: o navegador só as aplica na
 * interação, então não há como mostrar os quatro estados lado a lado de verdade.
 *
 * Esta função tira o prefixo das classes que o próprio cva gera (`hover:shadow-4`
 * vira `shadow-4`) e devolve só elas. O Button passa o className depois do
 * buttonVariants no cn, e o tailwind-merge resolve o conflito mantendo a última --
 * então `to-brand` cede lugar a `to-magenta-80`.
 *
 * Os valores continuam saindo do componente real: nada aqui é redigitado.
 */
function forcedState(axes: Axes, state: 'hover' | 'active' | 'focus-visible') {
  const prefix = `${state}:`
  return buttonVariants(axes)
    .split(/\s+/)
    .filter((utility) => utility.startsWith(prefix))
    .map((utility) => utility.slice(prefix.length))
    .join(' ')
}

const STATE_COLUMNS = [
  { key: 'enabled', label: 'Enabled' },
  { key: 'hovered', label: 'Hovered' },
  { key: 'pressed', label: 'Pressed' },
  { key: 'disabled', label: 'Disabled' },
] as const

function Cell({
  axes,
  state,
  edge,
  ...props
}: ButtonProps & { axes: Axes; state: string; edge?: boolean }) {
  const forced =
    state === 'hovered'
      ? forcedState(axes, 'hover')
      : state === 'pressed'
        ? forcedState(axes, 'active')
        : state === 'focus'
          ? forcedState(axes, 'focus-visible')
          : undefined

  return (
    <td className={`px-3 py-3 text-center ${edge ? 'border-l border-line-default' : ''}`}>
      <Button {...props} {...axes} disabled={state === 'disabled'} className={forced} />
    </td>
  )
}

const th = 'px-3 py-2 font-mono text-[11px] font-medium tracking-wide text-text-secondary'

function Matrix(props: ButtonProps) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0 text-text-primary">
        <thead>
          <tr>
            <th className={th} colSpan={2} />
            {SIZES.map((size) => (
              <th key={size} className={`${th} border-b border-line-default`} colSpan={4}>
                {size}
              </th>
            ))}
            <th className={`${th} border-b border-l border-line-default`} colSpan={3}>
              focus
            </th>
          </tr>
          <tr>
            <th className={th} colSpan={2} />
            {SIZES.flatMap((size) =>
              STATE_COLUMNS.map((state) => (
                <th key={`${size}-${state.key}`} className={th}>
                  {state.label}
                </th>
              ))
            )}
            {SIZES.map((size, index) => (
              <th
                key={size}
                className={`${th} ${index === 0 ? 'border-l border-line-default' : ''}`}
              >
                {size}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COLORS.flatMap((color) =>
            VARIANTS.map((variant, variantIndex) => (
              <tr key={`${color}-${variant}`}>
                {variantIndex === 0 && (
                  <th
                    className={`${th} border-t border-line-default align-middle text-brand`}
                    rowSpan={VARIANTS.length}
                  >
                    {color}
                  </th>
                )}
                <th
                  className={`${th} text-left ${variantIndex === 0 ? 'border-t border-line-default' : ''}`}
                >
                  {variant}
                </th>
                {SIZES.flatMap((size) =>
                  STATE_COLUMNS.map((state) => (
                    <Cell
                      key={`${size}-${state.key}`}
                      {...props}
                      axes={{ size, color, variant }}
                      state={state.key}
                    />
                  ))
                )}
                {SIZES.map((size, index) => (
                  <Cell
                    key={`focus-${size}`}
                    {...props}
                    axes={{ size, color, variant }}
                    state="focus"
                    edge={index === 0}
                  />
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

/**
 * As 90 variantes no mesmo formato do arquivo do Figma: Brand e Code nas linhas,
 * cada tamanho com seus quatro estados nas colunas, e o bloco de foco à direita.
 *
 * Hovered, Pressed e Focused aqui são forçados por classe, porque são pseudo-classes.
 * Para ver o comportamento real, use o Playground e interaja com o botão.
 */
export const Matriz: Story = {
  render: (args) => <Matrix {...args} />,
  parameters: { layout: 'fullscreen' },
}

/**
 * Mede o componente já renderizado e diz de qual token veio cada valor.
 *
 * Os números saem de getComputedStyle no botão real, não da leitura das classes:
 * é o que o navegador aplicou. O que aparece como "sem token" existe no componente
 * mas não corresponde a Variable nenhuma, e é a lista do que falta criar no Figma.
 */
export const Medidas: Story = { render: (args) => <Measurements {...args} /> }
