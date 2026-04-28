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
      React.createElement("div", null, children),
    PieChart: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", null, children),
    Bar: () => null,
    Pie: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", null, children),
    Cell: () => null,
    CartesianGrid: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
  };
});
