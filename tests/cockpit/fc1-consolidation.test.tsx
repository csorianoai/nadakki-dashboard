/**
 * FC1 — Cockpit duplicity removal (Estrategia 3 cohabitation).
 */

import * as fs from "fs";
import * as path from "path";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  filterSectionsForUser,
  NAV_SECTIONS,
} from "@/components/forge/layout/forge-global-sidebar-nav";
import { CockpitSidebar } from "@/components/cockpit/CockpitSidebar";
import { UsersView } from "@/components/cockpit/users/UsersView";
import { TenantsView } from "@/components/cockpit/tenants/TenantsView";
import type { RoleInfo } from "@/lib/api/auth-v2";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "../..", relPath), "utf-8");
}

const superadminRoles: RoleInfo[] = [
  { core_name: "platform", role_key: "platform_superadmin", display_name: "Superadmin" },
];

const analystRoles: RoleInfo[] = [
  { core_name: "credit", role_key: "bank_analyst", display_name: "Analyst" },
];

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    tenant: { id: "tenant-1" },
    allRoles: superadminRoles,
    activeRole: superadminRoles[0],
  }),
}));

jest.mock("@/lib/cockpit/context", () => ({
  useCockpit: () => ({
    tenantFilter: null,
    setTenantFilter: jest.fn(),
    isPlatformSuperadmin: true,
    isTenantAdminOnly: false,
    locale: "es-DO",
    currency: "DOP",
    level: "network",
    setLevel: jest.fn(),
  }),
}));

jest.mock("@/lib/cockpit/api/observability", () => ({
  fetchNetworkHealth: jest.fn().mockResolvedValue({ data: { semaphore: "green" } }),
}));

jest.mock("@/lib/cockpit/api/tenantAdmin", () => ({
  fetchTenants: jest.fn().mockResolvedValue({
    tenants: [
      {
        id: "t-1",
        name: "Acme",
        slug: "acme",
        locale: "es-DO",
        currency: "DOP",
        status: "active",
        core_codes: ["credit"],
      },
    ],
    isDemo: false,
  }),
  toggleTenantStatus: jest.fn(),
}));

jest.mock("@/lib/cockpit/api/authUsers", () => ({
  fetchUsers: jest.fn().mockResolvedValue([
    {
      id: "u-1",
      name: "Ana",
      email: "ana@acme.test",
      role_key: "tenant_admin",
      tenant_id: "t-1",
    },
  ]),
  fetchRoles: jest.fn().mockResolvedValue([
    { role_key: "tenant_admin", display_name: "Tenant Admin" },
  ]),
}));

jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
});

describe("FC1 middleware — /cockpit/plans redirect", () => {
  const src = readSrc("middleware.ts");

  test("redirects /cockpit/plans to /admin/billing with 302 when consolidation enabled", () => {
    expect(src).toContain('pathname === "/cockpit/plans"');
    expect(src).toContain('new URL("/admin/billing", request.url), 302');
  });

  test("matcher includes /cockpit/plans", () => {
    expect(src).toContain('"/cockpit/plans"');
  });
});

describe("FC1 CockpitSidebar", () => {
  test("does not render Suscripciones y Planes when consolidation is enabled", async () => {
    render(<CockpitSidebar open={true} onToggle={jest.fn()} />);
    await waitFor(() => {
      expect(screen.queryByText("Suscripciones y Planes")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Tenants")).toBeInTheDocument();
    expect(screen.getByText("Usuarios")).toBeInTheDocument();
  });
});

describe("FC1 UsersView", () => {
  test("does not render Crear usuario button", async () => {
    render(<UsersView />);
    await waitFor(() => {
      expect(screen.getByText("Ana")).toBeInTheDocument();
    });
    expect(screen.queryByText("Crear usuario")).not.toBeInTheDocument();
  });

  test("row click shows Ver tenant en Panel admin link", async () => {
    const user = userEvent.setup();
    render(<UsersView />);
    await waitFor(() => {
      expect(screen.getByText("Ana")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("user-row-u-1"));
    const link = await screen.findByText("Ver tenant en Panel admin →");
    expect(link).toHaveAttribute("href", "/admin/tenants/t-1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute(
      "title",
      "Abre el detalle del tenant en Panel admin; desde ahí gestiona usuarios",
    );
  });
});

describe("FC1 TenantsView", () => {
  test('renders "Crear en Panel admin" instead of Nuevo tenant', async () => {
    render(<TenantsView />);
    await waitFor(() => {
      expect(screen.getByText("Acme")).toBeInTheDocument();
    });
    expect(screen.getByText("Crear en Panel admin →")).toBeInTheDocument();
    expect(screen.queryByText("Nuevo tenant")).not.toBeInTheDocument();
  });
});

describe("FC1 forge sidebar — Network Cockpit", () => {
  function findAdminPlatformItems(sections: ReturnType<typeof filterSectionsForUser>) {
    const admin = sections.find((s) => s.id === "admin");
    const platform = admin?.children?.find((c) => c.id === "adm-platform");
    return platform?.children ?? [];
  }

  test("NAV_SECTIONS registers Network Cockpit under Plataforma", () => {
    const admin = NAV_SECTIONS.find((s) => s.id === "admin");
    const platform = admin?.children?.find((c) => c.id === "adm-platform");
    const item = platform?.children?.find((c) => c.id === "adm-network-cockpit");
    expect(item).toMatchObject({
      label: "Network Cockpit",
      href: "/cockpit",
      superAdminOnly: true,
      featureFlag: "cockpit-consolidation",
    });
  });

  test("filterSectionsForUser shows Network Cockpit only for platform_superadmin", () => {
    const superFiltered = filterSectionsForUser(NAV_SECTIONS, superadminRoles, [], true);
    const superItems = findAdminPlatformItems(superFiltered);
    expect(superItems.some((i) => i.id === "adm-network-cockpit")).toBe(true);

    const analystFiltered = filterSectionsForUser(NAV_SECTIONS, analystRoles, ["credit"], true);
    const analystItems = findAdminPlatformItems(analystFiltered);
    expect(analystItems.some((i) => i.id === "adm-network-cockpit")).toBe(false);
  });
});

describe("FC1 regression — exit paths intact", () => {
  test("CockpitSidebar still renders Dashboard tenant exit link", async () => {
    render(<CockpitSidebar open={true} onToggle={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Dashboard tenant")).toBeInTheDocument();
    });
  });

  test("tenant-home helper unchanged", () => {
    const src = readSrc("lib/cockpit/tenant-home.ts");
    expect(src).toContain("getPostLoginRedirectPath");
    expect(src).toContain("getTenantDashboardHome");
  });
});

describe("FC1 regression — Vista de Red and Credit Hub routes preserved", () => {
  test("cockpit network and credit routes exist", () => {
    expect(fs.existsSync(path.resolve(__dirname, "../../app/(cockpit)/cockpit/page.tsx"))).toBe(true);
    expect(fs.existsSync(path.resolve(__dirname, "../../app/(cockpit)/cockpit/credit/page.tsx"))).toBe(true);
    expect(fs.existsSync(path.resolve(__dirname, "../../components/cockpit/network/NetworkView.tsx"))).toBe(true);
  });

  test("plans route file removed", () => {
    expect(
      fs.existsSync(path.resolve(__dirname, "../../app/(cockpit)/cockpit/plans/page.tsx")),
    ).toBe(false);
  });
});
