'use client'

import { cva } from 'class-variance-authority'
import { type ChangeEvent, type ReactNode, useId, useState } from 'react'
import { cn } from '../../lib/cn.js'
import { InputField, type InputFieldProps } from '../input-field/input-field.js'

/**
 * Campo completo: rótulo, InputField, helper text e contador.
 *
 * A referência visual é o `.field` de docs/ui/webdex-design-system.html.
 *
 * `className` vai para o contêiner, que é o que se posiciona no layout. O resto
 * das props vai para o `<input>`, inclusive `id`, `value` e `onChange`. Para
 * estilizar o input em si, use `inputClassName`.
 *
 * Desabilitado, o contêiner recebe `data-disabled`. Serve de gancho de estilo e
 * marca o rótulo e as mensagens como parte de um componente inativo, que a WCAG
 * isenta de contraste mínimo (1.4.3).
 *
 * É client component porque o contador precisa saber o tamanho do valor, e no
 * modo não controlado isso só se sabe acompanhando o onChange.
 *
 * VALORES SEM TOKEN:
 *
 *   texto      11.5px, leading 16px   helper text e contador; fora da escala text
 *                                     (13, 14, 15px)
 *
 * DIVERGÊNCIAS do HTML de referência:
 *
 * - O rótulo é `text.sm` (13px), não 12.5px.
 * - O espaço entre rótulo, campo e mensagem é `spacing.2` (8px), não 6px.
 */
const messageVariants = cva('', {
  variants: {
    status: {
      default: 'text-text-secondary',
      error: 'text-danger',
      success: 'text-success',
      disabled: 'text-text-disabled',
    },
  },
})

export type TextFieldProps = InputFieldProps & {
  /** Rótulo acima do campo, ligado ao input por `htmlFor`. */
  label?: ReactNode
  /** Mensagem abaixo do campo. Assume a cor do `status`. */
  helperText?: ReactNode
  /** Mostra o contador de caracteres. Com `maxLength`, exibe `atual/máximo`. */
  counter?: boolean | undefined
  /** Classes do `<input>`. `className` vai para o contêiner. */
  inputClassName?: string | undefined
}

export function TextField({
  className,
  inputClassName,
  label,
  helperText,
  counter = false,
  status,
  id,
  value,
  defaultValue,
  maxLength,
  disabled,
  onChange,
  'aria-describedby': describedBy,
  ...props
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const helperId = `${inputId}-helper`
  const counterId = `${inputId}-counter`

  const [uncontrolledLength, setUncontrolledLength] = useState(
    () => String(defaultValue ?? '').length
  )
  const length = value === undefined ? uncontrolledLength : String(value).length

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setUncontrolledLength(event.target.value.length)
    onChange?.(event)
  }

  const messageStatus = disabled ? 'disabled' : (status ?? 'default')
  const ariaDescribedBy =
    [describedBy, helperText ? helperId : null, counter ? counterId : null]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <div
      data-disabled={disabled || undefined}
      className={cn('flex flex-col gap-2 font-sans', className)}
    >
      {label && (
        <label
          htmlFor={inputId}
          className={cn('text-sm', disabled ? 'text-text-disabled' : 'text-text-secondary')}
        >
          {label}
        </label>
      )}
      <InputField
        id={inputId}
        status={status}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        disabled={disabled}
        onChange={handleChange}
        aria-describedby={ariaDescribedBy}
        className={inputClassName}
        {...props}
      />
      {(helperText || counter) && (
        <div className="flex items-start gap-3 font-mono text-[11.5px] leading-[16px]">
          {helperText && (
            <p id={helperId} className={messageVariants({ status: messageStatus })}>
              {helperText}
            </p>
          )}
          {counter && (
            <p
              id={counterId}
              className={cn(
                'ml-auto shrink-0 tabular-nums',
                disabled ? 'text-text-disabled' : 'text-text-secondary'
              )}
            >
              {maxLength === undefined ? length : `${length}/${maxLength}`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
