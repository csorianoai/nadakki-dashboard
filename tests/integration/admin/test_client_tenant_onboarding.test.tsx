import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SaasOnboardingWizard } from "@/components/admin/saas-onboarding/SaasOnboardingWizard";

const PASSWORD = "clave-temporal-segura";
const CORES = {
  success: true,
  cores: [
    { core_name: "marketing", display_name: "Marketing", enabled: true },
    { core_name: "real_estate", display_name: "Bienes raíces", enabled: true },
    { core_name: "legal", display_name: "Legal", enabled: false },
  ],
};

type Reply = { status: number; body: unknown };
let post: jest.Mock;
let postReply: Reply | (() => Promise<Reply>);

function json(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

beforeEach(() => {
  post = jest.fn();
  postReply = { status: 201, body: {} };
  window.localStorage.clear();
  window.sessionStorage.clear();
  global.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    if (String(url).includes("/api/v1/cockpit/network/cores")) return json(200, CORES);
    post(String(url), init);
    const reply = typeof postReply === "function" ? await postReply() : postReply;
    return json(reply.status, reply.body);
  }) as unknown as typeof fetch;
});

async function openClient() {
  render(<SaasOnboardingWizard />);
  fireEvent.click(screen.getByTestId("mode-client"));
  await screen.findByTestId("client-core-marketing");
}

function fill(core = "marketing") {
  fireEvent.change(screen.getByTestId("client-name"), { target: { value: "Inmobiliaria Sol" } });
  fireEvent.change(screen.getByTestId("client-industry"), { target: { value: "Bienes raices" } });
  fireEvent.change(screen.getByTestId("client-country"), { target: { value: "DO" } });
  fireEvent.change(screen.getByTestId("client-currency"), { target: { value: "DOP" } });
  fireEvent.change(screen.getByTestId("client-locale"), { target: { value: "es" } });
  fireEvent.change(screen.getByTestId("client-email"), { target: { value: "admin@sol.example.com" } });
  fireEvent.change(screen.getByTestId("client-password"), { target: { value: PASSWORD } });
  if (core) fireEvent.click(screen.getByTestId(`client-core-${core}`));
}

const submit = () => fireEvent.click(screen.getByTestId("submit-client"));
const created = (idempotent = false) => ({
  tenant_id: "t-1", admin_user_id: "u-1", slug: "inmobiliaria-sol", idempotent,
});

test("la tercera opcion aparece junto a las dos existentes y estas siguen ahi", () => {
  render(<SaasOnboardingWizard />);
  expect(screen.getByTestId("mode-institution")).toHaveTextContent("Crear institución");
  expect(screen.getByTestId("mode-dealer")).toHaveTextContent("Crear concesionario");
  expect(screen.getByTestId("mode-client")).toHaveTextContent("Crear cliente o agencia");
  expect(screen.getByTestId("field-tenant-name")).toBeInTheDocument();
});

test("solo ofrece cores habilitados y sugiere el slug desde el nombre", async () => {
  await openClient();
  expect(screen.queryByTestId("client-core-legal")).not.toBeInTheDocument();
  fireEvent.change(screen.getByTestId("client-name"), { target: { value: "Inmobiliaria Sol" } });
  expect(screen.getByTestId("client-slug")).toHaveValue("inmobiliaria-sol");
  expect(screen.getByTestId("client-password")).toHaveAttribute("type", "password");
});

test("envio feliz con el cuerpo exacto", async () => {
  postReply = { status: 201, body: created() };
  await openClient();
  fill();
  submit();
  expect(await screen.findByTestId("client-result")).toHaveTextContent("inmobiliaria-sol");
  expect(screen.getByTestId("client-result")).toHaveTextContent(
    "el administrador deberá cambiar la contraseña al entrar",
  );
  const [url, init] = post.mock.calls[0];
  expect(url).toBe("/api/v1/admin/client-tenants");
  expect(init.method).toBe("POST");
  const body = JSON.parse(init.body);
  expect(body).toEqual({
    tenant_name: "Inmobiliaria Sol",
    slug: "inmobiliaria-sol",
    organization_archetype: "client",
    industry: "Bienes raices",
    country_code: "DO",
    currency: "DOP",
    locale: "es",
    cores_enabled: ["marketing"],
    admin_email: "admin@sol.example.com",
    admin_password: PASSWORD,
    external_ref: expect.stringMatching(/^ui:client:.{8,}/),
  });
  expect(url).not.toContain(PASSWORD);
});

test("idempotent=true dice que ya existia", async () => {
  postReply = { status: 200, body: created(true) };
  await openClient();
  fill();
  submit();
  expect(await screen.findByTestId("client-result")).toHaveTextContent("ya existía");
});

test.each([
  [409, { detail: { error_code: "SLUG_EXISTS" } }, "ese slug ya está en uso"],
  [422, { detail: { code: "core_not_available", cores: ["marketing"] } }, "marketing"],
  [403, { detail: "forbidden" }, "tu usuario no puede dar de alta clientes"],
  [500, { detail: "boom" }, "No pudimos crear el cliente"],
])("estado %s se explica en llano y conserva lo escrito", async (status, body, text) => {
  postReply = { status, body };
  await openClient();
  fill();
  submit();
  const alert = await screen.findByRole("alert");
  expect(alert.textContent?.toLowerCase()).toContain(text.toLowerCase());
  expect(alert.textContent).not.toMatch(/core_not_available|SLUG_EXISTS|\b(409|422|500)\b/);
  expect(screen.getByTestId("client-name")).toHaveValue("Inmobiliaria Sol");
  expect(screen.getByTestId("client-password")).toHaveValue("");
  expect(screen.getByTestId("submit-client")).not.toBeDisabled();
});

test("un fallo de red conserva lo escrito y no la contrasena", async () => {
  postReply = async () => { throw new TypeError("network"); };
  await openClient();
  fill();
  submit();
  expect((await screen.findByRole("alert")).textContent).toContain("No pudimos crear el cliente");
  expect(screen.getByTestId("client-email")).toHaveValue("admin@sol.example.com");
  expect(screen.getByTestId("client-password")).toHaveValue("");
});

test("sin core marcado no envia", async () => {
  await openClient();
  fill("");
  submit();
  expect(await screen.findByRole("alert")).toHaveTextContent("Marque al menos un core");
  expect(post).not.toHaveBeenCalled();
});

test("la contrasena no queda en almacenamiento ni en el DOM tras el exito", async () => {
  postReply = { status: 201, body: created() };
  await openClient();
  fill();
  submit();
  await screen.findByTestId("client-result");
  expect(document.body.innerHTML).not.toContain(PASSWORD);
  for (const input of Array.from(document.querySelectorAll("input"))) {
    expect((input as HTMLInputElement).value).not.toContain(PASSWORD);
  }
  expect(JSON.stringify({ ...window.localStorage })).not.toContain(PASSWORD);
  expect(JSON.stringify({ ...window.sessionStorage })).not.toContain(PASSWORD);
});

test("doble clic produce una sola llamada", async () => {
  let release: (r: Reply) => void = () => {};
  postReply = () => new Promise<Reply>((resolve) => { release = resolve; });
  await openClient();
  fill();
  submit();
  submit();
  await waitFor(() => expect(screen.getByTestId("submit-client")).toBeDisabled());
  release({ status: 201, body: created() });
  await screen.findByTestId("client-result");
  expect(post).toHaveBeenCalledTimes(1);
});
