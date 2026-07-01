type Props = {
  screen: string;
};

/** M2 placeholder — replaced by screen implementations in M5/M6. */
export function MonetizacionScreenPlaceholder({ screen }: Props) {
  return (
    <section aria-labelledby="fm-screen-heading">
      <h2 id="fm-screen-heading" className="fm-mono" style={{ fontSize: 13, color: "var(--fm-sub)" }}>
        {screen}
      </h2>
      <p style={{ marginTop: 12, color: "var(--fm-ink-soft)", fontSize: 14 }}>
        Pantalla en construcción · datos mock en M4/M5.
      </p>
    </section>
  );
}
