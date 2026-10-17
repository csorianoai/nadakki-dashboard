import React from "react";
import { TextDecoder, TextEncoder } from "util";
import "@testing-library/jest-dom";

Object.assign(global, { TextEncoder, TextDecoder });

// jsdom no expone crypto.subtle (sha256Hex del asistente, hashes de consentimiento): se toma el de Node.
if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { webcrypto } = require("crypto") as typeof import("crypto");
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
}

/**
 * Las rutas de API son codigo de servidor y se prueban con
 * `@jest-environment node`, donde no hay `Element`. Este setup corre en TODAS
 * las suites (`setupFilesAfterEach`), asi que sin la guarda una sola linea de
 * DOM impedia escribir cualquier test de un route handler.
 */
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = jest.fn();
}

// useTenantConfig exige AuthProvider y QueryClientProvider (marca del tenant); las suites de vistas aisladas
// no los montan. Por defecto devuelve el config por defecto; una suite que lo necesita real o distinto lo
// redefine con su propio jest.mock (el del fichero de test prevalece sobre este).
jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => {
  const actual = jest.requireActual("@/lib/credit-hub/hooks/useTenantConfig");
  return {
    __esModule: true,
    ...actual,
    useTenantConfig: () => ({
      tenantConfig: actual.getDefaultTenantBankingConfig("tenant-no-disponible"),
      loading: false,
    }),
  };
});

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "mock-markdown" }, children),
}));

jest.mock("remark-gfm", () => ({
  __esModule: true,
  default: () => () => {},
}));

jest.mock("recharts", () => {
  const React = require("react");
  return {
    ResponsiveContainer: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "recharts-container" }, children),
    BarChart: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "recharts-bar-chart" }, children),
    LineChart: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "recharts-line-chart" }, children),
    ScatterChart: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "recharts-scatter-chart" }, children),
    Scatter: ({
      data,
    }: {
      data?: { amountBucket?: string; riskBucket?: string; volume?: number }[];
    }) =>
      React.createElement(
        "ul",
        { "data-testid": "risk-heatmap-points" },
        (data ?? []).map((cell, idx) =>
          React.createElement(
            "li",
            {
              key: `${cell.amountBucket ?? "a"}-${cell.riskBucket ?? "r"}-${idx}`,
              "data-volume": cell.volume,
            },
            `${cell.amountBucket}×${cell.riskBucket}`,
          ),
        ),
      ),
    Rectangle: () => null,
    ZAxis: () => null,
    PieChart: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", null, children),
    Bar: () => null,
    Line: () => null,
    Legend: () => null,
    Pie: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", null, children),
    Cell: () => null,
    CartesianGrid: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    AreaChart: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "recharts-area-chart" }, children),
    Area: () => null,
  };
});
