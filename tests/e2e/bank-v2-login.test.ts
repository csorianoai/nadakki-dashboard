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
    const page = {
      goto: jest.fn(),
      locator: jest.fn().mockReturnValue(accion),
      getByPlaceholder,
      getByRole: jest.fn().mockReturnValue(accion),
      waitForURL: jest.fn(),
    };
    await login(page as never);
    expect(getByPlaceholder).toHaveBeenCalledWith("tu-institucion", { exact: true });
  });
});
