import { z } from 'zod'

export const registerPassengerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .max(100, 'El nombre no puede superar 100 caracteres.')
    .regex(/^\p{L}[\p{L} .'-]*$/u, 'Solo letras, espacios, puntos, apóstrofes y guiones.'),
  documentNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{5,20}$/, 'Entre 5 y 20 caracteres alfanuméricos, sin espacios.'),
})
