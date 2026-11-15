import { PropiedadesPanel } from "@/components/realtor/propiedades/PropiedadesPanel";
import { MlsListingsPanel } from "@/components/realtor/mls/MlsListingsPanel";

export default function PropiedadesPage() {
  return (
    <>
      <PropiedadesPanel />
      {/* MLS IDX panel: renders only on baylara.com when BRIDGE_SERVER_TOKEN is set */}
      <MlsListingsPanel />
    </>
  );
}
