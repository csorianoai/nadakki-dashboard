import { z } from "zod";
import { cockpitEnvelopeSchema } from "../envelope";

/** Target contract for GET/POST/PATCH /api/v1/cockpit/registry/* (F5 backend). */
export const registryProfessionSchema = z.object({
  id: z.string().uuid(),
  core: z.string(),
  role_code: z.string().regex(/^[a-z][a-z0-9_]*$/),
  display_name: z.string().min(1).max(120),
  family: z.string().min(1).max(80),
  description: z.string().max(500).nullable(),
  sort_order: z.number().int(),
  active: z.boolean(),
});

export const registryEntityTypeSchema = z.object({
  id: z.string().uuid(),
  core: z.string(),
  entity_code: z.string().regex(/^[a-z][a-z0-9_]*$/),
  display_name: z.string().min(1).max(120),
  description: z.string().max(500).nullable(),
  sort_order: z.number().int(),
  active: z.boolean(),
});

export const registryProfessionsListDataSchema = z.object({
  core: z.string(),
  items: z.array(registryProfessionSchema),
});

export const registryEntityTypesListDataSchema = z.object({
  core: z.string(),
  items: z.array(registryEntityTypeSchema),
});

export const registryProfessionsEnvelopeSchema = cockpitEnvelopeSchema(registryProfessionsListDataSchema);
export const registryEntityTypesEnvelopeSchema = cockpitEnvelopeSchema(registryEntityTypesListDataSchema);

export type RegistryProfession = z.infer<typeof registryProfessionSchema>;
export type RegistryEntityType = z.infer<typeof registryEntityTypeSchema>;
