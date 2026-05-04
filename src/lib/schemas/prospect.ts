import { z } from 'zod'

export const prospectSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  stage: z.enum(['base', 'prospeccion', 'interes', 'decision', 'cierre']),
  next_action_type: z.enum(['llamar', 'enviar_propuesta', 'agendar_reunion', 'dar_seguimiento', 'cerrar', 'recuperar', 'otro']),
  next_action_date: z.string().min(1, 'Fecha requerida'),
  contact_medium: z.enum(['whatsapp', 'llamada', 'email', 'presencial']),
  // optional
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  potential_value: z.coerce.number().min(0).optional(),
  probability: z.coerce.number().min(0).max(100).optional(),
  source: z.enum(['referido', 'networking', 'redes_sociales', 'publicidad', 'otro']).optional(),
  key_notes: z.string().optional(),
})

export type ProspectFormData = z.infer<typeof prospectSchema>
