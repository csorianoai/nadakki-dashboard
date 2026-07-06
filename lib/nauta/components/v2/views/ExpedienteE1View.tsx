import { S } from "@/lib/nauta/strings";
import { KpiCard } from "../KpiCard";
import { SealCard } from "../SealCard";
import { RiskChip } from "../RiskChip";

export function ExpedienteE1View() {
  const e = S.expedienteE1;
  return (
    <>
      <div className="exp-head">
        <div className="big">E1</div>
        <div className="who">
          <h2>{e.title}</h2>
          <div className="cd">{e.code}</div>
          <div className="tags">
            <span className="pill listo">{e.tagListo}</span>
            <RiskChip level="alto" />
            <span className="pill">{e.tagSupervisor("Lic. C. Disla")}</span>
          </div>
        </div>
        <div className="col-r">
          <div className="kv">
            <div className="row">
              <span className="k">{e.metaRegistered}</span>
              <span className="v">{e.metaRegisteredVal}</span>
            </div>
            <div className="row">
              <span className="k">{e.metaSchedule}</span>
              <span className="v">{e.metaScheduleVal}</span>
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
            </div>
            <div className="panel-b" style={{ fontSize: 13, color: "var(--t1)", lineHeight: 1.65 }}>
              {e.profileBody}
              <div className="kv" style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                <div className="row">
                  <span className="k">{e.marco}</span>
                  <span className="v">{e.marcoVal}</span>
                </div>
                <div className="row">
                  <span className="k">{e.integraciones}</span>
                  <span className="v">{e.integracionesVal}</span>
                </div>
                <div className="row">
                  <span className="k">{e.umbral}</span>
                  <span className="v">{e.umbralVal}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-h">
              <h3>{e.historyTitle}</h3>
              <span className="sp" />
              <span className="sub">{e.historySub}</span>
            </div>
            <div className="panel-b">
              <TimelineE1 />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="panel">
            <div className="panel-h">
              <h3>{e.perfTitle}</h3>
            </div>
            <div className="panel-b">
              <div className="kpis kpis-inline">
                <KpiCard variant="normal" label="Verificaciones" value="6,318" sparkWidth={60} />
                <KpiCard variant="hero" label="Tasa de éxito" value="99.4" unit="%" sparkWidth={99} />
                <KpiCard label="Elevadas a humano" value="41" sparkWidth={30} />
                <KpiCard label="Tiempo medio" value="3.1" unit="s" sparkWidth={85} />
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-h">
              <h3>{e.costTitle}</h3>
            </div>
            <div className="panel-b">
              <div className="cost">
                <div className="side hu">
                  <div className="n num">186 h</div>
                  <div className="l">{e.costHuman}</div>
                </div>
                <div className="vs">→</div>
                <div className="side di">
                  <div className="n num">RD$ 14.2K</div>
                  <div className="l">{e.costEmployee}</div>
                </div>
              </div>
              <div className="savebar">{e.costSavebar}</div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-h">
              <h3>{e.evidenceTitle}</h3>
              <span className="sp" />
              <span className="sub mono">{e.evidenceSub}</span>
            </div>
            <div className="panel-b">
              <SealCard
                title="Sello de verificación · exp. 2024-08812"
                hash="0x7d21e9b8c4a1f0d3e6…9a4f"
                stamp="Emitido 09:41:58 AST · inmutable"
              />
              <SealCard
                title="Sello de notarización · exp. 2024-08809"
                hash="0x3b90c4772d18ba5fe1…3e77"
                stamp="Emitido 09:38:11 AST · inmutable"
              />
            </div>
          </div>
          <div className="panel">
            <div className="panel-h">
              <h3>{e.liveTitle}</h3>
            </div>
            <div className="panel-b">
              <LiveSlot heading={e.liveHeading} body={e.liveBody} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TimelineE1() {
  return (
    <>
      <div className="tl">
        <div className="tm">09:41:58</div>
        <div className="ln">
          <div className="nd ok" />
        </div>
        <div className="bd">
          <div className="t">Identidad verificada · exp. 2024-08812</div>
          <div className="d">Cédula válida · prueba de vida superada · 3.2 s</div>
          <div className="h">◱ 0x7d21e9…a4f · evidencia sellada</div>
        </div>
      </div>
      <div className="tl">
        <div className="tm">09:38:11</div>
        <div className="ln">
          <div className="nd seal" />
        </div>
        <div className="bd">
          <div className="t">Expediente notarizado · exp. 2024-08809</div>
          <div className="d">Paquete documental cerrado y firmado</div>
          <div className="h">◱ 0x3b90c4…e77 · evidencia sellada</div>
        </div>
      </div>
      <div className="tl">
        <div className="tm">09:31:44</div>
        <div className="ln">
          <div className="nd warn" />
        </div>
        <div className="bd">
          <div className="t">Elevado a autorización humana · exp. 2024-08805</div>
          <div className="d">Domicilio no coincide con el declarado · derivado a Lic. C. Disla</div>
        </div>
      </div>
      <div className="tl">
        <div className="tm">09:24:02</div>
        <div className="ln">
          <div className="nd ok" />
        </div>
        <div className="bd">
          <div className="t">Identidad verificada · exp. 2024-08801</div>
          <div className="d">Cédula válida · prueba de vida superada · 2.9 s</div>
          <div className="h">◱ 0x91af22…10b · evidencia sellada</div>
        </div>
      </div>
    </>
  );
}

function LiveSlot({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="live-slot">
      <div className="ring">
        ▷
        <span className="pulse" aria-hidden />
      </div>
      <h4>{heading}</h4>
      <p>{body}</p>
    </div>
  );
}
