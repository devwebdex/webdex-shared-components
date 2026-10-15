import { homedir } from 'node:os'
import { basename, resolve } from 'node:path'
import { createCliRenderer } from '@opentui/core'
import { createRoot, useKeyboard, useTerminalDimensions } from '@opentui/react'
import { useState } from 'react'
import {
  type ChoiceKey,
  type Choices,
  catalog,
  compatibleValues,
  defaults,
  isIrrelevant,
  normalize,
  type Option,
  type ProjectOptions,
} from '../core/catalog.js'
import { appsFor } from '../core/generate.js'
import { lockReason } from '../core/lock.js'

type Stage = 'directory' | number | 'summary'
export type TuiResult = { directory: string; options: ProjectOptions }
type Props = {
  directory?: string | undefined
  initial: Choices
  onDone: (result: TuiResult | null) => void
}

const steps: { key: ChoiceKey; title: string; note?: string }[] = [
  {
    key: 'architecture',
    title: 'Arquitetura',
    note: 'Todo projeto nasce como monorepo (pnpm workspaces + Turborepo), mesmo com uma app só: API em apps/api e frontend em apps/web. Com Inertia, as páginas ficam no apps/api.',
  },
  { key: 'backend', title: 'Backend' },
  { key: 'database', title: 'Banco de dados' },
  { key: 'orm', title: 'ORM' },
  { key: 'queue', title: 'Filas' },
  { key: 'frontend', title: 'Frontend' },
  { key: 'web3', title: 'Web3' },
]

// Cores da marca WEbdEX (painel WEbdEX); line, muted e faint são tons derivados do fundo ameixa.
const palette = {
  bg: '#0c0611',
  panel: '#140a1c',
  raised: '#1d1127',
  line: '#3b2645',
  brand: '#f5127c',
  brandSoft: '#ff6ba8',
  text: '#fbf5f9',
  muted: '#a593ad',
  faint: '#6e5a78',
  success: '#1fc98a',
  danger: '#ff5c40',
}

export async function runTui(input: Omit<Props, 'onDone'>): Promise<TuiResult | null> {
  let finish: (result: TuiResult | null) => void = () => {}
  const result = new Promise<TuiResult | null>((resolve) => {
    finish = resolve
  })
  // O renderer trata SIGTERM/SIGHUP restaurando o terminal; sem resolver aqui, o processo ficaria vivo.
  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
    useMouse: true,
    backgroundColor: palette.bg,
    onDestroy: () => finish(null),
  })
  createRoot(renderer).render(
    <App
      {...input}
      onDone={(answer) => {
        finish(answer)
        renderer.destroy()
      }}
    />
  )
  return result
}

export function App({ directory: initialDirectory, initial, onDone }: Props) {
  const { width, height } = useTerminalDimensions()
  const [directory, setDirectory] = useState(initialDirectory ?? '')
  const [directoryError, setDirectoryError] = useState<string | null>(null)
  const [choices, setChoices] = useState(initial)
  const [stage, setStage] = useState<Stage>(initialDirectory ? 0 : 'directory')
  const [highlight, setHighlight] = useState(0)

  const visibleSteps = stepsFor(choices)
  const step = typeof stage === 'number' ? visibleSteps[stage] : undefined
  const options = step ? optionsFor(step.key, choices) : []
  const compact = width < 72 || height < 34

  function goTo(next: Stage) {
    setStage(next)
    if (typeof next === 'number') {
      const target = visibleSteps[next]
      const list = target ? optionsFor(target.key, choices) : []
      setHighlight(
        Math.max(
          0,
          list.findIndex((o) => target && o.value === choices[target.key])
        )
      )
    }
  }

  function submitDirectory() {
    const name = basename(resolve(directory || '.'))
    if (!directory) return setDirectoryError('Informe a pasta do projeto.')
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
      return setDirectoryError(
        `"${name}" não serve como nome de projeto: use minúsculas, números e hífen.`
      )
    }
    const reason = lockReason(resolve(directory))
    if (reason) return setDirectoryError(`Não dá para usar esta pasta: ${reason}`)
    setDirectoryError(null)
    goTo(0)
  }

  function choose(option: Option<string>) {
    if (!step || !option.available) return
    const next = normalize({ ...choices, [step.key]: option.value } as Choices)
    setChoices(next)
    const remaining = stepsFor(next)
    const index = remaining.findIndex((s) => s.key === step.key)
    if (index + 1 < remaining.length) {
      setStage(index + 1)
      const target = remaining[index + 1] as (typeof steps)[number]
      const list = optionsFor(target.key, next)
      setHighlight(
        Math.max(
          0,
          list.findIndex((o) => o.value === next[target.key])
        )
      )
    } else {
      setStage('summary')
    }
  }

  function back() {
    if (stage === 'summary') goTo(visibleSteps.length - 1)
    else if (typeof stage === 'number' && stage > 0) goTo(stage - 1)
    else if (stage === 0 && !initialDirectory) setStage('directory')
  }

  function confirm() {
    onDone({ directory, options: { ...choices, name: basename(resolve(directory)) } })
  }

  useKeyboard((key) => {
    if (key.name === 'escape' || (key.ctrl && key.name === 'c')) return onDone(null)
    if (stage === 'directory') return
    if (stage === 'summary') {
      if (key.name === 'return' || key.name === 'enter') confirm()
      if (key.name === 'left') back()
      return
    }
    if (key.name === 'up') setHighlight((h) => Math.max(0, h - 1))
    if (key.name === 'down') setHighlight((h) => Math.min(options.length - 1, h + 1))
    if (key.name === 'left') back()
    if (key.name === 'return' || key.name === 'enter') {
      const option = options[highlight]
      if (option) choose(option)
    }
  })

  const sidebar = [
    ...(initialDirectory ? [] : [{ title: 'Pasta', stage: 'directory' as Stage }]),
    ...visibleSteps.map((s, index) => ({ title: s.title, stage: index as Stage })),
    { title: 'Resumo', stage: 'summary' as Stage },
  ]
  const currentIndex = sidebar.findIndex((item) => item.stage === stage)
  const panelTitle =
    stage === 'directory' ? 'Pasta' : stage === 'summary' ? 'Resumo' : (step?.title ?? '')

  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      backgroundColor={palette.bg}
      paddingX={2}
      paddingY={1}
      gap={1}
    >
      <Header directory={directory} compact={compact} />

      <box flexDirection="row" gap={2} flexGrow={1}>
        {!compact && (
          <box
            title="Etapas"
            titleColor={palette.muted}
            border
            borderStyle="rounded"
            borderColor={palette.line}
            backgroundColor={palette.panel}
            width={24}
            paddingX={1}
            flexDirection="column"
          >
            {sidebar.map((item, index) => {
              const status =
                index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending'
              return (
                <text
                  key={item.title}
                  onMouseDown={() => {
                    if (status === 'done') goTo(item.stage)
                  }}
                >
                  <span fg={markerColor[status]}>{markers[status]}</span>
                  <span
                    fg={status === 'pending' ? palette.faint : palette.text}
                  >{` ${item.title}`}</span>
                </text>
              )
            })}
          </box>
        )}

        <box
          title={compact ? `${panelTitle} (${currentIndex + 1} de ${sidebar.length})` : panelTitle}
          titleColor={palette.brandSoft}
          border
          borderStyle="rounded"
          borderColor={palette.line}
          backgroundColor={palette.panel}
          flexGrow={1}
          padding={1}
          flexDirection="column"
          gap={1}
        >
          {stage === 'directory' && (
            <>
              <text fg={palette.text}>
                Onde criar o projeto? O nome do projeto vem do nome da pasta.
              </text>
              <box
                border
                borderStyle="rounded"
                borderColor={palette.brand}
                backgroundColor={palette.raised}
                height={3}
                paddingX={1}
              >
                <input
                  focused
                  value={directory}
                  placeholder="../meu-projeto"
                  onInput={setDirectory}
                  onSubmit={submitDirectory}
                />
              </box>
              {directoryError && <text fg={palette.danger}>{`✕ ${directoryError}`}</text>}
            </>
          )}

          {step?.note && <text fg={palette.muted}>{step.note}</text>}

          {step && (
            <box flexDirection="column">
              {options.map((option, index) => (
                <OptionCard
                  key={option.value}
                  option={option}
                  compact={compact}
                  selected={choices[step.key] === option.value}
                  focused={index === highlight}
                  recommended={defaults[step.key] === option.value}
                  onHover={() => option.available && setHighlight(index)}
                  onChoose={() => choose(option)}
                />
              ))}
            </box>
          )}

          {stage === 'summary' && (
            <Summary
              directory={directory}
              rows={[
                {
                  title: 'Estrutura',
                  value: `Monorepo (pnpm + Turborepo): ${appsFor(choices).join(', ')}`,
                },
                ...steps
                  .filter((s) => !isIrrelevant(choices, s.key))
                  .map((s) => ({
                    title: s.title,
                    value: labelOf(s.key, choices[s.key]),
                  })),
              ]}
              onConfirm={confirm}
              onBack={back}
              onCancel={() => onDone(null)}
            />
          )}
        </box>
      </box>

      <Footer stage={stage} />
    </box>
  )
}

const markers = { done: '✓', current: '●', pending: '○' }
const markerColor = { done: palette.success, current: palette.brand, pending: palette.faint }

/** O "bd" minúsculo é a assinatura do nome WEbdEX; a fonte só tem maiúsculas, então ele vem pela cor. */
function Header({ directory, compact }: { directory: string; compact: boolean }) {
  const font = compact ? 'tiny' : 'block'
  return (
    <box flexDirection="column" flexShrink={0}>
      <box flexDirection="row" gap={1} height={compact ? 2 : 6}>
        <ascii-font text="WE" font={font} color={palette.brand} />
        <ascii-font text="BD" font={font} color={palette.text} />
        <ascii-font text="EX" font={font} color={palette.brand} />
      </box>
      <text fg={palette.muted}>
        {directory ? 'Novo projeto ' : 'Novo projeto'}
        {directory && <span fg={palette.text}>{basename(resolve(directory))}</span>}
      </text>
    </box>
  )
}

function tildify(path: string) {
  const home = homedir()
  return path.startsWith(home) ? `~${path.slice(home.length)}` : path
}

type OptionCardProps = {
  option: Option<string>
  compact: boolean
  selected: boolean
  focused: boolean
  recommended: boolean
  onHover: () => void
  onChoose: () => void
}

function OptionCard(props: OptionCardProps) {
  const { option, compact, selected, focused, recommended, onHover, onChoose } = props
  const enabled = option.available
  const badge = !enabled ? 'em breve' : recommended ? 'recomendado' : ''
  return (
    <box
      border
      borderStyle="rounded"
      borderColor={focused && enabled ? palette.brand : palette.line}
      backgroundColor={focused && enabled ? palette.raised : palette.panel}
      paddingX={1}
      flexDirection="column"
      flexShrink={0}
      onMouseOver={onHover}
      onMouseDown={onChoose}
    >
      <box flexDirection="row" justifyContent="space-between">
        <text>
          <span fg={selected && enabled ? palette.brand : palette.faint}>
            {selected ? '●' : '○'}
          </span>
          <span fg={enabled ? palette.text : palette.faint}>
            <strong>{` ${option.label}`}</strong>
          </span>
        </text>
        {badge && <text fg={enabled ? palette.brandSoft : palette.faint}>{badge}</text>}
      </box>
      {!compact && (
        <text fg={enabled ? palette.muted : palette.faint}>{`  ${option.description}`}</text>
      )}
    </box>
  )
}

type SummaryProps = {
  directory: string
  rows: { title: string; value: string }[]
  onConfirm: () => void
  onBack: () => void
  onCancel: () => void
}

function Summary({ directory, rows, onConfirm, onBack, onCancel }: SummaryProps) {
  return (
    <>
      <box flexDirection="column">
        {[{ title: 'Pasta', value: tildify(resolve(directory)) }, ...rows].map((row) => (
          <box key={row.title} flexDirection="row">
            <box width={16}>
              <text fg={palette.muted}>{row.title}</text>
            </box>
            <text fg={palette.text}>{row.value}</text>
          </box>
        ))}
      </box>
      <text fg={palette.muted}>
        Depois de criado, o gerador não roda de novo nesta pasta, para não sobrescrever o projeto.
      </text>
      <box flexDirection="row" flexWrap="wrap" gap={2}>
        <box
          border
          borderStyle="rounded"
          borderColor={palette.brand}
          backgroundColor={palette.brand}
          paddingX={1}
          flexShrink={0}
          onMouseDown={onConfirm}
        >
          <text fg="#ffffff">
            <strong>Criar projeto</strong>
          </text>
        </box>
        <box
          border
          borderStyle="rounded"
          borderColor={palette.line}
          paddingX={1}
          flexShrink={0}
          onMouseDown={onBack}
        >
          <text fg={palette.text}>Voltar</text>
        </box>
        <box
          border
          borderStyle="rounded"
          borderColor={palette.line}
          paddingX={1}
          flexShrink={0}
          onMouseDown={onCancel}
        >
          <text fg={palette.muted}>Cancelar</text>
        </box>
      </box>
    </>
  )
}

function Footer({ stage }: { stage: Stage }) {
  const hints: [string, string][] =
    stage === 'directory'
      ? [
          ['Enter', 'confirmar'],
          ['Esc', 'sair'],
        ]
      : stage === 'summary'
        ? [
            ['Enter', 'criar'],
            ['←', 'voltar'],
            ['Esc', 'sair'],
          ]
        : [
            ['↑↓', 'navegar'],
            ['Enter', 'escolher'],
            ['←', 'voltar'],
            ['Esc', 'sair'],
          ]
  return (
    <text flexShrink={0}>
      {hints.map(([key, action]) => (
        <span key={key}>
          <span fg={palette.text}>{key}</span>
          <span fg={palette.faint}>{` ${action}   `}</span>
        </span>
      ))}
      <span fg={palette.faint}>ou use o mouse</span>
    </text>
  )
}

/** Etapas a perguntar: sem as irrelevantes (ORM e banco sem backend) e sem as de opção única (ORM do Adonis). */
function stepsFor(choices: Choices) {
  return steps.filter(
    (step) => !isIrrelevant(choices, step.key) && optionsFor(step.key, choices).length > 1
  )
}

function optionsFor(key: ChoiceKey, choices: Choices): Option<string>[] {
  const compatible = compatibleValues(key, choices)
  return (catalog[key] as Option<string>[]).filter((option) => compatible.includes(option.value))
}

function labelOf(key: ChoiceKey, value: string) {
  return (catalog[key] as Option<string>[]).find((option) => option.value === value)?.label ?? value
}
