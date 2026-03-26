import { useStore } from '@tanstack/react-form'
import { useFieldContext } from '#/hooks/demo.form-context'
import { FormErrorMessages } from '#/components/demo/form-error-messages'
import { Label } from '#/components/ui/label'
import { Input } from '#/components/ui/input'

export function TextField({
  label,
  placeholder,
  type = 'text',
}: {
  label: string
  placeholder?: string
  type?: string
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <Input
        type={type}
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isTouched && <FormErrorMessages errors={errors} />}
    </div>
  )
}
