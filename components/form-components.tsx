/**
 * Reusable Form Components and Hooks
 * These components abstract common form patterns and reduce duplication
 */

"use client";

import type { ReactNode } from "react";
import { useState, useCallback } from "react";
import {
  useForm,
  type UseFormProps,
  type FieldValues,
  type DefaultValues,
  type SubmitHandler,
  Controller,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodSchema } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ============================================================================
// FORM HOOKS
// ============================================================================

/**
 * useValidatedForm - Wraps useForm with Zod schema validation
 * Provides automatic validation and error handling
 */
export function useValidatedForm<T extends FieldValues>(
  schema: ZodSchema,
  defaultValues?: DefaultValues<T>
) {
  return useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur",
  });
}

/**
 * useFormSubmit - Abstracts common form submission logic
 * Handles loading states, error handling, and toast notifications
 */
export function useFormSubmit<T extends FieldValues>(onSubmit: (data: T) => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = useCallback(
    async (data: T) => {
      try {
        setIsLoading(true);
        await onSubmit(data);
        toast({
          title: "Éxito",
          description: "La operación se completó correctamente",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Ocurrió un error";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [onSubmit, toast]
  );

  return { isLoading, handleSubmit };
}

// ============================================================================
// FORM INPUT COMPONENTS
// ============================================================================

interface FormInputProps {
  label: string;
  error?: string;
  required?: boolean;
  [key: string]: unknown;
}

/**
 * FormInput - Reusable text input with validation error display
 */
export function FormInput({ label, error, required, ...props }: FormInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id as string}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        {...props}
        className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
      />
      {error && (
        <p id={`${props.id}-error`} className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}

interface FormTextareaProps {
  label: string;
  error?: string;
  required?: boolean;
  [key: string]: unknown;
}

/**
 * FormTextarea - Reusable textarea with validation error display
 */
export function FormTextarea({ label, error, required, ...props }: FormTextareaProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id as string}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        {...props}
        className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
      />
      {error && (
        <p id={`${props.id}-error`} className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}

interface FormSelectProps {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  [key: string]: unknown;
}

/**
 * FormSelect - Reusable select component with validation error display
 */
export function FormSelect({
  label,
  options,
  error,
  required,
  value,
  onChange,
  ...props
}: FormSelectProps & {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p id={`${props.id}-error`} className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// FORM WRAPPER COMPONENT
// ============================================================================

interface FormWrapperProps<T extends FieldValues> {
  schema: ZodSchema;
  onSubmit: SubmitHandler<T>;
  defaultValues?: DefaultValues<T>;
  children: ReactNode;
  submitLabel?: string;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

/**
 * FormWrapper - Reusable form container with common structure
 * Handles form initialization, submission, and error handling
 */
export function FormWrapper<T extends FieldValues>({
  schema,
  onSubmit,
  defaultValues,
  children,
  submitLabel = "Guardar",
  isLoading = false,
  title,
  description,
}: FormWrapperProps<T>) {
  const form = useValidatedForm<T>(schema, defaultValues);

  return (
    <Card className="p-6 border border-white/10 bg-slate-950/70 shadow-2xl backdrop-blur-xl rounded-3xl">
      {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}
      {description && <p className="text-gray-400 mb-6">{description}</p>}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {children}
        <Button
          type="submit"
          disabled={isLoading || form.formState.isSubmitting}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {isLoading || form.formState.isSubmitting ? "Procesando..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}

// ============================================================================
// FORM CONTEXT FOR EASY FIELD ACCESS
// ============================================================================

/**
 * Hook to access form methods from FormWrapper
 * Usage with react-hook-form Controller component
 */
export interface FormContextValue {
  control: any;
  errors: Record<string, any>;
  register: any;
  watch: any;
  formState: any;
}

/**
 * Utility to create a field component integrated with FormWrapper
 * Example:
 * const EmailField = createFormField(FormInput);
 * <EmailField name="email" label="Email" required />
 */
export function createFormField<P extends { error?: string }>(
  Component: React.ComponentType<P>
) {
  return function FormField({
    name,
    control,
    errors,
    ...props
  }: P & {
    name: string;
    control: any;
    errors: Record<string, any>;
  }) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Component
            {...(props as unknown as P)}
            {...field}
            error={errors[name]?.message as string | undefined}
          />
        )}
      />
    );
  };
}
