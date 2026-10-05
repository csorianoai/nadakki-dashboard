/**
 * Contenido del Centro Operativo y la Guia de Carga (D9).
 *
 * ESTE TEXTO NO SE REESCRIBE. Es la "Guia de carga y operacion inicial de Mapaal"
 * ya redactada y VALIDADA CONTABLEMENTE por Cesar, publicada como el comentario
 * GUIA-CARGA-MAPAAL en csorianoai/nadakki-ai-suite#1501 (id 5952253812). Se copia
 * tal cual: lo unico que se quito es la sintaxis markdown de enfasis, que en un
 * archivo de datos se veria literal. Las reglas contables no se tocan, no se
 * resumen y no se reordenan.
 *
 * Es un ARCHIVO DE DATOS, no JSX: otro tenant recibe su propio contenido sin
 * tocar la pantalla.
 */

/** Una cuenta del plan operativo. El codigo es el que usa la contabilidad. */
export interface CuentaPlan {
  codigo: string;
  nombre: string;
}

/** Un asiento tal como la guia lo enuncia: que va al debe, que al haber y por que. */
export interface AsientoGuia {
  debe: string;
  haber: string;
  concepto: string;
}

export interface TipoCosto {
  id: string;
  nombre: string;
  descripcion: string;
}

/**
 * La plantilla oficial de carga, servida como asset estatico del panel.
 *
 * La RUTA vive aqui y no en la pantalla a proposito: cambiar de version es
 * cambiar esta linea --y dejar el fichero nuevo en `public/`-- sin tocar ni una
 * linea de codigo ni volver a desplegar el componente. La version va en el
 * nombre del fichero para que un enlace cacheado nunca sirva la plantilla vieja.
 */
export interface PlantillaCarga {
  /** Ruta servida desde `public/`. Empieza por "/" y acaba en ".xlsx". */
  ruta: string;
  /** Version oficial, para que la pantalla pueda decirla sin deducirla. */
  version: string;
  /** El texto del boton. */
  etiqueta: string;
  /** La linea que explica para que sirve. Es contenido, no decoracion. */
  descripcion: string;
}

/**
 * Un bloque de la guia. El texto va verbatim; la pantalla decide como pintarlo y
 * no agrega ninguno propio.
 */
export interface BloqueGuia {
  id: string;
  titulo: string;
  parrafos?: string[];
  vinetas?: string[];
  pasos?: string[];
  asientos?: AsientoGuia[];
  advertencia?: string;
  /**
   * La plantilla cuelga del BLOQUE y no del contenido global para que el archivo
   * de datos decida tambien EN QUE seccion aparece el boton. Hoy es "primeros
   * pasos"; moverlo a otra seccion seria mover este campo, sin tocar la pantalla.
   */
  plantilla?: PlantillaCarga;
  /**
   * Los pasos en lenguaje llano para el Inicio del dealer, sin codigos
   * contables. NO reemplazan a `pasos`: la guia validada sigue intacta y el
   * Inicio la ofrece plegada bajo "Ver detalle contable".
   */
  pasosInicio?: string[];
}

export interface ContenidoCentroOperativo {
  tenant: string | null;
  titulo: string;
  entrada: string;
  bloques: BloqueGuia[];
  /** La frase que encabeza los tipos de costo en la guia. La pantalla no la escribe. */
  tiposCostoIntro: string;
  tiposCosto: TipoCosto[];
  /** Idem para el plan de cuentas: el encabezado tambien es contenido. */
  cuentasIntro: string;
  cuentas: CuentaPlan[];
  reglaFinal: string;
}

const TIPOS_COSTO_MAPAAL: TipoCosto[] = [
  {
    id: "compra",
    nombre: "Compra",
    descripcion: "precio de adquisición del vehículo. Es costo de inventario.",
  },
  {
    id: "reparacion",
    nombre: "Reparación",
    descripcion:
      "trabajo o repuesto necesario para poner el vehículo en condiciones de venta. Proveedor y factura son obligatorios.",
  },
  {
    id: "reacondicionamiento",
    nombre: "Reacondicionamiento",
    descripcion:
      "preparación estética o funcional del vehículo para su venta, cuando no corresponda clasificarla como reparación.",
  },
  {
    id: "traslado",
    nombre: "Traslado",
    descripcion:
      "flete, transporte, grúa u otro costo directamente atribuible a llevar el vehículo a la ubicación o condición necesaria para venderlo.",
  },
  {
    id: "gestoria",
    nombre: "Gestoría",
    descripcion:
      "trámites directamente atribuibles a la incorporación o preparación del vehículo para la venta.",
  },
  {
    id: "impuestos-no-recuperables",
    nombre: "Impuestos no recuperables",
    descripcion:
      "tributos que forman parte del costo porque no generan crédito fiscal recuperable.",
  },
  {
    id: "comision-compra",
    nombre: "Comisión de compra",
    descripcion: "comisión pagada para adquirir el vehículo. Es costo del inventario.",
  },
  {
    id: "otros",
    nombre: "Otros",
    descripcion:
      "sólo para costos directamente atribuibles al vehículo que no encajen correctamente en las categorías anteriores. Evitá usar “Otros” como categoría genérica por comodidad.",
  },
];

/** El plan operativo inicial de Mapaal tiene 8 cuentas. */
const CUENTAS_MAPAAL: CuentaPlan[] = [
  { codigo: "1010", nombre: "Caja" },
  { codigo: "1020", nombre: "Banco" },
  { codigo: "1100", nombre: "Créditos por ventas" },
  { codigo: "1220", nombre: "Inventario de vehículos para la venta" },
  { codigo: "2010", nombre: "Proveedores" },
  { codigo: "3020", nombre: "Saldos iniciales" },
  { codigo: "4010", nombre: "Venta de vehículos" },
  { codigo: "5010", nombre: "Costo de vehículos vendidos" },
];

const BLOQUES_MAPAAL: BloqueGuia[] = [
  {
    id: "primeros-pasos",
    titulo: "Primeros pasos: primero el stock existente, después la operación normal",
    parrafos: ["El orden importa."],
    pasos: [
      "Cargá primero todos los vehículos que Mapaal ya tenía antes de empezar a operar en Nadakki como SALDOS INICIALES.",
      "Para esos vehículos usá is_opening=true. La contrapartida contable del inventario es 3020 — Saldos iniciales, no Proveedores. El asiento de apertura es Debe 1220 — Inventario de vehículos / Haber 3020 — Saldos iniciales.",
      "Recién después de terminar y revisar esa carga inicial, empezá a registrar compras, reparaciones, otros costos, ventas, cobros y pagos de la operación normal.",
    ],
    pasosInicio: [
      "Descargá la plantilla y cargá todos los vehículos que ya tenías, marcando 'stock inicial = SÍ' y completando la fecha de ingreso de cada uno (así el sistema calcula los días en stock).",
      "Revisá la carga antes de aplicarla.",
      "Después registrá compras, reparaciones, ventas, cobros y pagos del día a día.",
    ],
    advertencia:
      "No uses una compra ficticia para representar un vehículo que Mapaal ya poseía: eso fabricaría una deuda con un proveedor que no existe.",
    /*
     * PLANTILLA DE CARGA — la v4 oficial, entregada en suite#1550 (revision de
     * claude-b1 en suite#1501). El fichero es una copia byte a byte de
     * nadakki-ai-suite `docs/autos_portal/plantillas/Plantilla_Activos_Mapaal_v4.xlsx`
     * (blob b67f172f); el nombre se conserva para que lleve la version.
     */
    plantilla: {
      ruta: "/assets/centro-operativo/Plantilla_Activos_Mapaal_v4.xlsx",
      version: "v4",
      etiqueta: "Descargar plantilla de carga (Excel)",
      descripcion:
        "Es la planilla donde listás los vehículos que Mapaal ya tenía, para cargarlos como saldos iniciales antes de empezar a operar.",
    },
  },
  {
    id: "alta-vehiculo",
    titulo: "Cómo dar de alta un vehículo",
    parrafos: [
      "Para cada vehículo cargá, como mínimo, los datos de identificación y operación que correspondan: marca, modelo, año, dominio/patente y n.º de stock interno.",
    ],
    vinetas: [
      "El precio oficial en ARS es obligatorio para que el vehículo pueda quedar en estado DISPONIBLE.",
      "La referencia en USD es opcional y es solamente informativa/comercial.",
      "La referencia USD nunca entra en cálculos contables, costos, margen, asientos ni saldos. La moneda funcional oficial de Mapaal es ARS.",
      "No reemplaces el precio oficial en ARS por una referencia en dólares.",
    ],
    advertencia:
      "Antes de marcar un vehículo como DISPONIBLE, verificá que el precio oficial ARS, el dominio y el n.º de stock sean correctos.",
  },
  {
    id: "costos",
    titulo: "Cómo cargar los costos del vehículo",
    parrafos: [
      "Los costos se cargan contra el vehículo específico. Eso permite conocer su costo acumulado y, al venderlo, reconocer correctamente el costo de mercadería vendida.",
    ],
    advertencia:
      "Las reversiones o correcciones deben hacerse mediante el mecanismo de reversión correspondiente; no edites silenciosamente un costo histórico ya registrado.",
  },
  {
    id: "reglas-contables",
    titulo: "Reglas contables de carga de costos",
    parrafos: [
      "Por decisión de César para Mapaal, basada en el criterio adoptado de RT 54 FACPCE:",
    ],
    vinetas: [
      "Los costos capitalizables se cargan SIN IVA recuperable: registrá el neto gravado cuando el IVA sea recuperable.",
      "El IVA recuperable no forma parte del costo del vehículo.",
      "Un impuesto no recuperable sí puede integrar el costo cuando corresponda.",
      "La categoría “comisión” dentro de costos significa exclusivamente comisión de compra.",
      "Las comisiones de venta no aumentan el costo del vehículo: son gasto de venta y deben tratarse fuera del costo del inventario.",
    ],
    advertencia:
      "Si un comprobante mezcla conceptos, separá el importe que realmente corresponde al costo capitalizable antes de cargarlo.",
  },
  {
    id: "venta",
    titulo: "Venta",
    parrafos: [
      "Al vender un vehículo, registrá la venta sobre el vehículo correcto y su precio oficial en ARS. La contabilidad debe reconocer en el mismo ciclo:",
    ],
    asientos: [
      {
        debe: "1100 — Créditos por ventas",
        haber: "4010 — Venta de vehículos",
        concepto: "por el precio de venta",
      },
      {
        debe: "5010 — Costo de vehículos vendidos",
        haber: "1220 — Inventario de vehículos para la venta",
        concepto: "por la suma neta de costos capitalizados de ese vehículo",
      },
    ],
    advertencia:
      "Una venta sin costos capitalizados debe fallar cerrado: no debe registrarse sólo el ingreso porque eso mostraría un margen artificialmente alto.",
  },
  {
    id: "cobro",
    titulo: "Cobro de un cliente",
    parrafos: ["Cuando el cliente paga una cuenta por cobrar:"],
    asientos: [
      {
        debe: "1010 — Caja",
        haber: "1100 — Créditos por ventas",
        concepto: "si entra en efectivo",
      },
      {
        debe: "1020 — Banco",
        haber: "1100 — Créditos por ventas",
        concepto: "si entra por banco",
      },
    ],
    advertencia: "Usá el medio real del cobro; no elijas la cuenta contable libremente.",
  },
  {
    id: "pago",
    titulo: "Pago a un proveedor",
    parrafos: ["Cuando Mapaal paga una deuda con un proveedor:"],
    asientos: [
      { debe: "2010 — Proveedores", haber: "1010 — Caja", concepto: "si paga en efectivo" },
      { debe: "2010 — Proveedores", haber: "1020 — Banco", concepto: "si paga por banco" },
    ],
    advertencia:
      "Cada hecho debe registrarse una sola vez; los procesos son idempotentes para evitar asientos duplicados por reintentos.",
  },
  {
    id: "que-muestra",
    titulo: "Qué muestra la contabilidad de Mapaal",
    parrafos: [
      "Desde el Centro Operativo, la contabilidad debe permitir consultar como mínimo:",
    ],
    vinetas: [
      "plan de cuentas;",
      "libro mayor;",
      "balance de comprobación / situación de saldos;",
      "resultados, distinguiendo ventas y costo de vehículos vendidos.",
    ],
    advertencia:
      "La contabilidad operativa de Nadakki registra los hechos económicos del dealer. La facturación electrónica y sus comprobantes fiscales se gestionan en ARCA; no deben confundirse con los asientos internos del sistema.",
  },
];

const MAPAAL: ContenidoCentroOperativo = {
  tenant: "mapaal",
  titulo: "Guía de carga y operación inicial de Mapaal",
  entrada:
    "Qué hacer, en qué orden, y qué reglas contables están detrás. Si una pantalla te dice que algo falta, acá está por qué.",
  bloques: BLOQUES_MAPAAL,
  tiposCostoIntro: "Tipos de costo:",
  tiposCosto: TIPOS_COSTO_MAPAAL,
  cuentasIntro: "El plan operativo inicial de Mapaal tiene 8 cuentas:",
  cuentas: CUENTAS_MAPAAL,
  reglaFinal:
    "Primero documentá correctamente el hecho real —vehículo, costo, venta, cobro o pago— y dejá que el sistema derive la cuenta contable prevista. No inventes cuentas, monedas, proveedores ni importes para “hacer cuadrar” una operación.",
};

/**
 * Hoy solo Mapaal tiene guia validada contablemente, asi que es la que se
 * entrega. Cuando otro tenant tenga la suya entra aca, sin tocar la pantalla.
 */
const POR_TENANT: Record<string, ContenidoCentroOperativo> = {
  mapaal: MAPAAL,
};

export function contenidoCentroOperativo(tenant?: string | null): ContenidoCentroOperativo {
  const clave = tenant?.trim().toLowerCase();
  if (!clave) return MAPAAL;
  return POR_TENANT[clave] ?? MAPAAL;
}

/**
 * La plantilla de carga del tenant: la del bloque que la declare. La usan el
 * Centro Operativo y el importador, asi los dos ofrecen el MISMO fichero.
 */
export function plantillaDeCarga(tenant?: string | null): PlantillaCarga | null {
  return contenidoCentroOperativo(tenant).bloques.find((bloque) => bloque.plantilla)?.plantilla ?? null;
}
