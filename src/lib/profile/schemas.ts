import { z } from "zod";

const optionalUrlSchema = z
  .union([z.literal(""), z.string().trim().url("La URL del avatar no es valida.")])
  .transform((value) => value || undefined);

const optionalBioSchema = z
  .string()
  .trim()
  .max(280, "La bio no puede superar los 280 caracteres.")
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined);

export const playerProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "El nombre visible debe tener al menos 2 caracteres.")
    .max(48, "El nombre visible no puede superar los 48 caracteres."),
  avatarUrl: optionalUrlSchema,
  bio: optionalBioSchema,
  city: z
    .string()
    .trim()
    .min(2, "La ubicacion habitual debe tener al menos 2 caracteres.")
    .max(80, "La ubicacion habitual no puede superar los 80 caracteres."),
  preferredLeagueId: z
    .string()
    .trim()
    .min(1, "Selecciona tu zona preferida."),
});

export type PlayerProfileInput = z.infer<typeof playerProfileSchema>;
