/**
 * SOC-D-CUENTAS (hito B1, C-SOCIAL-D0): rejilla marca x plataforma, ciclo de vida real, asistente sin contraseñas.
 * El backend aun no esta montado: el cliente se prueba con mocks generados del contrato.
 */
import React from "react";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import SocialCenter from "@/app/marketing/social/_components/SocialCenter";
import {
  MOCK_ACCOUNTS,
  MOCK_BRANDS,
  MOCK_CAPABILITIES,
  createMockClient,
} from "@/lib/social-center/mock";
import { PLATFORMS } from "@/lib/social-center/types";
import type { LifecycleStatus, SocialClient } from "@/lib/social-center/types";

const fail = () => Promise.resolve({ ok: false as const, status: 503 });

function clientWith(patch: Partial<SocialClient> = {}): SocialClient {
  return { ...createMockClient(), ...patch };
}

describe("rejilla marca x plataforma", () => {
  it("el mock trae 2 marcas x 5 plataformas = 10 presencias, LinkedIn incluida", () => {
    expect(MOCK_BRANDS).toHaveLength(2);
    expect(MOCK_ACCOUNTS).toHaveLength(10);
    expect([...PLATFORMS]).toEqual(["instagram", "facebook", "tiktok", "youtube", "linkedin"]);
  });

  it("muestra cinco tarjetas por marca y cambia al elegir otra marca", async () => {
    render(<SocialCenter client={clientWith()} demo lang="es" />);
    const selector = await screen.findByLabelText(/marca/i);
    for (const p of PLATFORMS) expect(await screen.findByTestId(`card-${p}`)).toBeInTheDocument();
    expect(screen.getAllByTestId(/^card-/)).toHaveLength(5);
    const firstIg = within(screen.getByTestId("card-instagram")).getByTestId("status").getAttribute("data-status");

    fireEvent.change(selector, { target: { value: MOCK_BRANDS[1].id } });
    await waitFor(() => expect(screen.getAllByTestId(/^card-/)).toHaveLength(5));
    const secondIg = within(screen.getByTestId("card-instagram")).getByTestId("status").getAttribute("data-status");
    const expected = MOCK_ACCOUNTS.find((a) => a.brand_id === MOCK_BRANDS[1].id && a.platform === "instagram")!;
    expect(secondIg).toBe(expected.status);
    expect(typeof firstIg).toBe("string");
  });

  it("cada tarjeta refleja el estado del ciclo de vida que devuelve el backend", async () => {
    const statuses: LifecycleStatus[] = ["PLANNED", "EXISTS", "CLAIMED", "PROFILE_COMPLETE", "ERROR"];
    const accounts = PLATFORMS.map((p, i) => ({
      ...MOCK_ACCOUNTS.find((a) => a.brand_id === MOCK_BRANDS[0].id && a.platform === p)!,
      status: statuses[i],
    }));
    render(<SocialCenter client={clientWith({ listAccounts: async () => ({ ok: true, data: accounts }) })} demo lang="es" />);
    for (let i = 0; i < PLATFORMS.length; i++) {
      const card = await screen.findByTestId(`card-${PLATFORMS[i]}`);
      expect(within(card).getByTestId("status")).toHaveAttribute("data-status", statuses[i]);
    }
  });

  it("CONNECTED solo aparece cuando el backend lo dice", async () => {
    const base = MOCK_ACCOUNTS.filter((a) => a.brand_id === MOCK_BRANDS[0].id).map((a) => ({
      ...a,
      status: "PROFILE_COMPLETE" as LifecycleStatus,
    }));
    const { unmount } = render(
      <SocialCenter client={clientWith({ listAccounts: async () => ({ ok: true, data: base }) })} demo lang="es" />,
    );
    await screen.findByTestId("card-instagram");
    expect(document.querySelector('[data-status="CONNECTED"]')).toBeNull();
    unmount();

    const con = base.map((a, i) => (i === 0 ? { ...a, status: "CONNECTED" as LifecycleStatus } : a));
    render(<SocialCenter client={clientWith({ listAccounts: async () => ({ ok: true, data: con }) })} demo lang="es" />);
    await screen.findByTestId("card-instagram");
    expect(document.querySelectorAll('[data-status="CONNECTED"]')).toHaveLength(1);
  });

  it("una plataforma sin ficha se muestra como sin registrar, nunca como conectada", async () => {
    render(<SocialCenter client={clientWith({ listAccounts: async () => ({ ok: true, data: [] }) })} demo lang="es" />);
    const card = await screen.findByTestId("card-linkedin");
    expect(within(card).getByTestId("status")).toHaveAttribute("data-status", "NONE");
  });
});

describe("estado vacio honesto y DEMO", () => {
  it("si el registro no responde, dice que no esta disponible y no inventa tarjetas", async () => {
    render(<SocialCenter client={clientWith({ listBrands: fail })} lang="es" />);
    expect(await screen.findByText(/Registro de cuentas no disponible todavía/)).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^card-/)).toHaveLength(0);
    expect(screen.queryByText("DEMO")).toBeNull();
  });

  it("textos en ingles", async () => {
    render(<SocialCenter client={clientWith({ listBrands: fail })} lang="en" />);
    expect(await screen.findByText(/Account registry not available yet/)).toBeInTheDocument();
  });

  it("con datos mock lleva el badge DEMO", async () => {
    render(<SocialCenter client={clientWith()} demo lang="es" />);
    await screen.findByTestId("card-instagram");
    expect(screen.getByText("DEMO")).toBeInTheDocument();
  });
});

describe("asistente de alta asistido por humano", () => {
  async function abrir(status: LifecycleStatus, platform = "instagram") {
    const accounts = MOCK_ACCOUNTS.filter((a) => a.brand_id === MOCK_BRANDS[0].id).map((a) =>
      a.platform === platform ? { ...a, status } : a,
    );
    const utils = render(
      <SocialCenter client={clientWith({ listAccounts: async () => ({ ok: true, data: accounts }) })} demo lang="es" />,
    );
    const card = await screen.findByTestId(`card-${platform}`);
    fireEvent.click(within(card).getByRole("button", { name: /asistente|continuar|alta/i }));
    return { ...utils, wizard: await screen.findByTestId("wizard") };
  }

  it.each(["PLANNED", "EXISTS", "CLAIMED", "PROFILE_COMPLETE", "CONNECTED", "ERROR"] as LifecycleStatus[])(
    "nunca muestra campo de contraseña ni codigo en %s",
    async (status) => {
      const { wizard } = await abrir(status);
      expect(wizard.querySelectorAll('input[type="password"]')).toHaveLength(0);
      for (const el of Array.from(wizard.querySelectorAll("input,textarea"))) {
        const txt = [el.getAttribute("name"), el.getAttribute("placeholder"), el.getAttribute("aria-label"), el.id]
          .join(" ")
          .toLowerCase();
        expect(txt).not.toMatch(/pass|contrase|otp|c[oó]digo|token|secret/);
      }
      expect(wizard.textContent).toMatch(/nunca (te )?pedimos contraseñas/i);
    },
  );

  it("PLANNED: enlace al registro oficial, usuario propuesto y confirmacion de existencia", async () => {
    const { wizard } = await abrir("PLANNED");
    const link = within(wizard).getByRole("link", { name: /registro oficial/i });
    expect(link.getAttribute("href")).toMatch(/^https:\/\/(www\.)?instagram\.com\//);
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(wizard.textContent).toContain(MOCK_ACCOUNTS.find((a) => a.platform === "instagram")!.proposed_handle!);
    expect(within(wizard).getByLabelText(/URL del perfil/i)).toBeInTheDocument();
    expect(within(wizard).getByLabelText(/confirmo que la cuenta existe/i)).toBeInTheDocument();
  });

  it("PLANNED: confirmar existencia manda handle, URL y evidencia con la transicion a EXISTS", async () => {
    const transition = jest.fn(async () => ({ ok: true as const, data: MOCK_ACCOUNTS[0] }));
    const update = jest.fn(async () => ({ ok: true as const, data: MOCK_ACCOUNTS[0] }));
    const accounts = MOCK_ACCOUNTS.filter((a) => a.brand_id === MOCK_BRANDS[0].id).map((a) => ({
      ...a,
      status: "PLANNED" as LifecycleStatus,
    }));
    render(
      <SocialCenter
        client={clientWith({ listAccounts: async () => ({ ok: true, data: accounts }), transition, updateAccount: update })}
        demo
        lang="es"
      />,
    );
    fireEvent.click(within(await screen.findByTestId("card-instagram")).getByRole("button", { name: /asistente|continuar|alta/i }));
    const w = await screen.findByTestId("wizard");
    fireEvent.change(within(w).getByLabelText(/URL del perfil/i), { target: { value: "https://www.instagram.com/demo_marca/" } });
    fireEvent.change(within(w).getByLabelText(/evidencia/i), { target: { value: "https://tickets.example/1" } });
    fireEvent.click(within(w).getByLabelText(/confirmo que la cuenta existe/i));
    fireEvent.click(within(w).getByRole("button", { name: /confirmar existencia/i }));
    await waitFor(() => expect(transition).toHaveBeenCalled());
    expect(transition.mock.calls[0][2]).toMatchObject({ to_status: "EXISTS", evidence_ref: "https://tickets.example/1" });
    expect(update.mock.calls[0][2]).toMatchObject({ profile_url: "https://www.instagram.com/demo_marca/" });
  });

  it("PROFILE_COMPLETE con capacidad permitida: Conectar lanza el OAuth y navega a https", async () => {
    const startConnection = jest.fn(async () => ({
      ok: true as const,
      data: { authorization_url: "https://www.facebook.com/dialog/oauth?state=x", expires_at: "2026-01-01T00:00:00Z", requested_scopes: [] },
    }));
    const navigate = jest.fn();
    const accounts = MOCK_ACCOUNTS.filter((a) => a.brand_id === MOCK_BRANDS[0].id).map((a) => ({
      ...a,
      status: "PROFILE_COMPLETE" as LifecycleStatus,
    }));
    const caps = MOCK_CAPABILITIES.map((c) =>
      c.platform === "instagram" && c.capability === "connect_oauth" ? { ...c, nadakki_status: "SANDBOX" as const } : c,
    );
    render(
      <SocialCenter
        client={clientWith({ listAccounts: async () => ({ ok: true, data: accounts }), getCapabilities: async () => ({ ok: true, data: caps }), startConnection })}
        navigate={navigate}
        demo
        lang="es"
      />,
    );
    fireEvent.click(within(await screen.findByTestId("card-instagram")).getByRole("button", { name: /asistente|continuar|alta/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^conectar/i }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("https://www.facebook.com/dialog/oauth?state=x"));
  });

  it.each(["REQUIRES_HUMAN", "NOT_SUPPORTED", "STUB"] as const)(
    "capacidad %s: sin boton Conectar y con explicacion",
    async (nadakki_status) => {
      const accounts = MOCK_ACCOUNTS.filter((a) => a.brand_id === MOCK_BRANDS[0].id).map((a) => ({
        ...a,
        status: "PROFILE_COMPLETE" as LifecycleStatus,
      }));
      const caps = MOCK_CAPABILITIES.map((c) =>
        c.platform === "linkedin" && c.capability === "connect_oauth" ? { ...c, nadakki_status } : c,
      );
      render(
        <SocialCenter
          client={clientWith({ listAccounts: async () => ({ ok: true, data: accounts }), getCapabilities: async () => ({ ok: true, data: caps }) })}
          demo
          lang="es"
        />,
      );
      fireEvent.click(within(await screen.findByTestId("card-linkedin")).getByRole("button", { name: /asistente|continuar|alta/i }));
      const w = await screen.findByTestId("wizard");
      expect(within(w).queryByRole("button", { name: /^conectar/i })).toBeNull();
      expect(within(w).getByTestId("connect-blocked").textContent).toMatch(/REQUIRES HUMAN|NOT SUPPORTED|no está disponible|aún/i);
    },
  );

  it("sin celda en la matriz falla cerrado: no ofrece Conectar", async () => {
    const accounts = MOCK_ACCOUNTS.filter((a) => a.brand_id === MOCK_BRANDS[0].id).map((a) => ({
      ...a,
      status: "PROFILE_COMPLETE" as LifecycleStatus,
    }));
    render(
      <SocialCenter
        client={clientWith({ listAccounts: async () => ({ ok: true, data: accounts }), getCapabilities: fail })}
        demo
        lang="es"
      />,
    );
    fireEvent.click(within(await screen.findByTestId("card-tiktok")).getByRole("button", { name: /asistente|continuar|alta/i }));
    const w = await screen.findByTestId("wizard");
    expect(within(w).queryByRole("button", { name: /^conectar/i })).toBeNull();
  });
});
