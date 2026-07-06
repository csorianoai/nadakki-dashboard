import { S } from "@/lib/nauta/strings";

export function EmptyStateLogro() {
  return (
    <div className="empty">
      <div className="sl" aria-hidden>
        ◱
      </div>
      <h3>{S.super.emptyTitle}</h3>
      <p>{S.super.emptyBody}</p>
      <div className="st">{S.super.emptyStamp}</div>
    </div>
  );
}
