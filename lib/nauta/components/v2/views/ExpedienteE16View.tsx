import { NAUTA_E16_DEFAULT_TASK } from "@/lib/nauta/freeformConfig";
import { NautaLiveView } from "@/lib/nauta/components/NautaLiveView";
import { S } from "@/lib/nauta/strings";
import { RiskChip } from "../RiskChip";

export function ExpedienteE16View({ onOpenSupervision }: { onOpenSupervision?: () => void }) {
  const e = S.expedienteE16;
  return (
    <>
      <div className="exp-head">
        <div className="big">E16</div>
        <div className="who">
          <h2>{e.title}</h2>
          <div className="cd">{e.code}</div>
          <div className="tags">
            <span className="pill listo">{e.tagListo}</span>
            <RiskChip level="medio" />
          </div>
        </div>
      </div>
      <div className="grid-2">
        <div className="panel">
          <div className="panel-h">
            <h3>{e.profileTitle}</h3>
          </div>
          <div className="panel-b" style={{ fontSize: 13, color: "var(--t1)", lineHeight: 1.65 }}>
            {e.profileBody}
          </div>
        </div>
        <div className="panel">
          <div className="panel-h">
            <h3>{e.liveTitle}</h3>
          </div>
          <div className="panel-b">
            <NautaLiveView
              taskName={NAUTA_E16_DEFAULT_TASK}
              allowsFreeform
              variant="panel"
              onOpenSupervision={onOpenSupervision}
            />
          </div>
        </div>
      </div>
    </>
  );
}
