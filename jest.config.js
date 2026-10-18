const path = require("path");

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>"],
  testMatch: [
    "**/tests/**/*.test.[jt]s?(x)",
    "**/scripts/ci/**/*.test.[jt]s?(x)",
    "**/__tests__/legal/**/*.test.[jt]s?(x)",
    "**/__tests__/app/**/*.test.[jt]s?(x)",
  ],
  modulePathIgnorePatterns: ["<rootDir>/legacy/"],
  moduleNameMapper: {
    // Las hojas de estilo van primero para que "^@/(.*)$" no las resuelva
    // como modulos JS (p. ej. import "@/styles/legal-research-papel-blanco.css").
    "\\.(css|scss|sass|less)$": "<rootDir>/tests/__mocks__/styleMockEmpty.js",
    "^@/(.*)$": "<rootDir>/$1",
    "^next/font/local$": "<rootDir>/tests/__mocks__/nextFontLocal.js",
  },
  setupFiles: ["<rootDir>/tests/jest-env.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.tsx"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
