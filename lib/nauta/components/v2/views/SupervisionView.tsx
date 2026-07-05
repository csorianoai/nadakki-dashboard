"use client";

import { useState } from "react";
import type { NautaApprovalItem } from "@/lib/nauta/catalogMeta";
import { NAUTA_APPROVALS_MOCK } from "@/lib/nauta/catalogMeta";
import { S } from "@/lib/nauta/strings";
import { ApprovalRow } from "../ApprovalRow";
import { EmptyStateLogro } from "../EmptyStateLogro";

export function SupervisionView({
  pendingCount,
  onPendingChange,
}: {
  pendingCount: number;
  onPendingChange: (n: number) => void;
}) {
  const [queue, setQueue] = useState<NautaApprovalItem[]>(NAUTA_APPROVALS_MOCK);
  const pending = pendingCount;
  const empty = pending <= 0 || queue.length === 0;

  const decide = (id: string) => {
    setQueue((q) => q.filter((item) => item.id !== id));
    onPendingChange(Math.max(0, pending - 1));
  };

  return (
    <>
      <div className="hitl">
        <div className="ic" aria-hidden>
          ◈
        </div>
        <div>
          <h3>{S.super.bannerTitle}</h3>
          <p>{S.super.bannerBody}</p>
        </div>
        <div className="n">
          <b className="num">{pending}</b>
          <span>{S.super.pendingLabel}</span>
        </div>
      </div>
      <div className="panel">
        <div className="panel-h">
          <h3>{S.super.queueTitle}</h3>
          <span className="sp" />
          <span className="sub">{S.super.queueSub}</span>
        </div>
        {!empty ? (
          <>
            <div className="aqh">
              <span />
              <span>{S.super.colTask}</span>
              <span>{S.super.colEmployee}</span>
              <span>{S.super.colEvidence}</span>
              <span style={{ textAlign: "right" }}>{S.super.colDecision}</span>
            </div>
            <div className="aq">
              {queue.map((item) => (
                <ApprovalRow key={item.id} item={item} onDecide={decide} />
              ))}
            </div>
          </>
        ) : (
          <EmptyStateLogro />
        )}
      </div>
    </>
  );
}
