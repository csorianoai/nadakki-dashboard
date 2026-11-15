/**
 * GET /api/realtor/mls/listings
 *
 * Puerta de acceso a listados MLS Bridge Interactive.
 * Solo devuelve datos en baylara.com / www.baylara.com.
 * En cualquier otro host, token ausente o fallo de Bridge → { available: false, listings: [] }.
 *
 * Contrato MIAMI:
 * - Cache-Control: no-store — sin copias fuera de esta respuesta HTTP.
 * - Sin log de datos de listados.
 * - Sin IA: este endpoint no pasa datos a ningún modelo de lenguaje.
 */
import { NextRequest, NextResponse } from "next/server";
import { isBaylaraHost } from "@/lib/realtor/mls/domain";
import { fetchBridgeListings } from "@/lib/realtor/mls/bridge-client";
import type { MlsApiResponse } from "@/lib/realtor/mls/types";

const HEADERS = { "Cache-Control": "no-store, no-cache, must-revalidate" };
const UNAVAILABLE: MlsApiResponse = { available: false, listings: [] };

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse<MlsApiResponse>> {
  if (!isBaylaraHost(req.headers.get("host"))) {
    return NextResponse.json(UNAVAILABLE, { headers: HEADERS });
  }

  const page = await fetchBridgeListings();
  if (!page || page.listings.length === 0) {
    return NextResponse.json(UNAVAILABLE, { headers: HEADERS });
  }

  const body: MlsApiResponse = {
    available: true,
    listings: page.listings,
    totalCount: page.totalCount,
    asOf: page.asOf,
  };
  return NextResponse.json(body, { headers: HEADERS });
}
