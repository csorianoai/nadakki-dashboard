import { BankApplicationAuthError } from "@/lib/bank-application-detail/errors";
import {
  buildBankApplicationDetailHeaders,
  readBankApplicationAuthToken,
} from "@/lib/bank-application-detail/fetch-detail";

export async function claimBankApplication(applicationId: string, analystId: string, signal?: AbortSignal): Promise<Response> {
  const token = readBankApplicationAuthToken();
  if (!token) throw new BankApplicationAuthError();

  const url = `/api/v2/credit/applications/${encodeURIComponent(applicationId)}/claim`;
  return fetch(url, {
    method: "POST",
    headers: {
      ...buildBankApplicationDetailHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ analyst_id: analystId }),
    credentials: "include",
    cache: "no-store",
    signal,
  });
}
