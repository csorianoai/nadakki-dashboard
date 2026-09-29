import { DealerShell } from "@/components/dealer-management/shell/DealerShell";
import { dealerFontVariables } from "@/components/dealer-management/shell/DealerFonts";

/**
 * Layout del panel del dealer (F2).
 *
 * Antes este fichero pintaba la tercera navegacion ("Dealer Management"), que
 * se sumaba al sidebar global de cores y a la barra del marketplace. Ahora
 * monta el chrome unico y aplica las variables de fuente del panel
 * (Sora / IBM Plex Sans / IBM Plex Mono, self-hosted con next/font).
 */
export default function DealerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={dealerFontVariables}>
      <DealerShell>{children}</DealerShell>
    </div>
  );
}
