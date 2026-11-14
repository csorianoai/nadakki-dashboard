/** Forma de un contacto tal como lo devuelve /api/v1/autos/contacts (DNI/CUIT enmascarados salvo rol con autos.pii.view_clear). */
export type Contacto = {
  id: string;
  kind: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  dni: string | null;
  cuit: string | null;
  iva_condition: string | null;
  iibb_number: string | null;
  marital_status: string | null;
  spouse_first_name: string | null;
  spouse_last_name: string | null;
  spouse_dni: string | null;
  deactivated_at: string | null;
  deactivation_reason: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ContactoPayload = Record<string, string | boolean | undefined>;

/** Punto de contacto de /contacts/{id}/points (F4D-2). `value` llega enmascarado salvo rol con autos.pii.view_clear. */
export type Punto = {
  id: string;
  contact_id: string;
  type: "phone" | "mobile" | "email" | "address" | string;
  value: string | null;
  street: string | null;
  locality: string | null;
  province: string | null;
  postal_code: string | null;
  is_primary: boolean;
  deactivated_at: string | null;
  created_at: string | null;
};

/** Lo que el formulario entrega por cada punto escrito; `id` presente = el punto ya existe (PATCH). */
export type PuntoEscrito = {
  type: string;
  id?: string;
  value?: string;
  street?: string;
  locality?: string;
  province?: string;
  postal_code?: string;
};
