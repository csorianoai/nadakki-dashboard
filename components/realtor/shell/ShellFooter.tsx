import { RT } from "@/lib/realtor/tokens";

/** Pie del armazón: solo se monta en DEMO. */
export function ShellFooter() {
  return (
    <footer data-testid="shell-footer" style={{ padding: "12px 40px", fontSize: 12, color: RT.muted, borderTop: `1px solid ${RT.line}` }}>
      DEMO · datos sintéticos
    </footer>
  );
}
