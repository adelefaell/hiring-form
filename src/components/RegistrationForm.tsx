import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Turnstile } from '@marsidev/react-turnstile'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import PhoneInput from 'react-phone-number-input/input'
import 'react-phone-number-input/style.css'
import { ChevronDown, Loader2 } from 'lucide-react'
import { formSchema, type FormInputValues, type FormValues } from '../shared/schema'
import { WORKSHOP_IDS } from '../shared/workshops'
import { submitForm } from '../lib/api'
import { Field } from './Field'

const inputClass =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'

const inputErrorClass = ' border-red-500 focus:border-red-500 focus:ring-red-500'

function translateError(t: (key: string) => string, message: string | undefined): string | undefined {
  return message ? t(message) : undefined
}

const COUNTRY_FLAGS: Record<'AE' | 'SA', string> = { AE: '🇦🇪', SA: '🇸🇦' }

function CountryFlag({ id }: { id: 'AE' | 'SA' }) {
  return (
    <span className="text-base" role="img" aria-label={`${id} flag`}>
      {COUNTRY_FLAGS[id]}
    </span>
  )
}

const today = new Date().toISOString().slice(0, 10)

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '0x4AAAAAAFoUsjFtVMwRyFb8'

export function RegistrationForm() {
  const { t, i18n } = useTranslation()
  const [country, setCountry] = useState<'AE' | 'SA'>('AE')
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [widgetNonce, setWidgetNonce] = useState(0)

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormInputValues, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      dob: '2001-01-01',
      phone: '',
      workshop: '',
      address: '',
      email: '',
      website: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFeedback(null)
    const result = await submitForm(values, token ?? '')
    // tokens are single-use; remount clears the widget so a retry re-verifies
    setWidgetNonce((n) => n + 1)
    setToken(null)
    if (result.status === 'success') {
      for (const key of Object.keys(values) as Array<keyof FormInputValues>) {
        setValue(key, '')
      }
      clearErrors()
      setFeedback({ kind: 'success', message: t('success.message') })
      return
    }
    if (result.status === 'validation') {
      for (const [field, key] of Object.entries(result.errors)) {
        if (field === '_form') {
          setFeedback({ kind: 'error', message: t(key) })
        } else if (field in values) {
          setError(field as keyof FormInputValues, { message: t(key) })
        }
      }
      return
    }
    setFeedback({ kind: 'error', message: t('errors.banner') })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {feedback && (
        <p
          role="alert"
          className={`rounded-lg border px-3 py-2 text-sm ${feedback.kind === 'success'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-red-200 bg-red-50 text-red-600'
            }`}
        >
          {feedback.message}
        </p>
      )}

      <Field id="name" label={t('labels.name')} error={translateError(t, errors.name?.message)}>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder={t('placeholders.name')}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={`${inputClass}${errors.name ? inputErrorClass : ''}`}
          {...register('name')}
        />
      </Field>

      <Field id="dob" label={t('labels.dob')} error={translateError(t, errors.dob?.message)}>
        <input
          id="dob"
          type="date"
          autoComplete="bday"
          max={today}
          aria-invalid={errors.dob ? true : undefined}
          aria-describedby={errors.dob ? 'dob-error' : undefined}
          className={`${inputClass}${errors.dob ? inputErrorClass : ''}`}
          {...register('dob')}
        />
      </Field>

      <Field id="phone" label={t('labels.phone')} error={translateError(t, errors.phone?.message)}>
        <div role="radiogroup" aria-label={t('labels.country')} className="mb-2 grid grid-cols-2 gap-2">
          {(['AE', 'SA'] as const).map((id) => (
            <label
              key={id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors focus-within:ring-2 focus-within:ring-indigo-500 ${
                country === id
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="country"
                value={id}
                checked={country === id}
                onChange={() => {
                  setCountry(id)
                  setValue('phone', '')
                  clearErrors('phone')
                }}
                className="size-4 accent-indigo-600"
              />
              <CountryFlag id={id} />
              {t(`countries.${id}`)}
            </label>
          ))}
        </div>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              id="phone"
              country={country}
              international
              withCountryCallingCode
              value={field.value}
              onChange={(value) => field.onChange(value ?? '')}
              onBlur={field.onBlur}
              dir="ltr"
              autoComplete="tel"
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
              className={`h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm transition-shadow focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500${errors.phone ? inputErrorClass : ''}`}
            />
          )}
        />
      </Field>

      <Field id="workshop" label={t('labels.workshop')} error={translateError(t, errors.workshop?.message)}>
        <div className="relative">
          <select
            id="workshop"
            defaultValue=""
            aria-invalid={errors.workshop ? true : undefined}
            aria-describedby={errors.workshop ? 'workshop-error' : undefined}
            className={`${inputClass} appearance-none pe-9${errors.workshop ? inputErrorClass : ''}`}
            {...register('workshop')}
          >
            <option value="" disabled>
              {t('placeholders.workshop')}
            </option>
            {WORKSHOP_IDS.map((id) => (
              <option key={id} value={id}>
                {t(`workshops.${id}`)}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>
      </Field>

      <Field id="address" label={t('labels.address')} error={translateError(t, errors.address?.message)}>
        <textarea
          id="address"
          rows={3}
          autoComplete="street-address"
          placeholder={t('placeholders.address')}
          aria-invalid={errors.address ? true : undefined}
          aria-describedby={errors.address ? 'address-error' : undefined}
          className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500${errors.address ? inputErrorClass : ''}`}
          {...register('address')}
        />
      </Field>

      <Field
        id="email"
        label={
          <>
            {t('labels.email')}{' '}
            <span className="font-normal text-slate-400">{t('optional')}</span>
          </>
        }
        error={translateError(t, errors.email?.message)}
      >
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t('placeholders.email')}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={`${inputClass}${errors.email ? inputErrorClass : ''}`}
          {...register('email')}
        />
      </Field>

      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        {...register('website')}
      />

      {siteKey && (
        <div className="min-h-[65px]">
          <Turnstile
            key={widgetNonce}
            siteKey={siteKey}
            options={{ language: i18n.language, theme: 'light' }}
            onSuccess={setToken}
            onExpire={() => setToken(null)}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={siteKey ? !token || isSubmitting : isSubmitting}
        className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {isSubmitting ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}
