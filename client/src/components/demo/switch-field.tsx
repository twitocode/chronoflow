import { useStore } from '@tanstack/react-form'
import { useFieldContext } from '#/hooks/demo.form-context'
import { FormErrorMessages } from '#/components/demo/form-error-messages'
import { Label } from '#/components/ui/label'
import { Switch as ShadcnSwitch } from '#/components/ui/switch'

export function Switch({ label }: { label: string }) {
  const field = useFieldContext<boolean>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShadcnSwitch
          id={label}
          onBlur={field.handleBlur}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked)}
        />
        <Label htmlFor={label}>{label}</Label>
      </div>
      {field.state.meta.isTouched && <FormErrorMessages errors={errors} />}
    </div>
  )
}
