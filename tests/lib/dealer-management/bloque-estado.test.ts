import {
  casoDesdeRespuesta,
  codigoDeError,
  mensajeDeValidacion,
} from "@/lib/dealer-management/bloque-estado";

describe("codigoDeError — el caso se decide por el cuerpo, no por el status", () => {
  test("lee las claves que usa el backend", () => {
    expect(codigoDeError({ reason_code: "NO_ACTIVE_SUBSCRIPTION" })).toBe("NO_ACTIVE_SUBSCRIPTION");
    expect(codigoDeError({ error_code: "C1_DESBALANCE" })).toBe("C1_DESBALANCE");
    expect(codigoDeError({ code: "C10_INMUTABLE" })).toBe("C10_INMUTABLE");
  });

  test("baja a detail cuando el codigo viene anidado", () => {
    expect(codigoDeError({ detail: { reason_code: "C1_DESBALANCE" } })).toBe("C1_DESBALANCE");
  });

  test("sin codigo devuelve null", () => {
    expect(codigoDeError({ detail: "algo salió mal" })).toBeNull();
    expect(codigoDeError(null)).toBeNull();
  });
});

describe("casoDesdeRespuesta — aviso 2.1: un 422 no siempre es moneda faltante", () => {
  test("422 con codigo de moneda funcional => falta configuracion", () => {
    expect(
      casoDesdeRespuesta({ status: 422, codigo: "MONEDA_FUNCIONAL_NO_CONFIGURADA" }).caso,
    ).toBe("falta_configuracion");
  });

  test("422 con C1_DESBALANCE => error de validacion, NO moneda", () => {
    const estado = casoDesdeRespuesta({ status: 422, codigo: "C1_DESBALANCE" });
    expect(estado.caso).toBe("error_validacion");
    if (estado.caso === "error_validacion") {
      expect(estado.codigo).toBe("C1_DESBALANCE");
      expect(estado.mensaje).toBe(mensajeDeValidacion("C1_DESBALANCE"));
    }
  });

  test("422 sin codigo NO se asume moneda faltante", () => {
    const estado = casoDesdeRespuesta({ status: 422, codigo: null });
    expect(estado.caso).toBe("error_validacion");
  });

  test("409 con C10_INMUTABLE => error de validacion", () => {
    expect(casoDesdeRespuesta({ status: 409, codigo: "C10_INMUTABLE" }).caso).toBe(
      "error_validacion",
    );
  });
});

describe("casoDesdeRespuesta — resto de la tabla 1", () => {
  test("404 y 405 (ruta sin lector) => no disponible aun", () => {
    expect(casoDesdeRespuesta({ status: 404 }).caso).toBe("no_disponible");
    expect(casoDesdeRespuesta({ status: 405 }).caso).toBe("no_disponible");
  });

  test("402 / NO_ACTIVE_SUBSCRIPTION y TARGET_CORE_NOT_READY => fuera del plan", () => {
    expect(casoDesdeRespuesta({ status: 402 }).caso).toBe("fuera_del_plan");
    expect(casoDesdeRespuesta({ status: 403, codigo: "TARGET_CORE_NOT_READY" }).caso).toBe(
      "fuera_del_plan",
    );
  });

  test("5xx y red => error (con reintento en la vista)", () => {
    expect(casoDesdeRespuesta({ status: 500 }).caso).toBe("error");
    expect(casoDesdeRespuesta({ status: 0 }).caso).toBe("error");
  });

  test("los mensajes de validacion están en lenguaje de negocio", () => {
    expect(mensajeDeValidacion("C1_DESBALANCE")).toMatch(/debe y el haber/i);
    expect(mensajeDeValidacion("C10_INMUTABLE")).toMatch(/cerrado/i);
  });
});
