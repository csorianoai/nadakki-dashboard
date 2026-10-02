/**
 * Reglas contables de carga de costos, VERBATIM de GUIA-CARGA-MAPAAL.
 *
 * Fuente: csorianoai/nadakki-ai-suite#1501, comentario 5952253812, secciones 3
 * y 4. Instruccion de Cesar: usar ese contenido "sin reescribirlo". Por eso
 * estas cadenas no se parafrasean ni se "mejoran" al tocarlas: si la guia
 * cambia, se vuelve a copiar de la fuente.
 *
 * Hay UNA desviacion, documentada donde ocurre: el encabezado de la seccion 4
 * (`REGLAS_CONTABLES_BASE`), por decision explicita de Cesar. Las reglas en si
 * siguen palabra por palabra.
 *
 * Aqui va SOLO lo que es de D4 --los tipos de costo y las reglas de carga--. El
 * resto de la guia (saldos iniciales, venta, cobro, pago, plan de cuentas) es
 * contenido de D9, que lleva dashboard-2 en su propio archivo de datos; no se
 * duplica.
 *
 * Las claves son los codigos del CHECK de `vehicle_cost_entries.cost_type`, no
 * etiquetas: asi un tipo sin ayuda se ve enseguida y no se cuela un texto
 * pegado al tipo equivocado. `registration` (Gestoria) esta descrito en la guia
 * pero el backend todavia no lo acepta, asi que su ayuda espera al codigo.
 */

/** Ayuda por tipo de costo. Clave = codigo del CHECK. */
export const AYUDA_POR_TIPO_DE_COSTO: Record<string, string> = {
  purchase: "Compra: precio de adquisición del vehículo. Es costo de inventario.",
  repair:
    "Reparación: trabajo o repuesto necesario para poner el vehículo en condiciones de venta. Proveedor y factura son obligatorios.",
  reconditioning:
    "Reacondicionamiento: preparación estética o funcional del vehículo para su venta, cuando no corresponda clasificarla como reparación.",
  transport:
    "Traslado: flete, transporte, grúa u otro costo directamente atribuible a llevar el vehículo a la ubicación o condición necesaria para venderlo.",
  tax:
    "Impuestos no recuperables: tributos que forman parte del costo porque no generan crédito fiscal recuperable.",
  commission:
    "Comisión de compra: comisión pagada para adquirir el vehículo. Es costo del inventario.",
  other:
    "Otros: sólo para costos directamente atribuibles al vehículo que no encajen correctamente en las categorías anteriores. Evitá usar “Otros” como categoría genérica por comodidad.",
};

/** Cierre de la seccion 3 de la guia. */
export const AYUDA_REVERSIONES =
  "Las reversiones o correcciones deben hacerse mediante el mecanismo de reversión correspondiente; no edites silenciosamente un costo histórico ya registrado.";

export const REGLAS_CONTABLES_TITULO = "Reglas contables de carga de costos";

/**
 * Encabezado de la seccion 4, con la base del criterio.
 *
 * UNICA desviacion del verbatim de la guia, y por decision explicita de Cesar:
 * la guia encabeza con "Por decisión de César para Mapaal, basada en el criterio
 * adoptado de RT 54 FACPCE:". Esto lo lee el dealer, y una regla contable
 * atribuida por nombre a alguien de Nadakki no es lo que tiene que leer. Es
 * correccion de PRESENTACION: la base del criterio --RT 54 FACPCE-- no cambia,
 * y las cinco reglas de abajo siguen palabra por palabra.
 */
export const REGLAS_CONTABLES_BASE = "Criterio contable adoptado (RT 54 FACPCE):";

/** Las cinco reglas de la seccion 4, en su orden. */
export const REGLAS_CONTABLES = [
  "Los costos capitalizables se cargan SIN IVA recuperable: registrá el neto gravado cuando el IVA sea recuperable.",
  "El IVA recuperable no forma parte del costo del vehículo.",
  "Un impuesto no recuperable sí puede integrar el costo cuando corresponda.",
  "La categoría “comisión” dentro de costos significa exclusivamente comisión de compra.",
  "Las comisiones de venta no aumentan el costo del vehículo: son gasto de venta y deben tratarse fuera del costo del inventario.",
] as const;

/** Cierre de la seccion 4 de la guia. */
export const REGLAS_CONTABLES_CIERRE =
  "Si un comprobante mezcla conceptos, separá el importe que realmente corresponde al costo capitalizable antes de cargarlo.";
