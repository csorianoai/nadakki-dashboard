import { NAUTA_LIVE_DEFAULT_TASK } from "@/lib/nauta/liveConfig";
import { NautaLiveView } from "@/lib/nauta/components/NautaLiveView";
import { S } from "@/lib/nauta/strings";
import { KpiCard } from "../KpiCard";
import { SealCard } from "../SealCard";
import { RiskChip } from "../RiskChip";

export function ExpedienteE2View() {
  const e = S.expedienteE2;
  return (
    <>
      <div className="exp-head">
        <div className="big">E2</div>
        <div className="who">
          <h2>{e.title}</h2>
          <div className="cd">{e.code}</div>
          <div className="tags">
            <span className="star-tag" style={{ position: "static", transform: "none" }}>
              {e.tagStar}
            </span>
            <span className="pill prioridad">
              <span className="dot" aria-hidden />
              {e.tagPrioridad}
            </span>
            <RiskChip level="critico" />
            <span className="pill">{e.tagSupervisor("Lic. C. Disla")}</span>
          </div>
        </div>
        <div className="col-r">
          <div className="kv">
            <div className="row">
              <span className="k">{e.metaLists}</span>
              <span className="v">{e.metaListsVal}</span>
            </div>
            <div className="row">
              <span className="k">{e.metaMarco}</span>
              <span className="v">{e.metaMarcoVal}</span>
            </div>
            <div className="row">
              <span className="k">{e.metaCost}</span>
              <span className="v">{e.metaCostVal}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid-2">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="panel">
            <div className="panel-h">
              <h3>{e.profileTitle}</h3>
              <span className="sp" />
              <span className="sub">{e.profileSub}</span>
            </div>
            <div className="panel-b">
              <div className="callout-legal">
                <span className="lk" aria-hidden>
                  §
                </span>
                <div>{e.callout}</div>
              </div>
              <div style={{ fontSize: 13, color: "var(--t1)", lineHeight: 1.65 }}>
                {e.profileBody}
                <div className="kv" style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                  <div className="row">
                    <span className="k">{e.freq}</span>
                    <span className="v">{e.freqVal}</span>
                  </div>
                  <div className="row">
                    <span className="k">{e.sources}</span>
                    <span className="v">{e.sourcesVal}</span>
                  </div>
                  <div className="row">
                    <span className="k">{e.umbral}</span>
                    <span className="v">{e.umbralVal}</span>
                  </div>
                  <div className="row">
                    <span className="k">{e.evidenceMeta}</span>
                    <span className="v">{e.evidenceMetaVal}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-h">
              <h3>{S.expedienteE1.historyTitle}</h3>
              <span className="sp" />
              <span className="sub">{e.historySub}</span>
            </div>
            <div className="panel-b">
              <TimelineE2 lockchip={e.lockchip} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="panel">
            <div className="panel-h">
              <h3>Métrica clave</h3>
            </div>
            <div className="panel-b">
              <div className="bighero">
                <div className="b num">{e.heroMetric}</div>
                <div className="l">{e.heroLabel}</div>
                <div className="s">{e.heroSub}</div>
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-h">
              <h3>{e.perfTitle}</h3>
            </div>
            <div className="panel-b">
              <div className="kpis kpis-inline">
                <KpiCard label={e.perfScreenings} value="34,812" sparkWidth={80} />
                <KpiCard label={e.perfMatches} value="128" sparkWidth={40} />
                <KpiCard variant="hero" label={e.perfEscalated} value="128" sparkWidth={50} />
                <KpiCard
                  label={e.perfUnreviewed}
                  value="0"
                  sparkWidth={10}
                />
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-h">
              <h3>{e.costTitle}</h3>
            </div>
            <div className="panel-b">
              <div className="riskrow">
                <div className="rk a">
                  <div className="n num">RD$ 16.8K</div>
                  <div className="l">{e.costEmployee}</div>
                </div>
                <div className="vs">{e.costVs}</div>
                <div className="rk b">
                  <div className="n">
                    Hallazgo SB
                    <br />
                    155-17
                  </div>
                  <div className="l">{e.costSanctionSub}</div>
                </div>
              </div>
              <div className="riskbar">{e.riskbar}</div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-h">
              <h3>{e.evidenceTitle}</h3>
              <span className="sp" />
              <span className="sub mono">SHA-256</span>
            </div>
            <div className="panel-b">
              <SealCard
                title="Sello de elevación · coincidencia 82%"
                hash="0x9b34c0a71e…c05"
                stamp="Emitido 09:41:58 AST · caso bajo autorización humana"
              />
              <SealCard
                title="Sello de cribado · lote 34,812"
                hash="0x8b03c17742…5ee"
                stamp="Emitido 09:37:40 AST · inmutable"
              />
            </div>
          </div>
          <div className="panel">
            <div className="panel-h">
              <h3>{e.liveTitle}</h3>
            </div>
            <div className="panel-b">
              <NautaLiveView
                taskName={NAUTA_LIVE_DEFAULT_TASK}
                variant="slot"
                idleHeading={e.liveHeading}
                idleBody={e.liveBody}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TimelineE2({ lockchip }: { lockchip: string }) {
  return (
    <>
      <div className="tl">
        <div className="tm">09:41:58</div>
        <div className="ln">
          <div className="nd warn" />
        </div>
        <div className="bd">
          <div className="t">
            Coincidencia parcial 82% · <strong style={{ color: "var(--warn)", fontWeight: 500 }}>elevada a humano</strong>
          </div>
          <div className="d">Cliente vs. lista OFAC (SDN) · similitud 82% · el empleado no decidió</div>
          <span className="lockchip">{lockchip}</span>
        </div>
      </div>
      <div className="tl">
        <div className="tm">09:39:12</div>
        <div className="ln">
          <div className="nd crit" />
        </div>
        <div className="bd">
          <div className="t">Coincidencia exacta · apertura bloqueada</div>
          <div className="d">Cliente vs. lista ONU · similitud 100% · bloqueo automático y notificación</div>
          <div className="h">◱ 0x4f21a7…d90 · evidencia sellada</div>
        </div>
      </div>
      <div className="tl">
        <div className="tm">09:37:40</div>
        <div className="ln">
          <div className="nd ok" />
        </div>
        <div className="bd">
          <div className="t">1,204 cribados sin coincidencia</div>
          <div className="d">Lote matutino · OFAC + ONU + locales · limpio</div>
          <div className="h">◱ 0x8b03c1…5ee · evidencia sellada</div>
        </div>
      </div>
      <div className="tl">
        <div className="tm">09:24:02</div>
        <div className="ln">
          <div className="nd seal" />
        </div>
        <div className="bd">
          <div className="t">Listas restrictivas sincronizadas</div>
          <div className="d">OFAC y ONU actualizadas a la última versión publicada</div>
          <div className="h">◱ 0x1c77e0…a42 · versión sellada</div>
        </div>
      </div>
    </>
  );
}
