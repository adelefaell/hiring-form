import type { FormValues } from '../shared/schema'

export type SubmitResult =
  | { status: 'success' }
  | { status: 'validation'; errors: Record<string, string> }
  | { status: 'error' }

export async function submitForm(values: FormValues, turnstileToken: string): Promise<SubmitResult> {
  let response: Response
  try {
    response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, turnstileToken }),
    })
  } catch {
    return { status: 'error' }
  }

  if (response.ok) return { status: 'success' }

  if (response.status === 400 || response.status === 409) {
    const body = (await response.json().catch(() => null)) as {
      errors?: Record<string, string>
    } | null
    return { status: 'validation', errors: body?.errors ?? {} }
  }

  return { status: 'error' }
}