/** D7-LEGIBILIDAD parte 1: /ame pinta su propio fondo oscuro (colors.bg) en todo su contenedor. */
import React from "react";
import { render } from "@testing-library/react";

jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: "t1" }) }));
jest.mock("@/hooks/useAMEStatus", () => ({
  useAMEStatus: () => ({ data: {}, source: "fallback", loading: false, error: null }),
}));
jest.mock("@/hooks/useAMERuns", () => ({
  useAMERuns: () => ({ data: { items: [], runs: [] }, source: "fallback", loading: false, error: null }),
}));

describe("/ame legibilidad", () => {
  it("el contenedor raiz pinta #0f172a con minHeight 100vh", () => {
    const Page = require("@/app/ame/page").default;
    const { container } = render(<Page />);
    const raiz = container.firstElementChild as HTMLElement;
    expect(raiz.style.background).toMatch(/#0f172a|rgb\(15, 23, 42\)/);
    expect(raiz.style.minHeight).toBe("100vh");
  });
});
