import { useStore } from '@tanstack/react-form'
import { useFieldContext } from '#/hooks/demo.form-context'
import { FormErrorMessages } from '#/components/demo/form-error-messages'
import { Label } from '#/components/ui/label'
import { Slider as ShadcnSlider } from '#/components/ui/slider'

export function Slider({ label }: { label: string }) {
  const field = useFieldContext<number>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <ShadcnSlider
        id={label}
        onBlur={field.handleBlur}
        value={[field.state.value]}
        onValueChange={(value) => field.handleChange(value[0])}
      />
      {field.state.meta.isTouched && <FormErrorMessages errors={errors} />}
    </div>
  )
}
