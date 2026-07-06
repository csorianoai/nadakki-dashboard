"use client";

import { useState } from "react";
import { NAUTA_ACTIVITY_MOCK } from "@/lib/nauta/catalogMeta";
import { S } from "@/lib/nauta/strings";
import { ActivityFeedItem } from "./ActivityFeedItem";

export function LiveActivityColumn() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`live-col${collapsed ? " min" : ""}`}>
      <div className="live-panel">
        <div className="lh">
          <h4>{S.activity.title}</h4>
          <span className="pulse" aria-hidden />
          <button
            type="button"
            className="cl"
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? S.activity.expand : S.activity.collapse}
          </button>
        </div>
        <div className="live-body">
          {NAUTA_ACTIVITY_MOCK.map((item) => (
            <ActivityFeedItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </aside>
  );
}
