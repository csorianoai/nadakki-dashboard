/** Mock concierge keyword routing — README §8.4 */

export type ConciergeReply = {
  text: string;
  recId?: number;
};

export function matchConciergeReply(input: string): ConciergeReply {
  const q = input.toLowerCase();

  if (/uber|econ|barat/.test(q)) {
    return {
      text: "Para uso diario económico te recomiendo este Toyota Corolla. Bajo consumo y cuota accesible.",
      recId: 1,
    };
  }
  if (/premium|lujo|bmw|merc/.test(q)) {
    return {
      text: "Para un perfil premium, este Mercedes-Benz GLC 300 combina lujo y cuota competitiva.",
      recId: 9,
    };
  }
  if (/familia|suv|yipeta/.test(q)) {
    return {
      text: "Te recomiendo este Kia Sportage. Ideal para familia con cuota compatible.",
      recId: 4,
    };
  }

  return {
    text: "Basado en tu búsqueda, este Hyundai Tucson ofrece excelente relación precio-equipo.",
    recId: 3,
  };
}

export const SEED_MESSAGES = [
  {
    role: "bot" as const,
    text: "¡Hola! Soy tu Concierge AI. ¿Qué vehículo buscas?",
  },
  {
    role: "user" as const,
    text: "jeepeta familiar, no más de 28 mil/mes",
  },
  {
    role: "bot" as const,
    text: "Te recomiendo este Kia Sportage. Ideal para familia con cuota compatible.",
    recId: 4,
  },
];
