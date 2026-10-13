// Gera os subagentes de cada ferramenta de IA a partir da fonte única em ai/agents/*.md.
// Uso, na raiz do repositório: node scripts/sync-agents.mjs [--check]
// O mesmo arquivo serve o monorepo do gerador e os projetos gerados, por isso a raiz é o diretório atual.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const root = process.cwd()
const sourceDir = join(root, 'ai/agents')
const checkOnly = process.argv.includes('--check')
const notice =
  'Gerado por scripts/sync-agents.mjs a partir de ai/agents/. Edite a fonte, não este arquivo.'

const renderers = [
  { path: (name) => `.claude/agents/${name}.md`, render: renderClaude },
  { path: (name) => `.opencode/agents/${name}.md`, render: renderOpencode },
  { path: (name) => `.codex/agents/${name}.toml`, render: renderCodex },
]

const outdated = []
for (const file of (await readdir(sourceDir)).filter((f) => f.endsWith('.md'))) {
  const agent = parseAgent(await readFile(join(sourceDir, file), 'utf8'), file)
  for (const { path, render } of renderers) {
    const target = join(root, path(agent.name))
    const content = render(agent)
    const current = await readFile(target, 'utf8').catch(() => null)
    if (current === content) continue
    if (checkOnly) {
      outdated.push(path(agent.name))
      continue
    }
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, content)
    console.log(`gerado ${path(agent.name)}`)
  }
}

if (outdated.length > 0) {
  console.error(`Agentes desatualizados (rode pnpm agents:sync):\n${outdated.join('\n')}`)
  process.exit(1)
}

function parseAgent(text, file) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error(`${file}: frontmatter ausente`)
  const meta = Object.fromEntries(
    match[1].split('\n').map((line) => {
      const separator = line.indexOf(':')
      if (separator < 1) throw new Error(`${file}: linha de frontmatter inválida: "${line}"`)
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()]
    })
  )
  for (const key of ['name', 'description', 'sandbox']) {
    if (!meta[key]) throw new Error(`${file}: campo "${key}" ausente`)
  }
  if (!['read-only', 'workspace-write'].includes(meta.sandbox)) {
    throw new Error(`${file}: sandbox deve ser read-only ou workspace-write`)
  }
  return { ...meta, body: match[2].trim() }
}

// JSON.stringify produz strings válidas tanto em YAML (aspas duplas) quanto em TOML (basic string).
function renderClaude(agent) {
  const tools = agent.sandbox === 'read-only' ? 'tools: Read, Grep, Glob\n' : ''
  return `---\nname: ${agent.name}\ndescription: ${JSON.stringify(agent.description)}\n${tools}---\n\n<!-- ${notice} -->\n\n${agent.body}\n`
}

// bash também é negado: com ele o agente escreveria arquivos e o read-only não valeria.
function renderOpencode(agent) {
  const permission =
    agent.sandbox === 'read-only'
      ? 'permission:\n  edit: deny\n  bash: deny\n  webfetch: deny\n'
      : ''
  return `---\ndescription: ${JSON.stringify(agent.description)}\nmode: subagent\n${permission}---\n\n<!-- ${notice} -->\n\n${agent.body}\n`
}

function renderCodex(agent) {
  const body = agent.body.replaceAll('\\', '\\\\').replaceAll('"""', '""\\"')
  return `# ${notice}\nname = ${JSON.stringify(agent.name)}\ndescription = ${JSON.stringify(agent.description)}\nsandbox_mode = ${JSON.stringify(agent.sandbox)}\ndeveloper_instructions = """\n${body}\n"""\n`
}
