import type { NautaActivityItem } from "@/lib/nauta/catalogMeta";

export function ActivityFeedItem({ item }: { item: NautaActivityItem }) {
  const parts = item.text.split(/(E\d+)/);
  return (
    <div className="fi">
      <span className={`fd ${item.dot}`} aria-hidden />
      <div>
        <div className="ft">
          {parts.map((part, i) =>
            /^E\d+$/.test(part) ? <b key={i}>{part}</b> : part.includes("autorización humana") ? (
              <span key={i}>
                {part.split("autorización humana")[0]}
                <b>autorización humana</b>
              </span>
            ) : (
              part
            ),
          )}
        </div>
        <div className="fm">{item.meta}</div>
      </div>
    </div>
  );
}
