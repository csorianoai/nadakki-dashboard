import { NAUTA_ACTIVITY_MOCK } from "@/lib/nauta/catalogMeta";
import { formatDopCompact } from "@/lib/nauta/format";
import { S } from "@/lib/nauta/strings";
import { ActivityFeedItem } from "../ActivityFeedItem";

const DEPT_LOAD = [
  { label: "D1 · Cumplimiento", pct: 92 },
  { label: "D4 · Operaciones", pct: 48 },
  { label: "D0 · Plataforma", pct: 41 },
  { label: "D3 · Legal", pct: 12 },
  { label: "D2 · Crédito", pct: 10 },
  { label: "D5 · Marketing", pct: 6 },
];

export function TableroView({ hoursSaved }: { hoursSaved: number }) {
  return (
    <div className="grid-2">
      <div className="panel">
        <div className="panel-h">
          <h3>{S.tablero.liveTitle}</h3>
          <span className="sub">{S.tablero.liveSub}</span>
          <span className="sp" />
          <span className="clock" style={{ padding: "5px 10px" }}>
            <span className="pulse" aria-hidden />
            {S.tablero.realtime}
          </span>
        </div>
        <div className="panel-b feed">
          {NAUTA_ACTIVITY_MOCK.slice(0, 5).map((item) => (
            <ActivityFeedItem key={item.id} item={item} />
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="panel">
          <div className="panel-h">
            <h3>{S.tablero.loadTitle}</h3>
            <span className="sp" />
            <span className="sub">{S.tablero.loadSub}</span>
          </div>
          <div className="panel-b load">
            {DEPT_LOAD.map((row) => (
              <div key={row.label} className="lr">
                <span className="dn">{row.label}</span>
                <span className="ln2">
                  <i style={{ width: `${row.pct}%` }} />
                </span>
                <span className="pc">{row.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-h">
            <h3>{S.tablero.returnTitle}</h3>
            <span className="sp" />
          </div>
          <div className="panel-b">
            <div className="cost">
              <div className="side hu">
                <div className="n num">{formatDopCompact(1_050_000)}</div>
                <div className="l">{S.tablero.humanCost}</div>
              </div>
              <div className="vs">{S.tablero.vs}</div>
              <div className="side di">
                <div className="n num">{formatDopCompact(214_500)}</div>
                <div className="l">{S.tablero.digitalPayroll}</div>
              </div>
            </div>
            <div className="savebar">
              {S.tablero.savebar(formatDopCompact(835_500), hoursSaved.toLocaleString("en-US"))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
