import { shouldLoadProjectsSidebar } from "@/components/forge/layout/proyectos-sidebar-policy";

describe("ProyectosFinanzasSidebarLinks portal boundary", () => {
  test.each([
    ["/credit-hub/dealer", false],
    ["/credit-hub/dealer/applications/new/applicant", false],
    ["/credit-hub/bank/applications", false],
    ["/proyectos", true],
    ["/proyectos/123/finanzas", true],
  ])("pathname %s => Projects Core loading %s", (pathname, expected) => {
    expect(shouldLoadProjectsSidebar(pathname)).toBe(expected);
  });

  test("does not treat a similarly named route as the Projects portal", () => {
    expect(shouldLoadProjectsSidebar("/proyectos-old")).toBe(false);
  });
});
