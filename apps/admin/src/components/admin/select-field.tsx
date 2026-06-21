import { useId, useState } from 'react'

import {
  Field,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'

type SelectOption = [string, string]

type ControlledSelectFieldProps = {
  label: string
  options: SelectOption[]
  value: string
  onValueChange: (value: string) => void
  emptyLabel?: string
  id?: string
}

type UncontrolledSelectFieldProps = {
  label: string
  name: string
  defaultValue: string
  options: SelectOption[]
  id?: string
}

export function SelectField(
  props: ControlledSelectFieldProps | UncontrolledSelectFieldProps,
) {
  const generatedId = useId()
  const id = props.id ?? generatedId

  if ('onValueChange' in props) {
    return <ControlledSelectField id={id} {...props} />
  }

  return <UncontrolledSelectField id={id} {...props} />
}

function ControlledSelectField({
  id,
  label,
  options,
  value,
  onValueChange,
  emptyLabel,
}: ControlledSelectFieldProps & { id: string }) {
  const emptySentinel = '__empty__'
  const selectValue = value || (emptyLabel ? emptySentinel : undefined)

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Select
          value={selectValue}
          onValueChange={(nextValue) =>
            onValueChange(
              emptyLabel && nextValue === emptySentinel ? '' : nextValue,
            )
          }
        >
          <SelectTrigger id={id} aria-label={label}>
            <SelectValue placeholder={emptyLabel ?? label} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {emptyLabel ? (
                <SelectItem value={emptySentinel}>{emptyLabel}</SelectItem>
              ) : null}
              {options.map(([optionValue, optionLabel]) => (
                <SelectItem key={optionValue} value={optionValue}>
                  {optionLabel}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  )
}

function UncontrolledSelectField({
  id,
  label,
  name,
  defaultValue,
  options,
}: UncontrolledSelectFieldProps & { id: string }) {
  const [value, setValue] = useState(defaultValue)

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <input type="hidden" name={name} value={value} />
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger id={id} aria-label={label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map(([optionValue, optionLabel]) => (
                <SelectItem key={optionValue} value={optionValue}>
                  {optionLabel}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  )
}