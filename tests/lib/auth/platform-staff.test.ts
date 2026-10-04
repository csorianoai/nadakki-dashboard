import { esPersonalDePlataforma } from "@/lib/auth/platform-staff";

describe("esPersonalDePlataforma", () => {
  test("platform_superadmin es personal de plataforma", () => {
    expect(esPersonalDePlataforma([{ core_name: "platform", role_key: "platform_superadmin" }])).toBe(true);
  });

  test("support_agent del core platform es personal de plataforma", () => {
    expect(esPersonalDePlataforma([{ core_name: "platform", role_key: "support_agent" }])).toBe(true);
  });

  test("tenant_admin NO es personal de plataforma (el hallazgo de cajamapaal)", () => {
    expect(esPersonalDePlataforma([{ core_name: "platform", role_key: "tenant_admin" }])).toBe(false);
    expect(esPersonalDePlataforma([{ core_name: "autos", role_key: "tenant_admin" }])).toBe(false);
  });

  test("support_agent de otro core NO es personal de plataforma", () => {
    expect(esPersonalDePlataforma([{ core_name: "credit", role_key: "support_agent" }])).toBe(false);
  });

  test("roles de tenant como dealer no conceden nada", () => {
    expect(esPersonalDePlataforma([{ core_name: "autos", role_key: "dealer" }])).toBe(false);
  });

  test("fail-closed sin roles", () => {
    expect(esPersonalDePlataforma([])).toBe(false);
    expect(esPersonalDePlataforma(null)).toBe(false);
    expect(esPersonalDePlataforma(undefined)).toBe(false);
  });

  test("basta con un rol de plataforma entre varios", () => {
    expect(
      esPersonalDePlataforma([
        { core_name: "autos", role_key: "tenant_admin" },
        { core_name: "platform", role_key: "platform_superadmin" },
      ]),
    ).toBe(true);
  });
});
