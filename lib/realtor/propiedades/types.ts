export type PropType = "condominio" | "casa" | "townhouse" | "terreno";
export type PropStatus = "activa" | "en_contrato" | "vendida" | "retirada";
/** Etapas del pipeline de captación DL10A (ola 2). */
export type Stage = "acquire" | "cma" | "agreement" | "prepare_publish" | "marketing_showings" | "offers" | "contract_contingencies" | "closing";
export type Currency = "USD" | "DOP";

export const TYPES: readonly PropType[] = ["condominio", "casa", "townhouse", "terreno"];
export const STATUSES: readonly PropStatus[] = ["activa", "en_contrato", "vendida", "retirada"];
export const STAGES: readonly Stage[] = ["acquire", "cma", "agreement", "prepare_publish", "marketing_showings", "offers", "contract_contingencies", "closing"];

export type Unit = { label: string; beds: number; baths: number };
export type Property = {
  id: string;
  address: string;
  type: PropType;
  status: PropStatus;
  stage: Stage;
  price: { amount: number; currency: Currency };
  units: readonly Unit[];
};

/** Fair Housing: solo tipo, estado y etapa. Nada del barrio ni de clase protegida. */
export type PropFilters = { type: PropType | "todos"; status: PropStatus | "todos"; stage: Stage | "todos" };
export const NO_FILTERS: PropFilters = { type: "todos", status: "todos", stage: "todos" };
