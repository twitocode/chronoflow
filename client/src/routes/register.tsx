import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { TextField } from '#/components/demo/text-field'
import { SubscribeButton } from '#/components/demo/subscribe-button'
import { formContext, fieldContext } from '#/hooks/demo.form-context'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/components/ui/card'
import { useMutation } from '@tanstack/react-query'
import { apiPost } from '#/lib/api'

export const Route = createFileRoute('/register')({
  component: RegisterComponent,
})

import { useAuth } from '../hooks/use-auth.tsx'

function RegisterComponent() {
  const navigate = useNavigate()
  const { login, user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user) {
      navigate({ to: '/', replace: true })
    }
  }, [isLoading, navigate, user])

  const registerMutation = useMutation({
    mutationFn: async (values: z.infer<typeof registerSchema>) => {
      return apiPost('/api/v1/auth/signup', {
        email: values.email,
        password: values.password,
      })
    },
    onSuccess: (data) => {
      login(data.data)
      navigate({ to: '/' })
    },
  })

  const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: registerSchema,
    },
    onSubmit: async ({ value }) => {
      await registerMutation.mutateAsync(value)
    },
  })

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border/80 bg-card/90 shadow-lg backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="font-display text-2xl font-semibold tracking-tight">Create account</CardTitle>
          <CardDescription className="text-base">
            Start tracking symbols and alerts in a few seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <formContext.Provider value={form}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
              className="space-y-4"
            >
              <form.Field name="email">
                {(field) => (
                  <fieldContext.Provider value={field}>
                    <TextField label="Email" placeholder="m@example.com" />
                  </fieldContext.Provider>
                )}
              </form.Field>
              <form.Field name="password">
                {(field) => (
                  <fieldContext.Provider value={field}>
                    <TextField label="Password" type="password" />
                  </fieldContext.Provider>
                )}
              </form.Field>
              <form.Field name="confirmPassword">
                {(field) => (
                  <fieldContext.Provider value={field}>
                    <TextField label="Confirm Password" type="password" />
                  </fieldContext.Provider>
                )}
              </form.Field>
              {registerMutation.isError && (
                <div className="text-red-500 text-sm font-medium">
                  {registerMutation.error.message}
                </div>
              )}
              <SubscribeButton label="Register" />
            </form>
          </formContext.Provider>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
