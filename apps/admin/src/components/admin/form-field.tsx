import { useId, useState } from 'react'

import { Checkbox } from '#/components/ui/checkbox'
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'

export function FormField({
  label,
  name,
  defaultValue,
  placeholder,
  pattern,
  type = 'text',
  required,
  readOnly,
}: {
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  pattern?: string
  type?: string
  required?: boolean
  readOnly?: boolean
}) {
  const id = useId()

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Input
          id={id}
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          pattern={pattern}
          required={required}
          readOnly={readOnly}
        />
      </Field>
    </FieldGroup>
  )
}

export function TextAreaField({
  label,
  name,
  defaultValue,
  placeholder,
  rows,
  required,
}: {
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  rows: number
  required?: boolean
}) {
  const id = useId()

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Textarea
          id={id}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={rows}
          required={required}
        />
      </Field>
    </FieldGroup>
  )
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
}: {
  label: string
  name: string
  defaultChecked?: boolean
}) {
  const id = useId()
  const [checked, setChecked] = useState(defaultChecked ?? false)

  return (
    <Field orientation="horizontal">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => setChecked(value === true)}
      />
      {checked ? <input type="hidden" name={name} value="on" /> : null}
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
    </Field>
  )
}
