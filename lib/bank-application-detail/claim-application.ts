import { BankApplicationAuthError } from "@/lib/bank-application-detail/errors";
import {
  buildBankApplicationDetailHeaders,
  readBankApplicationAuthToken,
} from "@/lib/bank-application-detail/fetch-detail";
import { tokenStorage } from "@/lib/auth/token-storage";

export async function claimBankApplication(applicationId: string, analystId: string, signal?: AbortSignal): Promise<Response> {
  // Credit Hub auth fallback: try auth v2 (tokenStorage) first, then legacy localStorage
  const token = tokenStorage.getAccessToken() || readBankApplicationAuthToken();
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
