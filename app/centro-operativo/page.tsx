"use client";

/**
 * Centro Operativo y Guia de Carga (D9).
 *
 * La pantalla no tiene texto propio: pinta los bloques que le da
 * `contenidoCentroOperativo` para el tenant de la sesion. Si ese tenant todavia
 * no tiene guia validada recibe la de Mapaal, que es la unica revisada
 * contablemente. No se publica ningun dato del tenant --no hay importes ni
 * cifras-- asi que no hay nada que cerrar por acceso.
 */

import { useAuth } from "@/hooks/useAuth";
import { contenidoCentroOperativo, type BloqueGuia } from "./contenido";

const TARJETA = "rounded-xl border border-nk-border bg-nk-surface p-4";

function Bloque({ bloque }: { bloque: BloqueGuia }) {
  return (
    <article data-testid={`centro-bloque-${bloque.id}`} className={TARJETA}>
      <h2 className="text-lg font-bold text-nk-fg">{bloque.titulo}</h2>

      {bloque.parrafos?.map((parrafo) => (
        <p key={parrafo} className="mt-2 text-sm text-nk-fg-muted">
          {parrafo}
        </p>
      ))}

      {bloque.pasos?.length ? (
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-nk-fg">
          {bloque.pasos.map((paso) => (
            <li key={paso}>{paso}</li>
          ))}
        </ol>
      ) : null}

      {bloque.vinetas?.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-nk-fg">
          {bloque.vinetas.map((vineta) => (
            <li key={vineta}>{vineta}</li>
          ))}
        </ul>
      ) : null}

      {bloque.asientos?.length ? (
        <ul className="mt-3 space-y-2 text-sm text-nk-fg">
          {bloque.asientos.map((asiento) => (
            <li key={`${asiento.debe}-${asiento.haber}`} className="font-mono text-xs">
              <span className="font-semibold">Debe</span> {asiento.debe}{" "}
              <span className="font-semibold">/ Haber</span> {asiento.haber}
              <span className="ml-1 font-sans text-nk-fg-muted">— {asiento.concepto}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {bloque.advertencia ? (
        <p
          role="note"
          data-testid={`centro-advertencia-${bloque.id}`}
          className="mt-3 text-sm font-semibold text-amber-300"
        >
          {bloque.advertencia}
        </p>
      ) : null}
    </article>
  );
}

export default function CentroOperativoPage() {
  const { tenant } = useAuth();
  const contenido = contenidoCentroOperativo(tenant?.id);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 pb-12">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">{contenido.titulo}</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">{contenido.entrada}</p>
      </header>

      {contenido.bloques.map((bloque) => (
        <Bloque key={bloque.id} bloque={bloque} />
      ))}

      <section data-testid="centro-tipos-costo" className={TARJETA}>
        <h2 className="text-lg font-bold text-nk-fg">{contenido.tiposCostoIntro}</h2>
        <dl className="mt-3 space-y-2">
          {contenido.tiposCosto.map((tipo) => (
            <div key={tipo.id} data-testid={`centro-tipo-${tipo.id}`}>
              <dt className="text-sm font-semibold text-nk-fg">{tipo.nombre}</dt>
              <dd className="text-sm text-nk-fg-muted">{tipo.descripcion}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section data-testid="centro-cuentas" className={TARJETA}>
        <h2 className="text-lg font-bold text-nk-fg">{contenido.cuentasIntro}</h2>
        <ul className="mt-3 space-y-1 text-sm text-nk-fg">
          {contenido.cuentas.map((cuenta) => (
            <li key={cuenta.codigo} data-testid={`centro-cuenta-${cuenta.codigo}`}>
              <span className="font-mono font-semibold">{cuenta.codigo}</span> — {cuenta.nombre}
            </li>
          ))}
        </ul>
      </section>

      <section data-testid="centro-regla-final" className={TARJETA}>
        <p className="text-sm text-nk-fg">{contenido.reglaFinal}</p>
      </section>
    </main>
  );
}
