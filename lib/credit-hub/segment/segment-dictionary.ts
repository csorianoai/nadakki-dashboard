/**
 * LATAM segment dictionary for future segmented analytics (ROADMAP backend).
 * Fields are optional/additive in the wizard payload.
 */
export const SEGMENT_DICTIONARY = {
  employment_type: [
    { value: "asalariado", label: "Asalariado privado" },
    { value: "gobierno", label: "Sector público" },
    { value: "independiente", label: "Independiente / cuenta propia" },
    { value: "empresario", label: "Empresario / dueño de negocio" },
    { value: "jubilado", label: "Jubilado / pensionado" },
  ],
  zone: [
    { value: "urbano", label: "Urbano" },
    { value: "periurbano", label: "Periurbano" },
    { value: "rural", label: "Rural" },
  ],
  vehicle_type: [
    { value: "sedan", label: "Sedán / compacto" },
    { value: "suv", label: "SUV / crossover" },
    { value: "pickup", label: "Pick-up" },
    { value: "comercial", label: "Comercial / furgoneta" },
    { value: "moto", label: "Motocicleta" },
  ],
} as const;
