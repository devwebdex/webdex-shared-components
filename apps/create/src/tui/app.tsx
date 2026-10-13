import { basename, resolve } from 'node:path'
import { createCliRenderer } from '@opentui/core'
import { createRoot, useKeyboard } from '@opentui/react'
import { useState } from 'react'
import {
  catalog,
  isIrrelevant,
  type Option,
  ormsFor,
  type ProjectOptions,
} from '../core/catalog.js'
import { lockReason } from '../core/lock.js'

type Choices = Omit<ProjectOptions, 'name'>
type ChoiceKey = keyof Choices
export type TuiResult = { directory: string; options: ProjectOptions }
type Props = {
  directory?: string | undefined
  initial: Choices
  onDone: (result: TuiResult | null) => void
}

const steps: { key: ChoiceKey; title: string }[] = [
  { key: 'architecture', title: 'Arquitetura' },
  { key: 'backend', title: 'Backend' },
  { key: 'orm', title: 'ORM' },
  { key: 'database', title: 'Banco de dados' },
  { key: 'frontend', title: 'Frontend' },
]

const colors = { accent: '#4f8cff', muted: '#6b7280', error: '#ef4444', text: '#e5e7eb' }

export async function runTui(input: Omit<Props, 'onDone'>): Promise<TuiResult | null> {
  let finish: (result: TuiResult | null) => void = () => {}
  const result = new Promise<TuiResult | null>((resolve) => {
    finish = resolve
  })
  // O renderer trata SIGTERM/SIGHUP restaurando o terminal; sem resolver aqui, o processo ficaria vivo.
  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
    useMouse: true,
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
  const [directory, setDirectory] = useState(initialDirectory ?? '')
  const [directoryError, setDirectoryError] = useState<string | null>(null)
  const [choices, setChoices] = useState(initial)
  const [stage, setStage] = useState<'directory' | number | 'summary'>(
    initialDirectory ? 0 : 'directory'
  )
  const [highlight, setHighlight] = useState(0)

  const visibleSteps = steps.filter((step) => !isIrrelevant({ ...choices, name: '' }, step.key))
  const step = typeof stage === 'number' ? visibleSteps[stage] : undefined
  const options = step ? optionsFor(step.key, choices) : []

  function goTo(next: typeof stage) {
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
    if (!directory) return setDirectoryError('informe o diretório do projeto')
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
      return setDirectoryError(`"${name}" não serve como nome: use minúsculas, números e hífen`)
    }
    const reason = lockReason(resolve(directory))
    if (reason) return setDirectoryError(reason)
    setDirectoryError(null)
    goTo(0)
  }

  function choose(option: Option<string>) {
    if (!step || !option.available) return
    const next = { ...choices, [step.key]: option.value } as Choices
    if (step.key === 'backend') {
      const valid = ormsFor(next.backend)
      if (valid.length > 0 && !valid.includes(next.orm)) next.orm = valid[0] as Choices['orm']
    }
    setChoices(next)
    const remaining = steps.filter((s) => !isIrrelevant({ ...next, name: '' }, s.key))
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

  return (
    <box flexDirection="column" padding={1} gap={1}>
      <text fg={colors.accent}>WEbdEX · novo projeto</text>

      {stage === 'directory' && (
        <box flexDirection="column" gap={1}>
          <text>Diretório do projeto (o nome do projeto vem do nome da pasta):</text>
          <box border borderColor={colors.accent} height={3}>
            <input
              focused
              placeholder="meu-projeto"
              onInput={setDirectory}
              onSubmit={submitDirectory}
            />
          </box>
          {directoryError && <text fg={colors.error}>{directoryError}</text>}
        </box>
      )}

      {step && (
        <box flexDirection="column" gap={1}>
          <text>{`Passo ${(stage as number) + 1} de ${visibleSteps.length}: ${step.title}`}</text>
          {options.map((option, index) => (
            <box
              key={option.value}
              border
              borderColor={index === highlight ? colors.accent : colors.muted}
              paddingLeft={1}
              onMouseDown={() => choose(option)}
            >
              <text fg={option.available ? colors.text : colors.muted}>
                {option.available ? option.label : `${option.label} (em breve)`}
              </text>
            </box>
          ))}
        </box>
      )}

      {stage === 'summary' && (
        <box flexDirection="column" gap={1}>
          <text>{`Resumo do projeto em ${directory}:`}</text>
          {visibleSteps.map((s) => (
            <text key={s.key}>{`  ${s.title}: ${labelOf(s.key, choices[s.key])}`}</text>
          ))}
          <box flexDirection="row" gap={2}>
            <box border borderColor={colors.accent} paddingX={1} onMouseDown={confirm}>
              <text fg={colors.accent}>Criar projeto</text>
            </box>
            <box border borderColor={colors.muted} paddingX={1} onMouseDown={back}>
              <text>Voltar</text>
            </box>
            <box border borderColor={colors.muted} paddingX={1} onMouseDown={() => onDone(null)}>
              <text>Cancelar</text>
            </box>
          </box>
        </box>
      )}

      <text fg={colors.muted}>Clique com o mouse ou use ↑↓ e Enter · ← volta · Esc sai</text>
    </box>
  )
}

function optionsFor(key: ChoiceKey, choices: Choices): Option<string>[] {
  const list = catalog[key] as Option<string>[]
  if (key !== 'orm') return list
  const valid: string[] = ormsFor(choices.backend)
  return list.filter((option) => valid.includes(option.value))
}

function labelOf(key: ChoiceKey, value: string) {
  return (catalog[key] as Option<string>[]).find((option) => option.value === value)?.label ?? value
}
