import {
  casoDesdeRespuesta,
  codigoDeError,
  mensajeDeValidacion,
} from "@/lib/dealer-management/bloque-estado";

describe("codigoDeError — el cuerpo manda sobre el status", () => {
  test("lee las claves estructuradas del backend", () => {
    expect(codigoDeError({ reason_code: "NO_ACTIVE_SUBSCRIPTION" })).toBe("NO_ACTIVE_SUBSCRIPTION");
    expect(codigoDeError({ error_code: "C1_DESBALANCE" })).toBe("C1_DESBALANCE");
    expect(codigoDeError({ code: "C10_INMUTABLE" })).toBe("C10_INMUTABLE");
  });

  test("baja a detail cuando el codigo viene anidado", () => {
    expect(codigoDeError({ detail: { reason_code: "C1_DESBALANCE" } })).toBe("C1_DESBALANCE");
  });

  test("lee el contrato string CODE: mensaje usado por Contable", () => {
    expect(
      codigoDeError({ detail: "FUNCTIONAL_CURRENCY_NOT_CONFIGURED: falta moneda" }),
    ).toBe("FUNCTIONAL_CURRENCY_NOT_CONFIGURED");
  });

  test("texto normal sin codigo devuelve null", () => {
    expect(codigoDeError({ detail: "algo salió mal" })).toBeNull();
    expect(codigoDeError(null)).toBeNull();
  });
});

describe("casoDesdeRespuesta — un 422 no siempre es moneda faltante", () => {
  test("codigo canonico de moneda funcional => falta configuracion", () => {
    expect(
      casoDesdeRespuesta({ status: 422, codigo: "FUNCTIONAL_CURRENCY_NOT_CONFIGURED" }).caso,
    ).toBe("falta_configuracion");
  });

  test("alias no publicado NO se trata como moneda funcional", () => {
    expect(
      casoDesdeRespuesta({ status: 422, codigo: "MONEDA_FUNCIONAL_NO_CONFIGURADA" }).caso,
    ).toBe("error_validacion");
  });

  test("422 con C1_DESBALANCE => error de validacion", () => {
    const estado = casoDesdeRespuesta({ status: 422, codigo: "C1_DESBALANCE" });
    expect(estado.caso).toBe("error_validacion");
    if (estado.caso === "error_validacion") {
      expect(estado.codigo).toBe("C1_DESBALANCE");
      expect(estado.mensaje).toBe(mensajeDeValidacion("C1_DESBALANCE"));
    }
  });

  test("422 sin codigo NO se asume moneda faltante", () => {
    expect(casoDesdeRespuesta({ status: 422, codigo: null }).caso).toBe("error_validacion");
  });

  test("409 con C10_INMUTABLE => error de validacion", () => {
    expect(casoDesdeRespuesta({ status: 409, codigo: "C10_INMUTABLE" }).caso).toBe(
      "error_validacion",
    );
  });
});

describe("casoDesdeRespuesta — resto de estados", () => {
  test("404 y 405 => no disponible", () => {
    expect(casoDesdeRespuesta({ status: 404 }).caso).toBe("no_disponible");
    expect(casoDesdeRespuesta({ status: 405 }).caso).toBe("no_disponible");
  });

  test("402 o codigos de entitlement => fuera del plan", () => {
    expect(casoDesdeRespuesta({ status: 402 }).caso).toBe("fuera_del_plan");
    expect(casoDesdeRespuesta({ status: 403, codigo: "NO_ACTIVE_SUBSCRIPTION" }).caso).toBe(
      "fuera_del_plan",
    );
    expect(casoDesdeRespuesta({ status: 403, codigo: "TARGET_CORE_NOT_READY" }).caso).toBe(
      "fuera_del_plan",
    );
  });

  test("5xx y red => error", () => {
    expect(casoDesdeRespuesta({ status: 500 }).caso).toBe("error");
    expect(casoDesdeRespuesta({ status: 0 }).caso).toBe("error");
  });

  test("mensajes conocidos usan lenguaje de negocio", () => {
    expect(mensajeDeValidacion("C1_DESBALANCE")).toMatch(/debe y el haber/i);
    expect(mensajeDeValidacion("C10_INMUTABLE")).toMatch(/cerrado/i);
  });
});
