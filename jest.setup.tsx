import React from "react";
import "@testing-library/jest-dom";

Element.prototype.scrollIntoView = jest.fn();

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
