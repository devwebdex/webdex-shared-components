import {
  Combobox,
  type ComboboxOption,
  cn,
  listItemVariants,
  listPopupVariants,
  Menu,
  type MenuItem,
  Select,
  type SelectOption,
} from '@devwebdex/ui'
import type { ReactNode } from 'react'
import {
  boxRows,
  insetRingRow,
  type MeasureColumn,
  type MeasureRow,
  MeasureTable,
} from './measurements.js'

/**
 * Medidas do Select, do Combobox e do Menu, no formato da Medidas do Button. O campo e o gatilho são os
 * componentes reais; a lista aberta vive num portal e só existe com o clique, então é medida
 * com as mesmas classes que o componente aplica (listPopupVariants e listItemVariants).
 */

const SIZES = ['large', 'medium', 'small'] as const

/** Item da lista: as medidas de caixa, mais a barra que marca o item em destaque. */
const itemRows: MeasureRow[] = [
  ...boxRows,
  {
    property: 'barra do destaque (largura)',
    namespace: 'spacing',
    read: (_s, element) => getComputedStyle(element, '::before').width,
  },
]

/** Caixa que abre: só o que não depende do tamanho do item. */
const popupRows: MeasureRow[] = [
  { property: 'respiro interno', namespace: 'spacing', read: (s) => s.paddingTop },
  { property: 'raio', namespace: 'radius', read: (s) => s.borderTopLeftRadius },
  insetRingRow,
]

function Part({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary">{hint}</p>
      </div>
      {children}
    </section>
  )
}

function itemColumns(icon: ReactNode, label: string): MeasureColumn[] {
  return SIZES.map((size) => ({
    label: size,
    render: (ref) => (
      <div className={cn(listPopupVariants(), 'w-56')}>
        <div ref={ref} className={listItemVariants({ size })}>
          {icon}
          {label}
        </div>
      </div>
    ),
  }))
}

const popupColumns = (icon: ReactNode, label: string): MeasureColumn[] => [
  {
    label: 'radius = 2 (padrão)',
    render: (ref) => (
      <div ref={ref} className={cn(listPopupVariants(), 'w-56')}>
        <div className={listItemVariants()}>
          {icon}
          {label}
        </div>
      </div>
    ),
  },
]

/** Campo real nos três tamanhos; mede o gatilho, que tem papel de combobox nos dois. */
function fieldColumns(field: (size: (typeof SIZES)[number]) => ReactNode): MeasureColumn[] {
  return SIZES.map((size) => ({
    label: size,
    render: (ref) => (
      <div
        className="w-64"
        ref={(element) => ref(element?.querySelector<HTMLElement>('[role="combobox"]') ?? null)}
      >
        {field(size)}
      </div>
    ),
  }))
}

export function SelectMeasurements({
  options,
  icon,
}: {
  options: SelectOption[]
  icon: ReactNode
}) {
  const columns = fieldColumns((size) => (
    <Select options={options} defaultValue="polygon" size={size} aria-label={`Rede (${size})`} />
  ))
  return (
    <div className="flex flex-col gap-10">
      <Part title="Campo" hint="O gatilho que fica na página, nos três tamanhos.">
        <MeasureTable columns={columns} rows={boxRows} />
      </Part>
      <Part title="Item da lista" hint="Cada opção da lista aberta, nos três tamanhos.">
        <MeasureTable columns={itemColumns(icon, 'Polygon')} rows={itemRows} />
      </Part>
      <Part title="Caixa da lista" hint="A caixa que abre; não muda com o tamanho.">
        <MeasureTable columns={popupColumns(icon, 'Polygon')} rows={popupRows} />
      </Part>
    </div>
  )
}

/**
 * O Combobox tem o gatilho e o item do Select. A caixa muda: a barra de busca no topo tem
 * tamanho fixo e o respiro fica na lista, não na caixa; ela só existe aberta, num portal.
 */
export function ComboboxMeasurements({
  options,
  icon,
}: {
  options: ComboboxOption[]
  icon: ReactNode
}) {
  const columns = fieldColumns((size) => (
    <Combobox options={options} defaultValue="polygon" size={size} aria-label={`Rede (${size})`} />
  ))
  return (
    <div className="flex flex-col gap-10">
      <Part title="Campo" hint="O gatilho que fica na página, nos três tamanhos.">
        <MeasureTable columns={columns} rows={boxRows} />
      </Part>
      <Part title="Item da lista" hint="Cada opção da lista aberta, nos três tamanhos.">
        <MeasureTable columns={itemColumns(icon, 'Polygon')} rows={itemRows} />
      </Part>
    </div>
  )
}

export function MenuMeasurements({ items, icon }: { items: MenuItem[]; icon: ReactNode }) {
  const triggerColumns: MeasureColumn[] = SIZES.map((size) => ({
    label: size,
    render: (ref) => (
      <div ref={(element) => ref(element?.querySelector<HTMLElement>('button') ?? null)}>
        <Menu label="Ações" items={items} size={size} />
      </div>
    ),
  }))
  return (
    <div className="flex flex-col gap-10">
      <Part title="Gatilho" hint="O Button com a seta que abre o menu, nos três tamanhos.">
        <MeasureTable columns={triggerColumns} rows={boxRows} />
      </Part>
      <Part title="Item do menu" hint="Cada ação da lista aberta, nos três tamanhos.">
        <MeasureTable columns={itemColumns(icon, 'Editar')} rows={itemRows} />
      </Part>
      <Part title="Caixa do menu" hint="A caixa que abre; não muda com o tamanho.">
        <MeasureTable columns={popupColumns(icon, 'Editar')} rows={popupRows} />
      </Part>
    </div>
  )
}
