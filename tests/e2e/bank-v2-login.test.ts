/** @jest-environment node */
import { login } from "../../e2e/bank-v2/login";

describe("e2e/bank-v2/login", () => {
  const previo = { ...process.env };
  afterEach(() => {
    process.env = { ...previo };
  });

  it.each(["QA_USER", "QA_PASSWORD", "QA_TENANT_SLUG"])(
    "falla con un mensaje claro si falta %s",
    async (nombre) => {
      process.env.QA_USER = "u";
      process.env.QA_PASSWORD = "p";
      process.env.QA_TENANT_SLUG = "t";
      delete process.env[nombre];
      await expect(login({} as never)).rejects.toThrow(nombre);
    },
  );
});

describe("e2e/bank-v2/login locator de tenant", () => {
  it("busca el placeholder del tenant con exact:true (el del email lo contiene)", async () => {
    process.env.QA_USER = "u";
    process.env.QA_PASSWORD = "p";
    process.env.QA_TENANT_SLUG = "t";
    const accion = { fill: jest.fn(), click: jest.fn(), count: jest.fn().mockResolvedValue(1) };
    const getByPlaceholder = jest.fn().mockReturnValue(accion);
    const campo = { ...accion, waitFor: jest.fn().mockResolvedValue(undefined) };
    // El aviso de error nunca aparece: el login "sale" de /login.
    const aviso = { waitFor: jest.fn().mockReturnValue(new Promise(() => {})), innerText: jest.fn() };
    const page = {
      goto: jest.fn(),
      locator: jest.fn((sel: string) => (sel.includes("bg-red-50") ? { first: () => aviso } : campo)),
      getByPlaceholder,
      getByRole: jest.fn().mockReturnValue(accion),
      waitForURL: jest.fn().mockResolvedValue(undefined),
      waitForLoadState: jest.fn().mockResolvedValue(undefined),
    };
    await login(page as never);
    expect(getByPlaceholder).toHaveBeenCalledWith("tu-institucion", { exact: true });
  });

  it("falla con el texto del aviso si la UI rechaza el login", async () => {
    process.env.QA_USER = "u";
    process.env.QA_PASSWORD = "p";
    process.env.QA_TENANT_SLUG = "t";
    const accion = { fill: jest.fn(), click: jest.fn(), count: jest.fn().mockResolvedValue(0), waitFor: jest.fn() };
    const aviso = {
      waitFor: jest.fn().mockResolvedValue(undefined),
      innerText: jest.fn().mockResolvedValue(" Credenciales inválidas "),
    };
    const page = {
      goto: jest.fn(),
      locator: jest.fn((sel: string) => (sel.includes("bg-red-50") ? { first: () => aviso } : accion)),
      getByPlaceholder: jest.fn().mockReturnValue(accion),
      getByRole: jest.fn().mockReturnValue(accion),
      waitForURL: jest.fn().mockReturnValue(new Promise(() => {})),
      waitForLoadState: jest.fn(),
    };
    await expect(login(page as never)).rejects.toThrow("Login rechazado por la UI: Credenciales inválidas");
  });
});
