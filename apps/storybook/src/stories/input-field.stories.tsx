import { InputField, type InputFieldProps, inputFieldVariants } from '@devwebdex/ui'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Componentes/Campos/InputField',
  component: InputField,
  args: {
    placeholder: '0x...',
    status: 'default',
    disabled: false,
  },
  // O docgen não extrai tipo de VariantProps, que é um mapped type: sem declarar
  // `table.type` à mão, a coluna de tipo do painel de controles fica vazia.
  argTypes: {
    status: {
      control: { type: 'inline-radio' },
      options: ['default', 'error', 'success'],
      description: 'Cor da borda e do anel de foco. `error` liga o aria-invalid.',
      table: {
        type: { summary: "'default' | 'error' | 'success'" },
        defaultValue: { summary: 'default' },
      },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Atributo nativo do input. Tira o fundo e apaga o texto.',
      table: { type: { summary: 'boolean' } },
    },
    placeholder: {
      control: { type: 'text' },
      table: { type: { summary: 'string' } },
    },
  },
  parameters: {
    docs: {
      description: {
        component: [
          'O `<input>` sozinho, sem rótulo nem mensagem. Para o campo completo — rótulo,',
          'helper text e contador — use o `TextField`, que monta este mesmo componente',
          'dentro dele e compartilha o eixo `status`.',
          '',
          'Use o InputField direto quando o rótulo já existe fora do campo: dentro de uma',
          'célula de tabela, ao lado de um Button numa linha de busca, ou num formulário',
          'com rótulo próprio. **Campo sem rótulo visível precisa de `aria-label`** — é por',
          'isso que todas as stories abaixo passam um.',
          '',
          'Só `status` é prop. Hover, focus e disabled **não são**: são `hover:`,',
          '`focus-visible:` e `disabled:`. Passe o mouse e clique no campo para vê-los.',
          '',
          'A referência visual é o `.inp` de `docs/ui/webdex-design-system.html`. Hover,',
          'success e disabled não existem lá e foram derivados dele.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof InputField>

export default meta
type Story = StoryObj<typeof meta>

const STATUSES = ['default', 'error', 'success'] as const

const VALUES = {
  default: '0x3fA9c4B1e7D2a8F05C6b9E3d1A7f4C2b8D0e5c21',
  error: '0x3fA9//prod',
  success: '0x3fA9c4B1e7D2a8F05C6b9E3d1A7f4C2b8D0e5c21',
} as const

/** Largura de um formulário estreito, para o campo não esticar até a borda do canvas. */
const narrow: Decorator[] = [
  (Story) => (
    <div className="w-[320px]">
      <Story />
    </div>
  ),
]

/** Use os controles ao lado para trocar status e placeholder. */
export const Playground: Story = {
  decorators: narrow,
  args: { 'aria-label': 'Endereço da carteira' },
}

/** Os três status, com valor preenchido. */
export const Status: Story = {
  decorators: narrow,
  render: (args) => (
    <div className="flex flex-col gap-4">
      {STATUSES.map((status) => (
        <InputField
          key={status}
          {...args}
          status={status}
          defaultValue={VALUES[status]}
          aria-label={`Endereço da carteira (${status})`}
        />
      ))}
    </div>
  ),
}

/**
 * Vazio, preenchido e desabilitado.
 *
 * O campo usa `font-mono`: endereço e hash são o conteúdo típico aqui, e em fonte
 * proporcional eles ficam difíceis de conferir caractere a caractere.
 */
export const Conteudo: Story = {
  name: 'Conteúdo',
  decorators: narrow,
  render: (args) => (
    <div className="flex flex-col gap-4">
      <InputField {...args} aria-label="Vazio" />
      <InputField {...args} defaultValue={VALUES.default} aria-label="Preenchido" />
      <InputField {...args} disabled defaultValue={VALUES.default} aria-label="Desabilitado" />
    </div>
  ),
}

// --------------------------------------------------------------------------
// Matriz de estados

/**
 * Hover e focus são pseudo-classes: o navegador só as aplica na interação.
 *
 * Esta função tira o prefixo das classes que o próprio cva gera
 * (`hover:border-white/22` vira `border-white/22`) e devolve só elas. O InputField
 * passa o className depois do cva no cn, e o tailwind-merge resolve o conflito
 * mantendo a última.
 *
 * Os valores continuam saindo do componente real: nada aqui é redigitado.
 */
function forcedState(status: (typeof STATUSES)[number], state: 'hover' | 'focus-visible') {
  const prefix = `${state}:`
  return inputFieldVariants({ status })
    .split(/\s+/)
    .filter((utility) => utility.startsWith(prefix))
    .map((utility) => utility.slice(prefix.length))
    .join(' ')
}

const STATE_COLUMNS = ['Enabled', 'Hovered', 'Focused', 'Disabled'] as const

const th = 'px-3 py-2 font-mono font-medium text-[11px] text-text-secondary tracking-wide'

function Matrix(props: InputFieldProps) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0 text-text-primary">
        <thead>
          <tr>
            <th className={`${th} border-line-default border-b text-left`}>status</th>
            {STATE_COLUMNS.map((state) => (
              <th key={state} className={`${th} border-line-default border-b`}>
                {state}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STATUSES.map((status) => (
            <tr key={status}>
              <th className={`${th} text-left align-middle text-brand`}>{status}</th>
              {STATE_COLUMNS.map((state) => (
                <td key={state} className="w-[260px] px-3 py-3">
                  <InputField
                    {...props}
                    status={status}
                    defaultValue={VALUES[status]}
                    disabled={state === 'Disabled'}
                    aria-label={`${status} ${state}`}
                    className={
                      state === 'Hovered'
                        ? forcedState(status, 'hover')
                        : state === 'Focused'
                          ? forcedState(status, 'focus-visible')
                          : undefined
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Os três status nas linhas e os quatro estados nas colunas.
 *
 * Hovered e Focused aqui são forçados por classe, porque são pseudo-classes. Para ver
 * o comportamento real, use o Playground e interaja com o campo.
 */
export const Matriz: Story = {
  render: (args) => <Matrix {...args} />,
  parameters: { layout: 'fullscreen' },
}
