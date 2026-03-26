import { createFormHook } from '@tanstack/react-form'

import { Select } from '#/components/demo/select-field'
import { SubscribeButton } from '#/components/demo/subscribe-button'
import { TextArea } from '#/components/demo/text-area'
import { TextField } from '#/components/demo/text-field'
import { fieldContext, formContext } from './demo.form-context'

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    Select,
    TextArea,
  },
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
})
