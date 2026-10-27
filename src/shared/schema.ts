import { z } from 'zod'
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js/min'
import { WORKSHOP_IDS, type WorkshopId } from './workshops'

function ageFromDob(dob: string): number | null {
  const [y, m, d] = dob.split('-').map(Number)
  const birth = new Date(y, m - 1, d)
  if (!y || !m || !d || birth.getMonth() !== m - 1) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export const formSchema = z.object({
  name: z.string()
    .trim()
    .refine((v) => v !== '', { message: 'validation.name.required' })
    .refine((v) => v.length >= 3, { message: 'validation.name.min' })
    .refine((v) => v.length <= 100, { message: 'validation.name.max' }),
  dob: z.string()
    .refine((v) => v !== '', { message: 'validation.dob.required' })
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), { message: 'validation.dob.invalid' })
    .refine((v) => {
      const age = ageFromDob(v)
      return age !== null && age >= 18 && age <= 60
    }, { message: 'validation.dob.range' }),
  phone: z.string()
    .refine((v) => v !== '', { message: 'validation.phone.required' })
    .refine((v) => isValidPhoneNumber(v), { message: 'validation.phone.invalid' })
    .refine((v) => {
      const parsed = parsePhoneNumber(v)
      return parsed?.country === 'AE' || parsed?.country === 'SA'
    }, { message: 'validation.phone.country' }),
  workshop: z.string()
    .refine((v): v is WorkshopId => WORKSHOP_IDS.includes(v as WorkshopId), {
      message: 'validation.workshop.required',
    }),
  address: z.string()
    .trim()
    .refine((v) => v !== '', { message: 'validation.address.required' })
    .refine((v) => v.length <= 200, { message: 'validation.address.max' }),
  email: z.string()
    .trim()
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : v))
    .pipe(z.email({ message: 'validation.email.invalid' }).optional()),
  website: z.string().max(0, { message: 'validation.website' }),
})

export type FormValues = z.infer<typeof formSchema>
export type FormInputValues = z.input<typeof formSchema>