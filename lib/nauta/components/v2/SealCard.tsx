import { S } from "@/lib/nauta/strings";

export function SealCard({
  title,
  hash,
  stamp,
}: {
  title: string;
  hash: string;
  stamp: string;
}) {
  return (
    <div className="seal-card">
      <div className="seal-emb" aria-hidden>
        ◱
      </div>
      <div className="info">
        <div className="t">{title}</div>
        <div className="m">{hash}</div>
        <div className="s">{stamp}</div>
      </div>
      <div className="vf">{S.seal.verified}</div>
    </div>
  );
}
