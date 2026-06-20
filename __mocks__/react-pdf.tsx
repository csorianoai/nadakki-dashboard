/**
 * Global Jest manual mock for `react-pdf` (PR-INFRA-1).
 *
 * Purpose: `react-pdf` (and its `pdfjs-dist` dependency) ship as ESM, which the
 * repo's `ts-jest` transform does not process for `node_modules` by default.
 * Any suite that (transitively) imports `components/bank/DocumentPreviewPane.tsx`
 * — e.g. `tests/bank-application-detail/page.test.tsx` — therefore failed to load
 * with: "SyntaxError: Cannot use import statement outside a module".
 *
 * This manual mock lives in `<rootDir>/__mocks__` so Jest applies it automatically
 * to every suite (no per-test `jest.mock("react-pdf")` needed), eliminating the
 * recurring noise. It is render-only and intentionally does NOT exercise real PDF
 * rendering; suites that need richer behavior may still override it with a local
 * `jest.mock("react-pdf", ...)` (e.g. `tests/bank/DocumentPreviewPane.test.tsx`).
 */
import * as React from "react";

interface DocumentProps {
  children?: React.ReactNode;
  onLoadSuccess?: (doc: { numPages: number }) => void;
}

export function Document({ children, onLoadSuccess }: DocumentProps): React.ReactElement {
  React.useEffect(() => {
    onLoadSuccess?.({ numPages: 1 });
  }, [onLoadSuccess]);
  return <div data-testid="react-pdf-document-mock">{children}</div>;
}

interface PageProps {
  pageNumber?: number;
  scale?: number;
  width?: number;
  rotate?: number;
}

export function Page({ pageNumber, scale, width, rotate }: PageProps): React.ReactElement {
  return (
    <div
      data-testid={`react-pdf-page-mock-${pageNumber ?? 1}`}
      data-scale={scale ?? ""}
      data-width={width ?? ""}
      data-rotate={rotate ?? ""}
    />
  );
}

export const pdfjs = {
  version: "0.0.0-mock",
  GlobalWorkerOptions: { workerSrc: "" },
};

export const Outline = (): null => null;
export const Thumbnail = (): null => null;
