import React from "react";
import { TextDecoder, TextEncoder } from "util";
import "@testing-library/jest-dom";

Object.assign(global, { TextEncoder, TextDecoder });

/**
 * Las rutas de API son codigo de servidor y se prueban con
 * `@jest-environment node`, donde no hay `Element`. Este setup corre en TODAS
 * las suites (`setupFilesAfterEach`), asi que sin la guarda una sola linea de
 * DOM impedia escribir cualquier test de un route handler.
 */
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = jest.fn();
}

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
