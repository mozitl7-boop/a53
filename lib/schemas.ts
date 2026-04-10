import { z } from "zod";

/**
 * Centralized Zod schemas for form validation
 * Use these schemas in both frontend (react-hook-form) and backend API routes
 */

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: z
    .string()
    .email("El email debe ser válido")
    .min(5, "El email es demasiado corto"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),
  email: z
    .string()
    .email("El email debe ser válido")
    .min(5, "El email es demasiado corto"),
  tipo_usuario: z.enum(["organizador", "asistente"], {
    errorMap: () => ({ message: "Tipo de usuario inválido" }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================================================
// RESERVATION SCHEMAS
// ============================================================================

export const auditorio = z.enum(["A", "B", "C", "D"], {
  errorMap: () => ({ message: "Auditorio no válido" }),
});

export const reservaSchema = z.object({
  auditorio: auditorio,
  fecha: z
    .string()
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "La fecha no es válida" }
    ),
  horaInicio: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "La hora debe estar en formato HH:MM"),
  titulo: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(200, "El título es demasiado largo"),
  organizador: z
    .string()
    .min(2, "El nombre del organizador debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),
  organizador_email: z
    .string()
    .email("El email debe ser válido"),
  descripcion: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(1000, "La descripción es demasiado larga")
    .optional()
    .or(z.literal("")),
  asistentes: z
    .string()
    .regex(/^\d+$/, "El número de asistentes debe ser un número")
    .transform(Number)
    .refine((n) => n > 0 && n <= 500, {
      message: "El número de asistentes debe estar entre 1 y 500",
    }),
  carrera: z
    .string()
    .max(100, "La carrera es demasiado larga")
    .optional()
    .or(z.literal("")),
  presentacion: z
    .string()
    .max(500, "La información de presentación es demasiado larga")
    .optional()
    .or(z.literal("")),
});

export type ReservaInput = z.infer<typeof reservaSchema>;

// ============================================================================
// HELPER VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate and parse input data safely
 * Returns { success: true, data: parsedData } or { success: false, error: errorMessage }
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message || "Validation failed";
      return { success: false, error: message };
    }
    return { success: false, error: "Unknown validation error" };
  }
}

/**
 * Validate input and return all errors (for forms)
 */
export function validateInputDetailed<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _form: "Unknown validation error" } };
  }
}
