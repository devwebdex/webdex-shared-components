import { InputField, inputFieldVariants, TextField, type TextFieldProps } from '@devwebdex/ui'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Componentes/TextField',
  component: TextField,
  args: {
    label: 'Nome do workspace',
    placeholder: 'meu-workspace',
    helperText: 'Use apenas letras, números e hífen.',
    counter: true,
    maxLength: 32,
    status: 'default',
    disabled: false,
  },
  // O docgen não extrai tipo de VariantProps, que é um mapped type: sem declarar
  // `table.type` à mão, a coluna de tipo do painel de controles fica vazia.
  argTypes: {
    status: {
      control: { type: 'inline-radio' },
      options: ['default', 'error', 'success'],
      description: 'Cor da borda, do anel de foco e do helper text. `error` liga o aria-invalid.',
      table: {
        type: { summary: "'default' | 'error' | 'success'" },
        defaultValue: { summary: 'default' },
      },
    },
    label: {
      control: { type: 'text' },
      description: 'Rótulo acima do campo.',
      table: { type: { summary: 'ReactNode' } },
    },
    helperText: {
      control: { type: 'text' },
      description: 'Mensagem abaixo do campo, ligada ao input por aria-describedby.',
      table: { type: { summary: 'ReactNode' } },
    },
    counter: {
      control: { type: 'boolean' },
      description: 'Mostra o contador de caracteres. Com `maxLength`, exibe `atual/máximo`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    maxLength: {
      control: { type: 'number' },
      description: 'Atributo nativo do input. Também é o limite do contador.',
      table: { type: { summary: 'number' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Atributo nativo do input. Apaga rótulo, campo e mensagens.',
      table: { type: { summary: 'boolean' } },
    },
    placeholder: {
      control: { type: 'text' },
      table: { type: { summary: 'string' } },
    },
  },
  parameters: {
    // A WCAG isenta de contraste o texto de componente inativo (1.4.3), mas o axe
    // não liga o helper text e o contador ao input desabilitado. O TextField marca
    // o contêiner com data-disabled, e a regra pula o que estiver dentro dele.
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', selector: '*:not([data-disabled] *)' }],
      },
    },
    docs: {
      description: {
        component: [
          'Campo completo: rótulo, `InputField`, helper text e contador. Para o `<input>`',
          'sozinho, use o `InputField`, que tem o mesmo eixo `status`.',
          '',
          'Só `status` é prop. Hover, focus e disabled **não são**: são `hover:`,',
          '`focus-visible:` e `disabled:`. Passe o mouse e clique no campo para vê-los.',
          '',
          'A referência visual é o `.field` de `docs/ui/webdex-design-system.html`. Hover,',
          'success e disabled não existem lá e foram derivados dele.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

const STATUSES = ['default', 'error', 'success'] as const

const MESSAGES = {
  default: 'Use apenas letras, números e hífen.',
  error: 'Use apenas letras, números e hífen.',
  success: 'Nome disponível.',
} as const

const VALUES = {
  default: 'webdex-core',
  error: 'vault//prod',
  success: 'webdex-core',
} as const

/** Largura de um formulário estreito, para o campo não esticar até a borda do canvas. */
const narrow: Decorator[] = [
  (Story) => (
    <div className="w-[320px]">
      <Story />
    </div>
  ),
]

/** Use os controles ao lado para trocar status, mensagens e contador. */
export const Playground: Story = { decorators: narrow }

/** Os três status, com valor preenchido. */
export const Status: Story = {
  decorators: narrow,
  render: (args) => (
    <div className="flex flex-col gap-6">
      {STATUSES.map((status) => (
        <TextField
          key={status}
          {...args}
          status={status}
          defaultValue={VALUES[status]}
          helperText={MESSAGES[status]}
        />
      ))}
    </div>
  ),
}

/** O contador sem limite mostra só o total; com `maxLength`, mostra `atual/máximo`. */
export const Contador: Story = {
  decorators: narrow,
  render: (args) => (
    <div className="flex flex-col gap-6">
      <TextField {...args} label="Com maxLength" maxLength={32} defaultValue="webdex-core" />
      <TextField
        {...args}
        label="Sem maxLength"
        maxLength={undefined}
        helperText={undefined}
        defaultValue="webdex-core"
      />
    </div>
  ),
}

// --------------------------------------------------------------------------
// Matriz de estados

/**
 * Hover e focus são pseudo-classes: o navegador só as aplica na interação.
 * Esta função tira o prefixo das classes que o próprio cva gera
 * (`hover:border-white/22` vira `border-white/22`) e devolve só elas. O
 * InputField passa o className depois do cva no cn, e o tailwind-merge resolve
 * o conflito mantendo a última.
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

const th = 'px-3 py-2 font-mono text-[11px] font-medium tracking-wide text-text-secondary'

function Matrix(props: TextFieldProps) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0 text-text-primary">
        <thead>
          <tr>
            <th className={`${th} border-b border-line-default text-left`}>status</th>
            {STATE_COLUMNS.map((state) => (
              <th key={state} className={`${th} border-b border-line-default`}>
                {state}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STATUSES.map((status) => (
            <tr key={status}>
              <th className={`${th} text-left align-top pt-5 text-brand`}>{status}</th>
              {STATE_COLUMNS.map((state) => (
                <td key={state} className="w-[288px] px-3 py-3 align-top">
                  <TextField
                    {...props}
                    status={status}
                    defaultValue={VALUES[status]}
                    helperText={MESSAGES[status]}
                    disabled={state === 'Disabled'}
                    inputClassName={
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
 * Hovered e Focused aqui são forçados por classe, porque são pseudo-classes.
 * Para ver o comportamento real, use o Playground e interaja com o campo.
 */
export const Matriz: Story = {
  render: (args) => <Matrix {...args} />,
  parameters: { layout: 'fullscreen' },
}

/** O `<input>` sozinho, sem rótulo nem mensagens. Aceita o mesmo `status`. */
export const SoInputField: Story = {
  name: 'Só o InputField',
  decorators: narrow,
  render: () => (
    <div className="flex flex-col gap-4">
      {STATUSES.map((status) => (
        <InputField
          key={status}
          status={status}
          defaultValue={VALUES[status]}
          aria-label={`InputField ${status}`}
        />
      ))}
      <InputField disabled defaultValue="webdex-core" aria-label="InputField desabilitado" />
      <InputField placeholder="0x..." aria-label="InputField vazio" />
    </div>
  ),
}
