"use client";

type Props = {
  tariff: string;
  range: string;
  current?: boolean;
};

export function VersionRow({ tariff, range, current }: Props) {
  return (
    <div className="fm-ui-version-row">
      <span className="fm-ui-version-dot" aria-hidden />
      <span className="fm-ui-version-tariff">{tariff}</span>
      <span style={{ color: "var(--fm-sub)" }}>{range}</span>
      {current ? <span className="fm-ui-version-tag">ACTUAL</span> : null}
    </div>
  );
}
