import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { TextField } from '#/components/demo/text-field'
import { SubscribeButton } from '#/components/demo/subscribe-button'
import { formContext, fieldContext } from '#/hooks/demo.form-context'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/components/ui/card'
import { useMutation } from '@tanstack/react-query'
import { apiPost } from '#/lib/api'

export const Route = createFileRoute('/login')({
  component: LoginComponent,
})

import { useAuth } from '../hooks/use-auth.tsx'

function LoginComponent() {
  const navigate = useNavigate()
  const { login, user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user) {
      navigate({ to: '/', replace: true })
    }
  }, [isLoading, navigate, user])

  const loginMutation = useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      return apiPost('/api/v1/auth/login', values)
    },
    onSuccess: (data) => {
      login(data.data)
      navigate({ to: '/' })
    },
  })

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await loginMutation.mutateAsync(value)
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
          <CardTitle className="font-display text-2xl font-bold tracking-tight">Sign in</CardTitle>

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
              {loginMutation.isError && (
                <div className="text-red-500 text-sm font-medium">
                  {loginMutation.error.message}
                </div>
              )}
              <SubscribeButton label="Sign In" />
            </form>
          </formContext.Provider>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
