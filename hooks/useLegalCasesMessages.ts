import legalCases from "@/messages/es/legal-cases.json";

export type LegalCasesMessages = typeof legalCases;

export function useLegalCasesMessages(): LegalCasesMessages {
  return legalCases;
}
