import legalHome from "@/messages/es/legal-home.json";

export type LegalHomeMessages = typeof legalHome;

export function useLegalHomeMessages(): LegalHomeMessages {
  return legalHome;
}
