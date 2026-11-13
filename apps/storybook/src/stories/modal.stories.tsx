import {
  Alert,
  Button,
  ConfirmModal,
  Modal,
  ModalClose,
  type ModalProps,
  TextField,
} from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { WalletMetamask } from '@web3icons/react'
import { type ReactNode, useState } from 'react'

const Shield = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

/**
 * Cancelar e a ação principal. Nas stories, a ação só fecha o modal, como se tivesse dado certo:
 * num app, ela faria o trabalho (salvar, aceitar) e fecharia pelo `open`/`onOpenChange`.
 */
function Footer({ action }: { action: ReactNode }) {
  return (
    <>
      <ModalClose>
        <Button variant="outlined" color="code">
          Cancelar
        </Button>
      </ModalClose>
      <ModalClose>
        <Button>{action}</Button>
      </ModalClose>
    </>
  )
}

const meta = {
  title: 'Componentes/Modal',
  component: Modal,
  args: {
    title: 'Renomear workspace',
    description: 'O nome aparece no painel e nos convites enviados ao time.',
    size: 'md',
    trigger: <Button>Abrir modal</Button>,
    children: <TextField label="Nome do workspace" defaultValue="webdex-core" />,
    footer: <Footer action="Salvar" />,
  },
  // O docgen não extrai tipo de VariantProps, que é um mapped type: sem declarar `table.type`
  // à mão, a coluna de tipo do painel de controles fica vazia.
  argTypes: {
    size: {
      control: { type: 'inline-radio' },
      options: ['sm', 'md', 'lg'],
      description: 'Largura máxima: sm 400px, md 560px, lg 800px.',
      table: { type: { summary: "'sm' | 'md' | 'lg'" }, defaultValue: { summary: 'md' } },
    },
    title: {
      control: { type: 'text' },
      description: 'Título. Obrigatório: é o nome que o leitor de tela anuncia.',
      table: { type: { summary: 'ReactNode' } },
    },
    description: {
      control: { type: 'text' },
      description: 'Texto abaixo do título, ligado ao diálogo por aria-describedby.',
      table: { type: { summary: 'ReactNode' } },
    },
    hideClose: {
      control: { type: 'boolean' },
      description: 'Esconde o X do header. Esc e o clique fora continuam fechando.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    icon: { control: false, table: { type: { summary: 'ReactNode' } } },
    trigger: { control: false, table: { type: { summary: 'ReactElement' } } },
    footer: { control: false, table: { type: { summary: 'ReactNode' } } },
    children: { control: false, table: { type: { summary: 'ReactNode' } } },
  },
  parameters: {
    docs: {
      description: {
        component: [
          'Diálogo sobre o `Dialog` do Radix: foco preso, Esc, rolagem da página travada e',
          'leitor de tela. Header com título, descrição e fechar; conteúdo livre; footer de ações.',
          'Para um botão do footer que só fecha, envolva-o em `ModalClose`.',
          '',
          'O fundo escurecido usa o token `opacity.overlay` (`bg-background/overlay`).',
          '',
          'Para confirmação, como a conexão de carteira, use o `ConfirmModal`: é um',
          '`alertdialog`, não fecha com clique fora e espera a promessa do `onConfirm`.',
          '',
          'A referência aprovada não tem modal: o visual é proposta para revisão do design.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

/** Clique no botão para abrir. Use os controles para trocar tamanho, título e descrição. */
export const Playground: Story = {}

/** Modais que já abrem renderizam em iframe na página de docs, para um overlay não cobrir o outro. */
const iframe = { docs: { story: { inline: false, height: '560px' } } }

/** Aberto, para conferir header, conteúdo e footer sem clicar. */
export const Estrutura: Story = {
  args: { defaultOpen: true, icon: <Shield /> },
  parameters: iframe,
}

/** Os três tamanhos. Cada botão abre um modal com a largura indicada. */
export const Tamanhos: Story = {
  render: (args: ModalProps) => (
    <div className="flex flex-wrap gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Modal
          key={size}
          {...args}
          size={size}
          title={`Tamanho ${size}`}
          trigger={
            <Button variant="outlined" color="code">
              Abrir {size}
            </Button>
          }
        />
      ))}
    </div>
  ),
}

/** Conteúdo maior que a tela: o header e o footer ficam fixos e só o meio rola. */
export const ConteudoLongo: Story = {
  name: 'Conteúdo longo',
  args: {
    defaultOpen: true,
    title: 'Termos de uso',
    description: undefined,
    children: (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 24 }, (_, index) => index + 1).map((clause) => (
          <p key={clause}>
            {clause}. A WEbdEX não tem acesso às suas chaves privadas. Toda transação é assinada na
            sua carteira e enviada direto para a rede.
          </p>
        ))}
      </div>
    ),
    footer: <Footer action="Aceitar" />,
  },
  parameters: iframe,
}

// --------------------------------------------------------------------------
// Confirmação

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Variação de confirmação: conectar a carteira. O `onConfirm` devolve uma promessa (aqui, 1,5 s
 * simulando a carteira) e, enquanto ela não termina, os botões ficam desabilitados e o Esc não
 * fecha. Cancelar ganha o foco ao abrir, para Enter por engano não confirmar.
 */
function ConnectWallet() {
  const [address, setAddress] = useState<string | null>(null)
  return (
    <div className="flex flex-col items-center gap-4">
      <ConfirmModal
        trigger={<Button>Conectar carteira</Button>}
        icon={<WalletMetamask variant="branded" />}
        title="Conectar carteira"
        description="O site vai ver o seu endereço público e o saldo. Nenhuma transação é feita sem a sua assinatura."
        confirmLabel="Conectar"
        pendingLabel="Aguardando a carteira…"
        onConfirm={async () => {
          await sleep(1500)
          setAddress('0x3fA9…c21B')
        }}
        onCancel={() => setAddress(null)}
      >
        <Alert variant="info">A conexão pode ser desfeita a qualquer momento na carteira.</Alert>
      </ConfirmModal>
      {address && <p className="font-mono text-3xs text-text-secondary">Conectado: {address}</p>}
    </div>
  )
}

export const Confirmacao: Story = {
  name: 'Confirmação: conectar carteira',
  render: () => <ConnectWallet />,
}

/** A confirmação aberta, para conferir o desenho sem clicar. */
export const ConfirmacaoAberta: Story = {
  name: 'Confirmação aberta',
  render: () => (
    <ConfirmModal
      defaultOpen
      icon={<WalletMetamask variant="branded" />}
      title="Conectar carteira"
      description="O site vai ver o seu endereço público e o saldo. Nenhuma transação é feita sem a sua assinatura."
      confirmLabel="Conectar"
      onConfirm={() => sleep(1500)}
    />
  ),
  parameters: iframe,
}
