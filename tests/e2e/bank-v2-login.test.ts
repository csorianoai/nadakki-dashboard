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
