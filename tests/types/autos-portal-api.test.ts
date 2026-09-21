/**
 * Contract gate: truncated openapi.json must fail, and dashboard-called
 * routes must exist in the spec. Runtime imports keep Jest --changedSince
 * tied to openapi.json and types/autos-portal-api.d.ts.
 */
import fs from "fs";
import path from "path";
import { ACCESS_ENDPOINTS } from "@/lib/access/client";
import { CAMPAIGNS_API, MARKETING_ENDPOINTS } from "@/lib/api/endpoints";
import type { paths as OpenApiPaths } from "@/types/autos-portal-api";

// Jest --changedSince follows require() of the contract files this test guards.
require("../../openapi.json");
require("../../types/autos-portal-api.d.ts");

const ROOT = path.resolve(__dirname, "../..");
const OPENAPI_JSON = path.join(ROOT, "openapi.json");
const GENERATED_TYPES = path.join(ROOT, "types/autos-portal-api.d.ts");

const PLACEHOLDER = "__contract_id__";

type OpenApiDoc = { paths?: Record<string, unknown> };

function loadOpenApi(): OpenApiDoc {
  const raw = fs.readFileSync(OPENAPI_JSON, "utf8");
  try {
    return JSON.parse(raw) as OpenApiDoc;
  } catch (err) {
    throw new Error(
      `openapi.json does not parse (truncated?): ${(err as Error).message}`,
    );
  }
}

function stripQuery(p: string): string {
  const cut = p.indexOf("?");
  return cut === -1 ? p : p.slice(0, cut);
}

function backendCandidates(dashboardPath: string): string[] {
  const base = stripQuery(dashboardPath);
  const out = new Set<string>([base]);
  if (base.startsWith("/api/legal/")) {
    out.add(`/api/v1/legal/${base.slice("/api/legal/".length)}`);
  }
  if (base === "/api/marketing/campaigns/launch-pilot") {
    out.add("/marketing/campaigns/launch-pilot");
  }
  if (base.startsWith("/api/campaigns/")) {
    out.add(`/campaigns/${base.slice("/api/campaigns/".length)}`);
  }
  return [...out];
}

function segmentMatches(specSeg: string, calledSeg: string): boolean {
  if (specSeg.startsWith("{") && specSeg.endsWith("}")) return true;
  if (calledSeg === PLACEHOLDER) return true;
  return specSeg === calledSeg;
}

function pathInContract(specPaths: string[], dashboardPath: string): boolean {
  for (const candidate of backendCandidates(dashboardPath)) {
    if (specPaths.includes(candidate)) return true;
    const calledSegs = candidate.split("/").filter(Boolean);
    for (const spec of specPaths) {
      const specSegs = spec.split("/").filter(Boolean);
      if (specSegs.length !== calledSegs.length) continue;
      if (specSegs.every((seg, i) => segmentMatches(seg, calledSegs[i]))) {
        return true;
      }
    }
  }
  return false;
}

function templatizeLiteral(raw: string): string {
  return raw
    .replace(/\$\{encodeURIComponent\([^}]+\)\}/g, PLACEHOLDER)
    .replace(/\$\{LEGAL_PREFIX\}/g, "/api/legal")
    .replace(/\$\{HEARINGS_BASE\}/g, "/api/v1/legal/hearings")
    .replace(/\$\{CONTABLE_BASE\}/g, "/api/v1/contable")
    .replace(/\$\{marketingPath\}/g, "/api/marketing")
    .replace(/\$\{(?:buildQuery|qs|q|params)[^}]*\}/g, "")
    .replace(/\$\{[^}]+\}/g, PLACEHOLDER);
}

function extractBacktickApiPaths(source: string): string[] {
  const out: string[] = [];
  const re = /`([^`]+)`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const filled = templatizeLiteral(m[1]);
    if (filled.startsWith("/api/") || filled.startsWith("/api/v1/")) {
      out.push(stripQuery(filled));
    }
  }
  return out;
}

function extractQuotedApiPaths(source: string): string[] {
  const out: string[] = [];
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("*") || trimmed.startsWith("//") || trimmed.startsWith("/*")) {
      continue;
    }
    const re = /["'](\/api\/[^"'?]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      out.push(stripQuery(m[1]));
    }
  }
  return out;
}

function extractContableSuffixes(source: string): string[] {
  const out: string[] = [];
  const re = /contableFetch(?:<[^>]+>)?\(\s*tenantId,\s*`([^`]+)`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const suffix = templatizeLiteral(m[1]);
    const rel = suffix.startsWith("/") ? suffix : `/${suffix}`;
    out.push(stripQuery(`/api/v1/contable${rel}`));
  }
  return out;
}

function unique(paths: string[]): string[] {
  return [...new Set(paths.filter(Boolean))];
}

function isCallableRoute(p: string): boolean {
  if (!p.startsWith("/api/") || p.includes("${") || p.includes("*")) return false;
  const segs = p.split("/").filter(Boolean);
  if (segs[1] === "v1") return segs.length >= 4;
  return segs.length >= 3;
}

function marketingClientPaths(): string[] {
  return [
    MARKETING_ENDPOINTS.AGENTS,
    MARKETING_ENDPOINTS.CAMPAIGNS,
    MARKETING_ENDPOINTS.CAMPAIGN_BY_ID(PLACEHOLDER),
    MARKETING_ENDPOINTS.CAMPAIGN_EXECUTE(PLACEHOLDER),
    MARKETING_ENDPOINTS.SEGMENTS,
    MARKETING_ENDPOINTS.TEMPLATES,
    MARKETING_ENDPOINTS.CAMPAIGN_LAUNCH_PILOT,
    MARKETING_ENDPOINTS.JOURNEYS,
    MARKETING_ENDPOINTS.JOURNEY_BY_ID(PLACEHOLDER),
    MARKETING_ENDPOINTS.JOURNEY_ACTIVATE(PLACEHOLDER),
    MARKETING_ENDPOINTS.JOURNEY_PAUSE(PLACEHOLDER),
    MARKETING_ENDPOINTS.JOURNEY_RUN(PLACEHOLDER),
    MARKETING_ENDPOINTS.JOURNEY_RUNS(PLACEHOLDER),
    CAMPAIGNS_API.ACTIVATE(PLACEHOLDER),
  ].map(stripQuery);
}

function dashboardCalledPaths(): string[] {
  const legalSources = [
    "lib/legal-api.ts",
    "lib/legal/hearings/hearings-api.ts",
    "lib/legal/cases/legal-cases-api.ts",
  ].map((rel) => fs.readFileSync(path.join(ROOT, rel), "utf8"));
  const contableSource = fs.readFileSync(path.join(ROOT, "app/hooks/contable.ts"), "utf8");

  return unique([
    ...Object.values(ACCESS_ENDPOINTS),
    ...marketingClientPaths(),
    ...legalSources.flatMap((src) => [
      ...extractQuotedApiPaths(src),
      ...extractBacktickApiPaths(src),
    ]),
    ...extractContableSuffixes(contableSource),
    ...extractQuotedApiPaths(contableSource),
  ]).filter(isCallableRoute);
}

describe("production OpenAPI contract", () => {
  const spec: OpenApiDoc = loadOpenApi();
  const specPaths = Object.keys(spec.paths ?? {});
  const called = dashboardCalledPaths();

  test("openapi.json parses and has at least 900 paths", () => {
    expect(specPaths.length).toBeGreaterThanOrEqual(900);
  });

  test("generated types file is present and non-empty", () => {
    const typesBody = fs.readFileSync(GENERATED_TYPES, "utf8");
    expect(typesBody.includes("export interface paths")).toBe(true);
    expect(typesBody.length).toBeGreaterThan(1000);
    const keepGenerated: OpenApiPaths | undefined = undefined;
    expect(keepGenerated).toBeUndefined();
  });

  test("dashboard-called routes exist in the contract", () => {
    const missing = called.filter((route) => !pathInContract(specPaths, route));
    const verified = called.length - missing.length;
    process.stdout.write(
      `RUTAS_VERIFICADAS=${verified} RUTAS_AUSENTES=${missing.length ? missing.join(", ") : "NINGUNA"}\n`,
    );
    if (missing.length) {
      throw new Error(
        `Dashboard routes missing from openapi.json: ${missing.join(", ")}`,
      );
    }
    expect(called.length).toBeGreaterThan(0);
  });
});
