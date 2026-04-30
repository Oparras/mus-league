import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Introduce un correo valido."),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres."),
});

export const registerSchema = loginSchema
  .extend({
    displayName: z
      .string()
      .trim()
      .min(2, "El nombre visible debe tener al menos 2 caracteres.")
      .max(48, "El nombre visible no puede superar los 48 caracteres."),
    confirmPassword: z
      .string()
      .min(8, "La confirmacion de contrasena debe tener al menos 8 caracteres."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contrasenas no coinciden.",
    path: ["confirmPassword"],
  });
