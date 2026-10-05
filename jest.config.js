const path = require("path");

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>"],
  testMatch: [
    "**/tests/**/*.test.[jt]s?(x)",
    "**/__tests__/legal/**/*.test.[jt]s?(x)",
    "**/__tests__/app/**/*.test.[jt]s?(x)",
  ],
  modulePathIgnorePatterns: ["<rootDir>/legacy/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^next/font/local$": "<rootDir>/tests/__mocks__/nextFontLocal.js",
    "^react-pdf/dist/.*\\.css$": "<rootDir>/tests/__mocks__/styleMockEmpty.js",
  },
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
