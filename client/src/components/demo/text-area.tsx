import { useStore } from '@tanstack/react-form'
import { useFieldContext } from '#/hooks/demo.form-context'
import { FormErrorMessages } from '#/components/demo/form-error-messages'
import { Label } from '#/components/ui/label'
import { Textarea as ShadcnTextarea } from '#/components/ui/textarea'

export function TextArea({
  label,
  rows = 3,
}: {
  label: string
  rows?: number
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <ShadcnTextarea
        id={label}
        value={field.state.value}
        onBlur={field.handleBlur}
        rows={rows}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isTouched && <FormErrorMessages errors={errors} />}
    </div>
  )
}
