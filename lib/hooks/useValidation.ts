import { useState, useCallback, useMemo } from "react";

// Tipos de validación
export type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
};

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule;
};

export type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

// Hook principal de validación
export function useValidation<T extends Record<string, any>>(
  schema: ValidationSchema<T>
) {
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<Set<keyof T>>(new Set());

  const validateField = useCallback((field: keyof T, value: any): string | null => {
    const rules = schema[field];
    if (!rules) return null;

    if (rules.required && (!value || (typeof value === "string" && !value.trim()))) {
      return "Este campo es requerido";
    }

    if (typeof value === "string") {
      if (rules.minLength && value.length < rules.minLength) {
        return `Minimo ${rules.minLength} caracteres`;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return `Maximo ${rules.maxLength} caracteres`;
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        return "Formato invalido";
      }
    }

    if (typeof value === "number") {
      if (rules.min !== undefined && value < rules.min) {
        return `Valor minimo: ${rules.min}`;
      }
      if (rules.max !== undefined && value > rules.max) {
        return `Valor maximo: ${rules.max}`;
      }
    }

    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [schema]);

  const validate = useCallback((data: Partial<T>): boolean => {
    const newErrors: ValidationErrors<T> = {};
    let isValid = true;

    for (const key of Object.keys(schema) as Array<keyof T>) {
      const error = validateField(key, data[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [schema, validateField]);

  const validateSingle = useCallback((field: keyof T, value: any) => {
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
    setTouched(prev => new Set(prev).add(field));
    return !error;
  }, [validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched(new Set());
  }, []);

  const hasErrors = useMemo(() => Object.keys(errors).some(k => errors[k as keyof T]), [errors]);

  return {
    errors,
    touched,
    validate,
    validateSingle,
    clearErrors,
    hasErrors,
    isFieldValid: (field: keyof T) => !errors[field],
    getFieldError: (field: keyof T) => touched.has(field) ? errors[field] : undefined
  };
}

// Hook para formularios con estado
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  schema: ValidationSchema<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const validation = useValidation<T>(schema);

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    validation.validateSingle(field, value);
  }, [validation]);

  const handleSubmit = useCallback((onSubmit: (data: T) => void) => {
    return (e?: React.FormEvent) => {
      e?.preventDefault();
      if (validation.validate(values)) {
        onSubmit(values);
      }
    };
  }, [values, validation]);

  const reset = useCallback(() => {
    setValues(initialValues);
    validation.clearErrors();
  }, [initialValues, validation]);

  return {
    values,
    setValues,
    handleChange,
    handleSubmit,
    reset,
    ...validation
  };
}

// Validaciones predefinidas comunes
export const commonValidations = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  phone: {
    pattern: /^\+?[\d\s-]{10,}$/,
  },
  url: {
    pattern: /^https?:\/\/.+/,
  },
  percentage: {
    min: 0,
    max: 100,
  },
  positiveNumber: {
    min: 0,
  },
  nonEmpty: {
    required: true,
    minLength: 1,
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
};
