/** @jest-environment jsdom */
/**
 * DASH-LEGAL L2b: el backend aplica UNA estrategia (StrategySelectRequest.strategy_id).
 * Con varias marcadas, el panel aplica la primera y lo dice; nada se descarta en silencio.
 */
import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@/lib/auth/token-storage", () => ({ tokenStorage: { getAccessToken: () => "tok" } }));
jest.mock("@/lib/auth/token-refresh", () => ({ isTokenExpiringSoon: () => false, refreshAccessToken: async () => false }));

import { CaseStrategyMultiSelect } from "@/components/legal/cases/CaseStrategyMultiSelect";
import { postStrategiesSelect } from "@/lib/legal/cases/legal-cases-api";
import type { CaseStrategy } from "@/lib/legal/cases/case-types";

const strategies = [
  { strategy_id: "s-a", strategy_type: "aggressive", title: "Estrategia agresiva" },
  { strategy_id: "s-b", strategy_type: "conservative", title: "Estrategia conservadora" },
] as unknown as CaseStrategy[];

describe("selección de estrategias", () => {
  it("con varias marcadas avisa cuál se aplica (la primera seleccionada)", () => {
    render(
      <CaseStrategyMultiSelect strategies={strategies} selectedIds={["s-b", "s-a"]} onChange={() => {}} onSubmit={() => {}} />,
    );
    expect(screen.getByTestId("strategy-single-notice")).toHaveTextContent(
      "Por ahora se aplica una sola estrategia: «Estrategia conservadora»",
    );
  });

  it("con una sola no hay aviso", () => {
    render(<CaseStrategyMultiSelect strategies={strategies} selectedIds={["s-a"]} onChange={() => {}} onSubmit={() => {}} />);
    expect(screen.queryByTestId("strategy-single-notice")).toBeNull();
  });

  it("envía un único strategy_id: el de la estrategia que nombra el aviso", async () => {
    const calls: { url: string; body: unknown }[] = [];
    global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init?.body)) });
      return { ok: true, status: 200, text: async () => "{}", json: async () => ({}) };
    }) as unknown as typeof fetch;
    await postStrategiesSelect("t1", "c1", { strategy_ids: ["s-b", "s-a"], generate_documents_immediately: true });
    expect(calls).toEqual([{ url: "/api/legal/cases/c1/strategies/select", body: { strategy_id: "s-b" } }]);
  });
});
